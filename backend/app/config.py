import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Peblo TV Mini API"
    API_V1_STR: str = ""
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./peblo_tv.db")
    
    # Storage
    STORAGE_PROVIDER: str = os.getenv("STORAGE_PROVIDER", "local")  # "local" or "s3"
    STORAGE_DIR: str = os.getenv("STORAGE_DIR", "./storage")
    
    # Cloudflare R2 / S3 config (for storage abstraction)
    S3_ENDPOINT_URL: str = os.getenv("S3_ENDPOINT_URL", "")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "peblo-tv-catalog")
    S3_ACCESS_KEY_ID: str = os.getenv("S3_ACCESS_KEY_ID", "")
    S3_SECRET_ACCESS_KEY: str = os.getenv("S3_SECRET_ACCESS_KEY", "")
    S3_REGION: str = os.getenv("S3_REGION", "auto")

    # Reference rules
    REFERENCE_PATH: str = os.getenv("REFERENCE_PATH", "./reference.json")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
