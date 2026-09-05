import json
import os
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from app.models import Show, Episode, Artwork
from app.config import settings

def load_reference_specs():
    ref_path = settings.REFERENCE_PATH
    if os.path.exists(ref_path):
        with open(ref_path, "r") as f:
            return json.load(f)
    return {
        "sections": ["featured", "series", "minisodes", "songs"],
        "categories": ["adventure", "folk", "friendship", "india", "language", "learning", "maths", "music", "nature", "reading", "science", "singalong", "stories", "travel", "values"],
        "languages": ["en", "hi"]
    }

def generate_validation_report(db: Session) -> Dict[str, Any]:
    ref = load_reference_specs()
    allowed_sections = set(ref.get("sections", []))
    allowed_categories = set(ref.get("categories", []))
    allowed_languages = set(ref.get("languages", []))

    shows = db.query(Show).all()
    episodes = db.query(Episode).all()
    artworks = db.query(Artwork).all()

    # Pre-index artworks by entity
    # Key: (entity_type, entity_id) -> set of artwork types
    artwork_map: Dict[tuple, set] = {}
    for art in artworks:
        key = (art.entity_type, str(art.entity_id))
        if key not in artwork_map:
            artwork_map[key] = set()
        artwork_map[key].add(art.type)

    issues: List[Dict[str, Any]] = []
    shows_with_issues = set()

    # 1. Check Shows validation
    for show in shows:
        show_artworks = artwork_map.get(("show", str(show.slug)), set()) | artwork_map.get(("show", str(show.id)), set())
        
        # Rule: A published show must have a valid section
        if show.status == "published":
            if not show.section:
                shows_with_issues.add(show.title)
                issues.append({
                    "category": "MISSING_SECTION",
                    "entity_type": "show",
                    "entity_id": show.slug,
                    "show_title": show.title,
                    "episode_title": None,
                    "message": f"Show '{show.title}' is marked as published but has no section assigned.",
                    "actionable_fix": f"Assign a section ({', '.join(allowed_sections)}) to show '{show.title}'."
                })
            elif show.section not in allowed_sections:
                shows_with_issues.add(show.title)
                issues.append({
                    "category": "INVALID_SECTION",
                    "entity_type": "show",
                    "entity_id": show.slug,
                    "show_title": show.title,
                    "episode_title": None,
                    "message": f"Show '{show.title}' has invalid section '{show.section}'.",
                    "actionable_fix": f"Change section of '{show.title}' to one of: {', '.join(allowed_sections)}."
                })

        # Category validity
        if show.categories:
            for cat in show.categories:
                if cat not in allowed_categories:
                    shows_with_issues.add(show.title)
                    issues.append({
                        "category": "INVALID_CATEGORY",
                        "entity_type": "show",
                        "entity_id": show.slug,
                        "show_title": show.title,
                        "episode_title": None,
                        "message": f"Show '{show.title}' has unrecognized category '{cat}'.",
                        "actionable_fix": f"Remove or replace category '{cat}' on show '{show.title}'."
                    })

    # 2. Check Episodes validation
    cg_lang_tracker: Dict[tuple, List[str]] = {}

    for ep in episodes:
        show = ep.show
        show_title = show.title if show else "Unknown Show"
        show_slug = show.slug if show else ""

        # Track (content_group, language) uniqueness
        cg_key = (ep.content_group, ep.language)
        if cg_key not in cg_lang_tracker:
            cg_lang_tracker[cg_key] = []
        cg_lang_tracker[cg_key].append(ep.id)

        # Check published episode requirements
        if ep.status == "published":
            # Rule: Duration required
            if not ep.duration_seconds or ep.duration_seconds <= 0:
                shows_with_issues.add(show_title)
                issues.append({
                    "category": "MISSING_DURATION",
                    "entity_type": "episode",
                    "entity_id": ep.id,
                    "show_title": show_title,
                    "episode_title": ep.episode_title,
                    "message": f"Episode '{ep.episode_title}' ({ep.id}) is published but missing duration.",
                    "actionable_fix": f"Set duration_seconds > 0 for episode '{ep.episode_title}' ({ep.id})."
                })

            # Rule: Artwork required (poster, banner, thumbnail on episode OR inherited from show)
            ep_art = artwork_map.get(("episode", ep.id), set())
            sh_art = artwork_map.get(("show", show_slug), set()) | artwork_map.get(("show", str(ep.show_id)), set())
            combined_art = ep_art | sh_art
            
            missing_art = {"poster", "banner", "thumbnail"} - combined_art
            if missing_art:
                shows_with_issues.add(show_title)
                issues.append({
                    "category": "MISSING_ARTWORK",
                    "entity_type": "episode",
                    "entity_id": ep.id,
                    "show_title": show_title,
                    "episode_title": ep.episode_title,
                    "message": f"Episode '{ep.episode_title}' ({ep.id}) is published but missing required artwork: {', '.join(sorted(missing_art))}.",
                    "actionable_fix": f"Upload missing artwork ({', '.join(sorted(missing_art))}) for episode '{ep.episode_title}' or show '{show_title}'."
                })

        # Language validity
        if ep.language not in allowed_languages:
            shows_with_issues.add(show_title)
            issues.append({
                "category": "INVALID_LANGUAGE",
                "entity_type": "episode",
                "entity_id": ep.id,
                "show_title": show_title,
                "episode_title": ep.episode_title,
                "message": f"Episode '{ep.episode_title}' ({ep.id}) has invalid language '{ep.language}'.",
                "actionable_fix": f"Set language of episode '{ep.id}' to one of: {', '.join(allowed_languages)}."
            })

    # 3. Check Duplicate Content Group + Language pairs
    for (cg, lang), ep_ids in cg_lang_tracker.items():
        if len(ep_ids) > 1:
            for ep_id in ep_ids:
                ep = db.query(Episode).filter(Episode.id == ep_id).first()
                stitle = ep.show.title if ep and ep.show else "Unknown Show"
                shows_with_issues.add(stitle)
                issues.append({
                    "category": "DUPLICATE_CONTENT_GROUP_LANG",
                    "entity_type": "episode",
                    "entity_id": ep_id,
                    "show_title": stitle,
                    "episode_title": ep.episode_title if ep else ep_id,
                    "message": f"Conflict for (content_group: '{cg}', language: '{lang}'). Episodes sharing this: {', '.join(ep_ids)}.",
                    "actionable_fix": f"Ensure content_group '{cg}' has at most one episode per language. Reassign or delete duplicate {ep_id}."
                })

    # Group issues by category
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for issue in issues:
        cat = issue["category"]
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(issue)

    is_publishable = len(issues) == 0

    return {
        "is_publishable": is_publishable,
        "total_issues": len(issues),
        "issues_by_category": grouped,
        "shows_with_issues": list(sorted(shows_with_issues)),
        "all_issues": issues
    }
