from functools import lru_cache
from app.config import settings


@lru_cache(maxsize=1)
def get_supabase():
    if not settings.supabase_enabled:
        raise RuntimeError(
            "Supabase is not configured. "
            "Set SUPABASE_URL and SUPABASE_KEY in backend/.env to enable persistence."
        )
    from supabase import create_client
    return create_client(settings.supabase_url, settings.supabase_key)  # type: ignore
