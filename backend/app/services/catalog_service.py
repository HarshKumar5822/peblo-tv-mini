import json
import hashlib
import datetime
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from app.models import Show, Season, Episode, Artwork, PublishRun
from app.storage import get_storage_provider
from app.services.validation_service import generate_validation_report, load_reference_specs

class PublishError(Exception):
    pass

def publish_catalog(db: Session, triggered_by: str = "admin") -> Dict[str, Any]:
    # 1. Run Validation Check
    report = generate_validation_report(db)
    if not report["is_publishable"]:
        # Record failed run
        failed_run = PublishRun(
            run_at=datetime.datetime.utcnow(),
            triggered_by=triggered_by,
            status="failed",
            error_log=f"Validation failed with {report['total_issues']} issues.",
            logs_json=report["all_issues"]
        )
        db.add(failed_run)
        db.commit()
        raise PublishError(f"Catalogue publish blocked by {report['total_issues']} validation issue(s). Check /admin/validation-report.")

    # 2. Fetch all published shows & episodes
    published_shows = db.query(Show).filter(Show.status == "published").order_by(Show.title.asc()).all()
    artworks = db.query(Artwork).all()

    # Pre-index artwork
    artwork_map: Dict[tuple, Dict[str, str]] = {}
    for art in artworks:
        key = (art.entity_type, str(art.entity_id))
        if key not in artwork_map:
            artwork_map[key] = {}
        artwork_map[key][art.type] = art.file_path

    ref = load_reference_specs()
    sections_order = ref.get("sections", ["featured", "series", "minisodes", "songs"])
    
    sections_data: Dict[str, List[Dict[str, Any]]] = {sec: [] for sec in sections_order}
    all_published_shows = []

    total_episodes_count = 0
    total_collapsed_episodes_count = 0

    for show in published_shows:
        show_art = artwork_map.get(("show", show.slug), {}) or artwork_map.get(("show", str(show.id)), {})
        
        # Get published episodes for this show
        pub_episodes = db.query(Episode).filter(
            Episode.show_id == show.id,
            Episode.status == "published"
        ).order_by(Episode.season_number.asc(), Episode.episode_number.asc()).all()

        total_episodes_count += len(pub_episodes)

        # Group episodes by content_group
        cg_groups: Dict[str, List[Episode]] = {}
        for ep in pub_episodes:
            cg = ep.content_group
            if cg not in cg_groups:
                cg_groups[cg] = []
            cg_groups[cg].append(ep)

        # Collapse content groups into single catalogue entries
        collapsed_entries = []
        for cg, ep_list in cg_groups.items():
            primary = ep_list[0]
            languages = [e.language for e in ep_list]
            variants = {}
            for e in ep_list:
                variants[e.language] = {
                    "episode_id": e.id,
                    "episode_title": e.episode_title,
                    "duration_seconds": e.duration_seconds
                }
            
            ep_art = artwork_map.get(("episode", primary.id), {})
            # Merge show artwork fallback
            effective_art = {
                "poster": ep_art.get("poster") or show_art.get("poster", ""),
                "banner": ep_art.get("banner") or show_art.get("banner", ""),
                "thumbnail": ep_art.get("thumbnail") or show_art.get("thumbnail", "")
            }

            collapsed_entries.append({
                "content_group": cg,
                "season_number": primary.season_number,
                "episode_number": primary.episode_number,
                "default_title": primary.episode_title,
                "languages": sorted(languages),
                "variants": variants,
                "artwork": effective_art
            })
            total_collapsed_episodes_count += 1

        # Separate trailers (Season 0) vs normal seasons
        trailers = [entry for entry in collapsed_entries if entry["season_number"] == 0]
        normal_episodes = [entry for entry in collapsed_entries if entry["season_number"] > 0]

        # Group normal episodes by season_number
        seasons_dict: Dict[int, List[Dict[str, Any]]] = {}
        for entry in normal_episodes:
            sn = entry["season_number"]
            if sn not in seasons_dict:
                seasons_dict[sn] = []
            seasons_dict[sn].append(entry)

        seasons_list = []
        for sn in sorted(seasons_dict.keys()):
            seasons_list.append({
                "season_number": sn,
                "episodes": sorted(seasons_dict[sn], key=lambda x: x["episode_number"])
            })

        show_catalog_obj = {
            "id": show.id,
            "slug": show.slug,
            "title": show.title,
            "section": show.section,
            "synopsis": show.synopsis,
            "categories": show.categories or [],
            "artwork": {
                "poster": show_art.get("poster", ""),
                "banner": show_art.get("banner", ""),
                "thumbnail": show_art.get("thumbnail", "")
            },
            "trailers": sorted(trailers, key=lambda x: x["episode_number"]),
            "seasons": seasons_list,
            "total_episodes": len(collapsed_entries)
        }

        all_published_shows.append(show_catalog_obj)
        if show.section in sections_data:
            sections_data[show.section].append(show_catalog_obj)

    # Sort shows inside each section deterministically by title
    for sec in sections_data:
        sections_data[sec].sort(key=lambda s: s["title"])

    now_iso = datetime.datetime.utcnow().isoformat() + "Z"
    catalog_json = {
        "version": "1.0",
        "published_at": now_iso,
        "sections": sections_data,
        "all_shows": sorted(all_published_shows, key=lambda s: s["title"]),
        "meta": {
            "total_shows": len(all_published_shows),
            "total_episodes": total_episodes_count,
            "total_collapsed_episodes": total_collapsed_episodes_count
        }
    }

    catalog_bytes = json.dumps(catalog_json, indent=2).encode("utf-8")
    catalogue_hash = hashlib.sha256(catalog_bytes).hexdigest()

    # 3. Write catalogue atomically via StorageProvider
    storage = get_storage_provider()
    published_url = storage.atomic_write(catalog_bytes, "catalogue.json")

    # 4. Record successful publish run in DB
    publish_run = PublishRun(
        run_at=datetime.datetime.utcnow(),
        triggered_by=triggered_by,
        status="success",
        shows_count=len(all_published_shows),
        episodes_count=total_episodes_count,
        catalogue_hash=catalogue_hash,
        error_log=None,
        logs_json=[]
    )
    db.add(publish_run)
    db.commit()
    db.refresh(publish_run)

    return {
        "publish_run_id": publish_run.id,
        "published_at": now_iso,
        "status": "success",
        "published_url": published_url,
        "catalogue_hash": catalogue_hash,
        "shows_published": len(all_published_shows),
        "episodes_published": total_episodes_count,
        "collapsed_episodes": total_collapsed_episodes_count
    }
