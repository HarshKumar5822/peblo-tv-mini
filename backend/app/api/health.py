import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api.deps import get_db
from app.storage import get_storage_provider
from app.models import PublishRun

router = APIRouter(tags=["Health & Monitoring"])

@router.get("/health", summary="System Health and Status Check")
def health_check(db: Session = Depends(get_db)):
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    storage = get_storage_provider()
    storage_status = "healthy"
    try:
        catalog_exists = storage.exists("catalogue.json")
    except Exception as e:
        storage_status = f"unhealthy: {str(e)}"
        catalog_exists = False

    last_run = db.query(PublishRun).order_by(PublishRun.run_at.desc()).first()
    last_publish_info = None
    if last_run:
        last_publish_info = {
            "run_at": last_run.run_at.isoformat(),
            "status": last_run.status,
            "triggered_by": last_run.triggered_by,
            "error_log": last_run.error_log
        }

    is_overall_healthy = (db_status == "healthy") and ("unhealthy" not in storage_status)

    return {
        "status": "ok" if is_overall_healthy else "degraded",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "services": {
            "database": db_status,
            "storage": storage_status,
            "catalogue_published": catalog_exists
        },
        "last_publish_run": last_publish_info,
        "alert_guidance": {
            "primary_alert": "Publish Failure / Stale Catalogue Threshold Alert",
            "reasoning": (
                "Alerting when a catalogue publish fails or when no successful publish has occurred for over 24 hours "
                "ensures content updates reach viewer clients without silent pipeline failures or corrupt catalog deployments."
            )
        }
    }
