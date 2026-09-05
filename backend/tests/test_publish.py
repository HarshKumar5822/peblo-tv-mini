import os
import json
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Show, Episode, Artwork, PublishRun
from app.services.catalog_service import publish_catalog, PublishError
from app.storage import get_storage_provider

def setup_clean_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_publish_blocked_when_validation_fails():
    db = setup_clean_db()
    show = Show(slug="show-1", title="Unfinished Show", section=None, status="published")
    db.add(show)
    db.commit()

    with pytest.raises(PublishError) as exc:
        publish_catalog(db, triggered_by="test_admin")
    assert "Catalogue publish blocked by" in str(exc.value)

    # Check publish run recorded as failed
    run = db.query(PublishRun).order_by(PublishRun.id.desc()).first()
    assert run is not None
    assert run.status == "failed"

def test_successful_atomic_publish():
    db = setup_clean_db()
    show = Show(slug="valid-show", title="Valid Show", section="featured", synopsis="Great show", categories=["adventure"], status="published")
    db.add(show)
    db.flush()

    # Add 2 language variants sharing content_group
    ep_en = Episode(
        id="ep_001", show_id=show.id, season_number=1, episode_number=1,
        episode_title="Pilot English", duration_seconds=500, language="en",
        content_group="valid-show-s01e01", status="published"
    )
    ep_hi = Episode(
        id="ep_002", show_id=show.id, season_number=1, episode_number=1,
        episode_title="Pilot Hindi", duration_seconds=490, language="hi",
        content_group="valid-show-s01e01", status="published"
    )

    art_poster = Artwork(entity_type="show", entity_id=show.slug, type="poster", file_path="/storage/poster.jpg", width=600, height=900, file_size_kb=10.0, aspect_ratio=0.67, mime_type="image/jpeg")
    art_banner = Artwork(entity_type="show", entity_id=show.slug, type="banner", file_path="/storage/banner.jpg", width=1280, height=720, file_size_kb=15.0, aspect_ratio=1.78, mime_type="image/jpeg")
    art_thumb = Artwork(entity_type="show", entity_id=show.slug, type="thumbnail", file_path="/storage/thumb.jpg", width=640, height=360, file_size_kb=5.0, aspect_ratio=1.78, mime_type="image/jpeg")

    db.add_all([ep_en, ep_hi, art_poster, art_banner, art_thumb])
    db.commit()

    res = publish_catalog(db, triggered_by="admin_test")
    assert res["status"] == "success"
    assert res["shows_published"] == 1
    assert res["episodes_published"] == 2
    assert res["collapsed_episodes"] == 1

    # Verify catalogue file content in storage
    storage = get_storage_provider()
    assert storage.exists("catalogue.json")
    content = json.loads(storage.read("catalogue.json").decode("utf-8"))
    
    assert content["meta"]["total_shows"] == 1
    show_entry = content["all_shows"][0]
    assert show_entry["title"] == "Valid Show"
    season_1 = show_entry["seasons"][0]
    ep_entry = season_1["episodes"][0]
    
    # Check language variants collapsing
    assert ep_entry["content_group"] == "valid-show-s01e01"
    assert set(ep_entry["languages"]) == {"en", "hi"}
    assert "en" in ep_entry["variants"]
    assert "hi" in ep_entry["variants"]
