from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db, require_role, User
from app.models import Show, Episode, Season, Artwork
from app.schemas import ShowCreate, ShowUpdate, ShowResponse

router = APIRouter(prefix="/shows", tags=["Shows CRUD"])

@router.get("", summary="List shows with filtering and search")
def list_shows(
    section: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    q: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(Show)

    if section:
        query = query.filter(Show.section == section)
    if status_filter:
        query = query.filter(Show.status == status_filter)
    if q:
        search_str = f"%{q}%"
        query = query.filter((Show.title.ilike(search_str)) | (Show.slug.ilike(search_str)))

    total = query.count()
    shows = query.order_by(Show.title.asc()).offset(skip).limit(limit).all()

    # Enrich with artwork and episode count
    res = []
    for s in shows:
        ep_count = db.query(Episode).filter(Episode.show_id == s.id).count()
        arts = db.query(Artwork).filter(Artwork.entity_type == "show", Artwork.entity_id == s.slug).all()
        art_types = [a.type for a in arts]
        
        res.append({
            "id": s.id,
            "slug": s.slug,
            "title": s.title,
            "section": s.section,
            "synopsis": s.synopsis,
            "categories": s.categories or [],
            "status": s.status,
            "episodes_count": ep_count,
            "artworks": art_types,
            "created_at": s.created_at,
            "updated_at": s.updated_at
        })

    return {"total": total, "shows": res}


@router.get("/{id_or_slug}", summary="Get single show details with seasons and episodes")
def get_show(id_or_slug: str, db: Session = Depends(get_db)):
    if id_or_slug.isdigit():
        show = db.query(Show).filter(Show.id == int(id_or_slug)).first()
    else:
        show = db.query(Show).filter(Show.slug == id_or_slug).first()

    if not show:
        raise HTTPException(status_code=404, detail=f"Show '{id_or_slug}' not found.")

    episodes = db.query(Episode).filter(Episode.show_id == show.id).all()
    arts = db.query(Artwork).filter(Artwork.entity_type == "show", Artwork.entity_id == show.slug).all()
    art_dict = {a.type: a.file_path for a in arts}

    return {
        "id": show.id,
        "slug": show.slug,
        "title": show.title,
        "section": show.section,
        "synopsis": show.synopsis,
        "categories": show.categories or [],
        "status": show.status,
        "artworks": art_dict,
        "episodes": [
            {
                "id": ep.id,
                "episode_number": ep.episode_number,
                "season_number": ep.season_number,
                "episode_title": ep.episode_title,
                "duration_seconds": ep.duration_seconds,
                "language": ep.language,
                "content_group": ep.content_group,
                "status": ep.status
            }
            for ep in episodes
        ]
    }


@router.post("", response_model=ShowResponse, summary="Create a new show")
def create_show(
    payload: ShowCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    existing = db.query(Show).filter(Show.slug == payload.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Show slug '{payload.slug}' already exists.")

    show = Show(
        slug=payload.slug,
        title=payload.title,
        section=payload.section,
        synopsis=payload.synopsis,
        categories=payload.categories,
        status=payload.status
    )
    db.add(show)
    db.commit()
    db.refresh(show)
    return show


@router.put("/{show_id}", response_model=ShowResponse, summary="Update an existing show")
def update_show(
    show_id: int,
    payload: ShowUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail=f"Show ID {show_id} not found.")

    if payload.title is not None:
        show.title = payload.title
    if payload.section is not None:
        show.section = payload.section
    if payload.synopsis is not None:
        show.synopsis = payload.synopsis
    if payload.categories is not None:
        show.categories = payload.categories
    if payload.status is not None:
        show.status = payload.status

    db.commit()
    db.refresh(show)
    return show


@router.delete("/{show_id}", summary="Delete a show")
def delete_show(
    show_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    show = db.query(Show).filter(Show.id == show_id).first()
    if not show:
        raise HTTPException(status_code=404, detail=f"Show ID {show_id} not found.")

    db.delete(show)
    db.commit()
    return {"message": f"Show {show_id} deleted successfully."}
