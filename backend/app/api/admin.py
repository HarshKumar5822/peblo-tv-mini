from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.api.deps import get_db, require_role, User
from app.models import PublishRun, Artwork
from app.schemas import ValidationReport, PublishRunResponse
from app.services.validation_service import generate_validation_report
from app.services.catalog_service import publish_catalog, PublishError
from app.services.artwork_service import validate_and_process_artwork, ArtworkValidationError
from app.storage import get_storage_provider

router = APIRouter(prefix="/admin", tags=["Admin CMS & Publishing"])

@router.get("/validation-report", response_model=ValidationReport, summary="Get publish validation report")
def get_validation_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    """
    Returns structured list of everything currently blocking publish,
    grouped so an editor can fix it directly.
    """
    report = generate_validation_report(db)
    return ValidationReport(
        is_publishable=report["is_publishable"],
        total_issues=report["total_issues"],
        issues_by_category=report["issues_by_category"],
        shows_with_issues=report["shows_with_issues"]
    )


@router.post("/catalog/publish", summary="Trigger catalogue publish run (Admin only)")
def trigger_publish(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["admin"]))
):
    """
    Builds published catalogue JSON and writes it atomically to storage.
    Enforces admin role strictly.
    """
    try:
        res = publish_catalog(db, triggered_by=f"{current_user.username} ({current_user.role})")
        return res
    except PublishError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected publishing error: {str(e)}"
        )


@router.get("/publish-history", response_model=List[PublishRunResponse], summary="Get publish history")
def get_publish_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    """Returns list of past publish runs with timestamp, counts, and status."""
    runs = db.query(PublishRun).order_by(PublishRun.run_at.desc()).limit(50).all()
    return runs


@router.post("/artwork/upload", summary="Upload show or episode artwork with dimension/aspect ratio validation")
async def upload_artwork(
    entity_type: str = Form(..., description="'show' or 'episode'"),
    entity_id: str = Form(..., description="show slug/id or episode_id"),
    artwork_type: str = Form(..., description="'poster', 'banner', or 'thumbnail'"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    """
    Validates image specs (aspect ratio, dimensions, max 200 KB ceiling)
    and saves to storage. Returns actionable editor errors if invalid.
    """
    if entity_type not in ["show", "episode"]:
        raise HTTPException(status_code=400, detail="entity_type must be 'show' or 'episode'")
    if artwork_type not in ["poster", "banner", "thumbnail"]:
        raise HTTPException(status_code=400, detail="artwork_type must be 'poster', 'banner', or 'thumbnail'")

    contents = await file.read()
    
    try:
        spec_info = validate_and_process_artwork(contents, artwork_type, file.filename or "image.jpg")
    except ArtworkValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

    # Save via storage provider
    storage_key = f"artworks/{entity_type}s/{entity_id}/{artwork_type}{spec_info['ext']}"
    storage = get_storage_provider()
    public_url = storage.save(contents, storage_key)

    # Upsert artwork record in DB
    existing = db.query(Artwork).filter(
        Artwork.entity_type == entity_type,
        Artwork.entity_id == entity_id,
        Artwork.type == artwork_type
    ).first()

    if existing:
        existing.file_path = public_url
        existing.width = spec_info["width"]
        existing.height = spec_info["height"]
        existing.file_size_kb = spec_info["file_size_kb"]
        existing.aspect_ratio = spec_info["aspect_ratio"]
        existing.mime_type = spec_info["mime_type"]
    else:
        existing = Artwork(
            entity_type=entity_type,
            entity_id=entity_id,
            type=artwork_type,
            file_path=public_url,
            width=spec_info["width"],
            height=spec_info["height"],
            file_size_kb=spec_info["file_size_kb"],
            aspect_ratio=spec_info["aspect_ratio"],
            mime_type=spec_info["mime_type"]
        )
        db.add(existing)

    db.commit()
    db.refresh(existing)

    return {
        "message": f"Successfully uploaded {artwork_type} for {entity_type} {entity_id}.",
        "artwork_id": existing.id,
        "file_path": public_url,
        "width": existing.width,
        "height": existing.height,
        "file_size_kb": existing.file_size_kb,
        "aspect_ratio": existing.aspect_ratio
    }
