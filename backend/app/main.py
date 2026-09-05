import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.api import catalog, admin, shows, episodes, health

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Full-Stack Peblo TV Mini Backend API with Atomic Catalogue Publishing",
    version="1.0.0"
)

# CORS middleware for CMS (port 3001) and Viewer (port 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for easy dev & docker compose access
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage directory for static artwork & catalogue serving
storage_dir = os.path.abspath(settings.STORAGE_DIR)
os.makedirs(storage_dir, exist_ok=True)
app.mount("/storage", StaticFiles(directory=storage_dir), name="storage")

# Include Routers
app.include_router(health.router)
app.include_router(catalog.router)
app.include_router(admin.router)
app.include_router(shows.router)
app.include_router(episodes.router)

@app.get("/")
def root():
    return {
        "project": "Peblo TV Mini API",
        "status": "running",
        "docs": "/docs",
        "viewer_catalog": "/catalog",
        "validation_report": "/admin/validation-report"
    }
