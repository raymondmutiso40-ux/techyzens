import logging
from pathlib import Path
from urllib.parse import quote

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def is_configured() -> bool:
    settings = get_settings()
    return bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)


def is_storage_uri(value: str | None) -> bool:
    return bool(value and value.startswith("supabase://"))


def _split_storage_uri(storage_uri: str) -> tuple[str, str]:
    if not is_storage_uri(storage_uri):
        raise ValueError("Not a Supabase Storage URI")
    bucket_and_key = storage_uri.removeprefix("supabase://")
    bucket, separator, object_key = bucket_and_key.partition("/")
    if not separator or not bucket or not object_key:
        raise ValueError("Invalid Supabase Storage URI")
    return bucket, object_key


async def upload_bytes(object_key: str, content: bytes, content_type: str = "application/octet-stream") -> str:
    """Upload an object to a private Supabase Storage bucket and return its durable URI."""
    settings = get_settings()
    if not is_configured():
        raise RuntimeError("Supabase Storage is not configured")

    bucket = settings.SUPABASE_STORAGE_BUCKET
    base_url = settings.SUPABASE_URL.rstrip("/")
    url = f"{base_url}/storage/v1/object/{quote(bucket, safe='')}/{quote(object_key, safe='/')}"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": content_type,
        "x-upsert": "true",
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.post(url, content=content, headers=headers)
        response.raise_for_status()
    return f"supabase://{bucket}/{object_key}"


async def upload_local_file(object_key: str, local_path: str | Path, content_type: str = "application/octet-stream") -> str:
    path = Path(local_path)
    return await upload_bytes(object_key, path.read_bytes(), content_type)


async def download_bytes(storage_uri: str) -> tuple[bytes, str]:
    """Download a private Supabase Storage object using the backend-only service key."""
    settings = get_settings()
    if not is_configured():
        raise RuntimeError("Supabase Storage is not configured")

    bucket, object_key = _split_storage_uri(storage_uri)
    base_url = settings.SUPABASE_URL.rstrip("/")
    url = f"{base_url}/storage/v1/object/{quote(bucket, safe='')}/{quote(object_key, safe='/')}"
    headers = {
        "apikey": settings.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {settings.SUPABASE_SERVICE_ROLE_KEY}",
    }
    async with httpx.AsyncClient(timeout=90.0) as client:
        response = await client.get(url, headers=headers)
        response.raise_for_status()
    return response.content, response.headers.get("content-type", "application/octet-stream")
