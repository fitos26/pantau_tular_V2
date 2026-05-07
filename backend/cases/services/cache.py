import hashlib
import json
from typing import Any

from django.core.cache import cache


CACHE_TTLS = {
    "map_data": 600,
    "statistics": 300,
    "filters": 3600,
    "map_detail": 600,
}

_VERSION_KEY_PREFIX = "cases:version"


def _version_key(scope: str) -> str:
    return f"{_VERSION_KEY_PREFIX}:{scope}"


def get_scope_version(scope: str) -> int:
    key = _version_key(scope)
    version = cache.get(key)
    if version is None:
        cache.set(key, 1, timeout=None)
        return 1
    return int(version)


def bump_scope_version(scope: str) -> int:
    key = _version_key(scope)
    if cache.get(key) is None:
        cache.set(key, 1, timeout=None)
        return 1
    try:
        return int(cache.incr(key))
    except ValueError:
        cache.set(key, 1, timeout=None)
        return 1


def build_cache_key(scope: str, payload: Any) -> str:
    digest = hashlib.sha1(
        json.dumps(payload, sort_keys=True, default=str, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    version = get_scope_version(scope)
    return f"cases:{scope}:v{version}:{digest}"


def invalidate_data_cache(*scopes: str) -> None:
    for scope in scopes:
        bump_scope_version(scope)

