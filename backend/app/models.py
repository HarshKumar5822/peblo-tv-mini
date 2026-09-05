import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, UniqueConstraint, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    slug = Column(String, unique=True, index=True, nullable=False)
    title = Column(String, nullable=False)
    section = Column(String, nullable=True) # featured, series, minisodes, songs
    synopsis = Column(Text, nullable=True)
    categories = Column(JSON, default=list)
    status = Column(String, default="draft") # draft, published
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan")
    episodes = relationship("Episode", back_populates="show", cascade="all, delete-orphan")


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False)
    season_number = Column(Integer, nullable=False) # 0 reserved for trailers
    title = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(String, primary_key=True, index=True) # e.g. ep_0001
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=True)
    season_number = Column(Integer, nullable=False, default=1)
    episode_number = Column(Integer, nullable=False)
    episode_title = Column(String, nullable=False)
    duration_seconds = Column(Integer, nullable=True)
    language = Column(String, nullable=False) # en, hi
    content_group = Column(String, nullable=False, index=True)
    status = Column(String, default="draft") # draft, published
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    show = relationship("Show", back_populates="episodes")
    season = relationship("Season", back_populates="episodes")

    # Unique constraint checked dynamically via validation service and API endpoints
    # to allow importing seed dataset containing deliberate duplicates for reporting



class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(String, nullable=False) # 'show' or 'episode'
    entity_id = Column(String, nullable=False, index=True) # show slug/id or episode_id
    type = Column(String, nullable=False) # 'poster', 'banner', 'thumbnail'
    file_path = Column(String, nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    file_size_kb = Column(Float, nullable=False)
    aspect_ratio = Column(Float, nullable=False)
    mime_type = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("entity_type", "entity_id", "type", name="uq_entity_artwork_type"),
    )


class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(Integer, primary_key=True, index=True)
    run_at = Column(DateTime, default=datetime.datetime.utcnow)
    triggered_by = Column(String, nullable=False) # user / role
    status = Column(String, nullable=False) # 'success', 'failed'
    shows_count = Column(Integer, default=0)
    episodes_count = Column(Integer, default=0)
    catalogue_hash = Column(String, nullable=True)
    error_log = Column(Text, nullable=True)
    logs_json = Column(JSON, default=list)
