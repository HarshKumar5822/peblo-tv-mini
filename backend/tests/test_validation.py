import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import Show, Episode, Artwork
from app.services.validation_service import generate_validation_report

def setup_test_db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    return Session()

def test_validation_report_flags_published_without_section():
    db = setup_test_db()
    show = Show(slug="test-show", title="Test Show", section=None, status="published")
    db.add(show)
    db.commit()

    report = generate_validation_report(db)
    assert not report["is_publishable"]
    assert "MISSING_SECTION" in report["issues_by_category"]

def test_validation_report_flags_published_episode_missing_duration():
    db = setup_test_db()
    show = Show(slug="test-show", title="Test Show", section="featured", status="published")
    db.add(show)
    db.flush()

    ep = Episode(
        id="ep_test1",
        show_id=show.id,
        season_number=1,
        episode_number=1,
        episode_title="Test Episode",
        duration_seconds=None, # Missing duration!
        language="en",
        content_group="cg-1",
        status="published"
    )
    db.add(ep)
    db.commit()

    report = generate_validation_report(db)
    assert not report["is_publishable"]
    assert "MISSING_DURATION" in report["issues_by_category"]

def test_validation_report_flags_duplicate_content_group():
    db = setup_test_db()
    show = Show(slug="test-show", title="Test Show", section="series", status="published")
    db.add(show)
    db.flush()

    ep1 = Episode(id="ep1", show_id=show.id, season_number=1, episode_number=1, episode_title="Ep 1", duration_seconds=300, language="en", content_group="cg-dup", status="published")
    ep2 = Episode(id="ep2", show_id=show.id, season_number=1, episode_number=2, episode_title="Ep 2", duration_seconds=300, language="en", content_group="cg-dup", status="published")
    db.add_all([ep1, ep2])
    db.commit()

    report = generate_validation_report(db)
    assert not report["is_publishable"]
    assert "DUPLICATE_CONTENT_GROUP_LANG" in report["issues_by_category"]
