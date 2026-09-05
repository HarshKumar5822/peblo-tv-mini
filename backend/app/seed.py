import json
import os
import shutil
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models import Show, Season, Episode, Artwork
from app.storage import get_storage_provider
from app.config import settings

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    seed_file = "seed_shows.json"
    if not os.path.exists(seed_file):
        seed_file = os.path.join(os.path.dirname(__file__), "..", "..", "seed_shows.json")
    if not os.path.exists(seed_file):
        seed_file = "seed_shows.json"
    if not os.path.exists(seed_file):
        print(f"Seed file '{seed_file}' not found. Skipping seeding.")
        return

    with open(seed_file, "r", encoding="utf-8") as f:
        episodes_raw = json.load(f)

    print(f"Loading {len(episodes_raw)} raw episode rows from {seed_file}...")

    # Group shows by slug
    shows_map = {}
    for ep in episodes_raw:
        slug = ep["slug"]
        if slug not in shows_map:
            shows_map[slug] = {
                "title": ep["show_title"],
                "section": ep.get("section"),
                "synopsis": ep.get("synopsis", ""),
                "categories": ep.get("categories", []),
                "status": "published" if ep.get("section") else "draft"
            }

    # 1. Upsert Shows
    show_db_map = {}
    for slug, sdata in shows_map.items():
        existing = db.query(Show).filter(Show.slug == slug).first()
        if not existing:
            existing = Show(
                slug=slug,
                title=sdata["title"],
                section=sdata["section"],
                synopsis=sdata["synopsis"],
                categories=sdata["categories"],
                status=sdata["status"]
            )
            db.add(existing)
            db.flush()
        show_db_map[slug] = existing

    # 2. Upsert Seasons & Episodes
    season_db_map = {} # (show_id, season_number) -> Season
    episodes_count = 0

    for ep_data in episodes_raw:
        show = show_db_map[ep_data["slug"]]
        sn = ep_data.get("season_number", 1)

        season_key = (show.id, sn)
        if season_key not in season_db_map:
            season = db.query(Season).filter(Season.show_id == show.id, Season.season_number == sn).first()
            if not season:
                season_title = "Trailers & Teasers" if sn == 0 else f"Season {sn}"
                season = Season(show_id=show.id, season_number=sn, title=season_title)
                db.add(season)
                db.flush()
            season_db_map[season_key] = season

        season = season_db_map[season_key]
        ep_id = ep_data["episode_id"]

        existing_ep = db.query(Episode).filter(Episode.id == ep_id).first()
        if not existing_ep:
            existing_ep = Episode(
                id=ep_id,
                show_id=show.id,
                season_id=season.id,
                season_number=sn,
                episode_number=ep_data["episode_number"],
                episode_title=ep_data["episode_title"],
                duration_seconds=ep_data.get("duration_seconds"),
                language=ep_data["language"],
                content_group=ep_data["content_group"],
                status=ep_data.get("status", "published")
            )
            db.add(existing_ep)
            episodes_count += 1

    db.commit()
    print(f"Seeded {len(show_db_map)} shows and {episodes_count} episodes into database.")

    # 3. Seed Sample Artworks into storage per episode artwork_available spec
    storage = get_storage_provider()
    sample_files = {
        "poster": ("poster_good.jpg", 600, 900, 2/3),
        "banner": ("banner_good.jpg", 1280, 720, 16/9),
        "thumbnail": ("thumb_good.jpg", 640, 360, 16/9)
    }

    added_art_keys = set()
    seeded_art_count = 0

    for ep_data in episodes_raw:
        art_avail = ep_data.get("artwork_available", [])
        ep_id = ep_data["episode_id"]

        for art_type in art_avail:
            ep_art_key = ("episode", ep_id, art_type)
            if ep_art_key not in added_art_keys and art_type in sample_files:
                sample_filename, w, h, ratio = sample_files[art_type]
                if not os.path.exists(sample_filename):
                    sample_filename = os.path.join(os.path.dirname(__file__), "..", "..", sample_filename)
                
                content = b""
                if os.path.exists(sample_filename):
                    with open(sample_filename, "rb") as sf:
                        content = sf.read()
                    
                key = f"artworks/episodes/{ep_id}/{art_type}.jpg"
                pub_url = storage.save(content, key)

                existing_art = db.query(Artwork).filter(
                    Artwork.entity_type == "episode",
                    Artwork.entity_id == ep_id,
                    Artwork.type == art_type
                ).first()

                if not existing_art:
                    existing_art = Artwork(
                        entity_type="episode",
                        entity_id=ep_id,
                        type=art_type,
                        file_path=pub_url,
                        width=w,
                        height=h,
                        file_size_kb=round(len(content)/1024.0, 2) if content else 10.0,
                        aspect_ratio=round(ratio, 2),
                        mime_type="image/jpeg"
                    )
                    db.add(existing_art)
                    seeded_art_count += 1
                added_art_keys.add(ep_art_key)

    db.commit()
    print(f"Seeded {seeded_art_count} artwork records into database & storage.")
    db.close()

if __name__ == "__main__":
    seed_database()
