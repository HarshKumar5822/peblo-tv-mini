from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ArtworkBase(BaseModel):
    entity_type: str
    entity_id: str
    type: str
    file_path: str
    width: int
    height: int
    file_size_kb: float
    aspect_ratio: float
    mime_type: str

class ArtworkResponse(ArtworkBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EpisodeBase(BaseModel):
    episode_id: Optional[str] = None
    show_id: Optional[int] = None
    season_number: int = 1
    episode_number: int
    episode_title: str
    duration_seconds: Optional[int] = None
    language: str
    content_group: str
    status: str = "draft"

class EpisodeCreate(EpisodeBase):
    pass

class EpisodeUpdate(BaseModel):
    season_number: Optional[int] = None
    episode_number: Optional[int] = None
    episode_title: Optional[str] = None
    duration_seconds: Optional[int] = None
    language: Optional[str] = None
    content_group: Optional[str] = None
    status: Optional[str] = None

class EpisodeResponse(EpisodeBase):
    id: str
    artworks: List[str] = []

    class Config:
        from_attributes = True

class ShowBase(BaseModel):
    title: str
    slug: str
    section: Optional[str] = None
    synopsis: Optional[str] = None
    categories: List[str] = []
    status: str = "draft"

class ShowCreate(ShowBase):
    pass

class ShowUpdate(BaseModel):
    title: Optional[str] = None
    section: Optional[str] = None
    synopsis: Optional[str] = None
    categories: Optional[List[str]] = None
    status: Optional[str] = None

class ShowResponse(ShowBase):
    id: int
    episodes_count: int = 0
    artworks: List[str] = []

    class Config:
        from_attributes = True

class PublishRunResponse(BaseModel):
    id: int
    run_at: datetime
    triggered_by: str
    status: str
    shows_count: int
    episodes_count: int
    catalogue_hash: Optional[str] = None
    error_log: Optional[str] = None

    class Config:
        from_attributes = True

class ValidationIssue(BaseModel):
    category: str
    entity_type: str # 'show' or 'episode'
    entity_id: str
    show_title: Optional[str] = None
    episode_title: Optional[str] = None
    message: str
    actionable_fix: str

class ValidationReport(BaseModel):
    is_publishable: bool
    total_issues: int
    issues_by_category: Dict[str, List[ValidationIssue]]
    shows_with_issues: List[str]

class User(BaseModel):
    username: str
    role: str # 'editor' or 'admin'
