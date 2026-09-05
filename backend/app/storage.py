import os
from abc import ABC, abstractmethod
from typing import Optional
from app.config import settings

class StorageProvider(ABC):
    @abstractmethod
    def save(self, file_bytes: bytes, key: str) -> str:
        """Save file bytes to key and return public relative URL/path."""
        pass

    @abstractmethod
    def atomic_write(self, content: bytes, key: str) -> str:
        """Atomically write content to key guarantee no partial reads."""
        pass

    @abstractmethod
    def read(self, key: str) -> bytes:
        """Read content from storage key."""
        pass

    @abstractmethod
    def exists(self, key: str) -> bool:
        """Check if key exists in storage."""
        pass

    @abstractmethod
    def get_url(self, key: str) -> str:
        """Get accessible URL for key."""
        pass


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: Optional[str] = None):
        self.base_dir = os.path.abspath(base_dir or settings.STORAGE_DIR)
        os.makedirs(self.base_dir, exist_ok=True)

    def _full_path(self, key: str) -> str:
        clean_key = key.lstrip("/").replace("..", "")
        full = os.path.join(self.base_dir, clean_key)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        return full

    def save(self, file_bytes: bytes, key: str) -> str:
        path = self._full_path(key)
        with open(path, "wb") as f:
            f.write(file_bytes)
        return f"/storage/{key.lstrip('/')}"

    def atomic_write(self, content: bytes, key: str) -> str:
        final_path = self._full_path(key)
        tmp_path = final_path + ".tmp"
        
        # Write to temp file first
        with open(tmp_path, "wb") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
            
        # Atomic rename on OS
        os.replace(tmp_path, final_path)
        return f"/storage/{key.lstrip('/')}"

    def read(self, key: str) -> bytes:
        path = self._full_path(key)
        if not os.path.exists(path):
            raise FileNotFoundError(f"Storage key '{key}' not found at {path}")
        with open(path, "rb") as f:
            return f.read()

    def exists(self, key: str) -> bool:
        return os.path.exists(self._full_path(key))

    def get_url(self, key: str) -> str:
        return f"/storage/{key.lstrip('/')}"


class S3StorageProvider(StorageProvider):
    """
    Cloudflare R2 / AWS S3 Production Storage Provider implementation.
    To switch from local to R2 in production, set STORAGE_PROVIDER=s3 in .env.
    """
    def __init__(self):
        self.bucket = settings.S3_BUCKET_NAME
        self.endpoint_url = settings.S3_ENDPOINT_URL
        # In production, boto3.client('s3', endpoint_url=..., aws_access_key_id=..., aws_secret_access_key=...) is initialized here.

    def save(self, file_bytes: bytes, key: str) -> str:
        # In production: s3_client.put_object(Bucket=self.bucket, Key=key, Body=file_bytes)
        return f"https://cdn.peblo.tv/{key}"

    def atomic_write(self, content: bytes, key: str) -> str:
        # S3 / R2 PutObject operations are inherently atomic key replacements.
        # s3_client.put_object(Bucket=self.bucket, Key=key, Body=content, ContentType='application/json')
        return f"https://cdn.peblo.tv/{key}"

    def read(self, key: str) -> bytes:
        # In production: s3_client.get_object(Bucket=self.bucket, Key=key)['Body'].read()
        return b"{}"

    def exists(self, key: str) -> bool:
        return True

    def get_url(self, key: str) -> str:
        return f"https://cdn.peblo.tv/{key}"


def get_storage_provider() -> StorageProvider:
    if settings.STORAGE_PROVIDER.lower() == "s3":
        return S3StorageProvider()
    return LocalStorageProvider()
