import hashlib
import json
import time
from typing import Any, Dict

from django.conf import settings
from django.core.cache import cache

CACHE_PREFIX = 'analytics'
VERSION_KEY = f'{CACHE_PREFIX}:version'


def get_cache_timeout() -> int:
    """Return the configured timeout for analytics responses."""
    return getattr(settings, 'ANALYTICS_CACHE_TIMEOUT', 300)


def get_cache_version() -> str:
    """Return the current cache version, creating one if missing."""
    version = cache.get(VERSION_KEY)
    if version is None:
        version = bump_cache_version()
    return version


def bump_cache_version() -> str:
    """Invalidate cached analytics payloads by updating the version key."""
    # Use a timestamp string to avoid collisions and keep ordering readable
    version = f"{time.time()}"
    cache.set(VERSION_KEY, version, None)
    return version


def build_cache_key(namespace: str, params: Dict[str, Any]) -> str:
    """Create a deterministic cache key using the namespace, filters, and version."""
    version = get_cache_version()
    serialised = json.dumps(params, sort_keys=True, default=str)
    digest = hashlib.md5(serialised.encode('utf-8')).hexdigest()
    return f"{CACHE_PREFIX}:{namespace}:{version}:{digest}"
