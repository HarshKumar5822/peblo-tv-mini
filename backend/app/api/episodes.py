from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.api.deps import get_db, require_role, User
from app.models import Episode, Show, Artwork
from app.schemas import EpisodeCreate, EpisodeUpdate, EpisodeResponse

router = APIRouter(prefix="/episodes", tags=["Episodes CRUD"])

@router.get("", summary="List episodes with filtering")
def list_episodes(
    show_id: Optional[int] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    language: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Episode)

    if show_id:
        query = query.filter(Episode.show_id == show_id)
    if status_filter:
        query = query.filter(Episode.status == status_filter)
    if language:
        query = query.filter(Episode.language == language)
    if q:
        search_str = f"%{q}%"
        query = query.filter((Episode.episode_title.ilike(search_str)) | (Episode.id.ilike(search_str)) | (Episode.content_group.ilike(search_str)))

    total = query.count()
    episodes = query.order_by(Episode.id.asc()).offset(skip).limit(limit).all()

    res = []
    for ep in episodes:
        arts = db.query(Artwork).filter(Artwork.entity_type == "episode", Artwork.entity_id == ep.id).all()
        res.append({
            "id": ep.id,
            "episode_id": ep.id,
            "show_id": ep.show_id,
            "show_title": ep.show.title if ep.show else "Unknown",
            "season_number": ep.season_number,
            "episode_number": ep.episode_number,
            "episode_title": ep.episode_title,
            "duration_seconds": ep.duration_seconds,
            "language": ep.language,
            "content_group": ep.content_group,
            "status": ep.status,
            "artworks": [a.type for a in arts]
        })

    return {"total": total, "episodes": res}


@router.get("/{episode_id}", summary="Get episode details")
def get_episode(episode_id: str, db: Session = Depends(get_db)):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail=f"Episode '{episode_id}' not found.")

    arts = db.query(Artwork).filter(Artwork.entity_type == "episode", Artwork.entity_id == ep.id).all()
    art_dict = {a.type: a.file_path for a in arts}

    return {
        "id": ep.id,
        "show_id": ep.show_id,
        "show_title": ep.show.title if ep.show else "",
        "season_number": ep.season_number,
        "episode_number": ep.episode_number,
        "episode_title": ep.episode_title,
        "duration_seconds": ep.duration_seconds,
        "language": ep.language,
        "content_group": ep.content_group,
        "status": ep.status,
        "artworks": art_dict
    }


@router.post("", summary="Create new episode")
def create_episode(
    payload: EpisodeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    # Enforce (content_group, language) uniqueness
    existing_cg = db.query(Episode).filter(
        Episode.content_group == payload.content_group,
        Episode.language == payload.language
    ).first()

    if existing_cg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation Error: (content_group: '{payload.content_group}', language: '{payload.language}') already exists (Episode ID: {existing_cg.id})."
        )

    # Determine episode_id if omitted
    ep_id = payload.episode_id
    if not ep_id:
        count = db.query(Episode).count()
        ep_id = f"ep_{count+1:04d}"

    ep = Episode(
        id=ep_id,
        show_id=payload.show_id,
        season_number=payload.season_number,
        episode_number=payload.episode_number,
        episode_title=payload.episode_title,
        duration_seconds=payload.duration_seconds,
        language=payload.language,
        content_group=payload.content_group,
        status=payload.status
    )
    db.add(ep)
    db.commit()
    db.refresh(ep)
    return ep


@router.put("/{episode_id}", summary="Update episode details")
def update_episode(
    episode_id: str,
    payload: EpisodeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail=f"Episode '{episode_id}' not found.")

    new_cg = payload.content_group if payload.content_group is not None else ep.content_group
    new_lang = payload.language if payload.language is not None else ep.language

    # Check uniqueness if content_group or language is changing
    if new_cg != ep.content_group or new_lang != ep.language:
        existing_cg = db.query(Episode).filter(
            Episode.content_group == new_cg,
            Episode.language == new_lang,
            Episode.id != episode_id
        ).first()
        if existing_cg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Validation Error: (content_group: '{new_cg}', language: '{new_lang}') conflicts with episode {existing_cg.id}."
            )

    if payload.season_number is not None:
        ep.season_number = payload.season_number
    if payload.episode_number is not None:
        ep.episode_number = payload.episode_number
    if payload.episode_title is not None:
        ep.episode_title = payload.episode_title
    if payload.duration_seconds is not None:
        ep.duration_seconds = payload.duration_seconds
    if payload.language is not None:
        ep.language = payload.language
    if payload.content_group is not None:
        ep.content_group = payload.content_group
    if payload.status is not None:
        ep.status = payload.status

    db.commit()
    db.refresh(ep)
    return ep


@router.delete("/{episode_id}", summary="Delete episode")
def delete_episode(
    episode_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["editor", "admin"]))
):
    ep = db.query(Episode).filter(Episode.id == episode_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail=f"Episode '{episode_id}' not found.")

    db.delete(ep)
    db.commit()
    return {"message": f"Episode '{episode_id}' deleted successfully."}
