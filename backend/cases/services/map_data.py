from collections import defaultdict
from typing import Any

from django.core.cache import cache
from django.db.models import Avg, Count, F, FloatField, Min, Q, Value
from django.db.models.functions import Cast, Floor

from cases.services.cache import CACHE_TTLS, build_cache_key
from cases.services.common import (
    DEFAULT_VIEWPORT,
    apply_case_filters,
    apply_viewport_filter,
    build_lightweight_case_queryset,
    normalize_filter_payload,
)


def _get_cluster_cell_size(zoom: int) -> float:
    if zoom <= 2:
        return 4.5
    if zoom == 3:
        return 3.0
    if zoom == 4:
        return 2.0
    if zoom == 5:
        return 1.25
    if zoom == 6:
        return 0.8
    return 0.55


def _should_cluster(zoom: int) -> bool:
    return zoom < 7


def _build_news_count_expression(filters: dict[str, Any]):
    portals = filters.get("portals") or []
    if portals:
        return Count("news_items", filter=Q(news_items__portal__in=portals), distinct=True)
    return Count("news_items", distinct=True)


def _serialize_marker_row(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "item_type": "marker",
        "case_id": str(row["id"]),
        "disease_id": str(row["disease_id"]) if row["disease_id"] is not None else None,
        "severity": row["severity"],
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "province": row["province"] or "",
        "city": row["city"] or "",
        "total_news": int(row["total_news"] or 0),
    }


def _serialize_cluster_row(row: dict[str, Any], zoom: int) -> dict[str, Any]:
    return {
        "id": f"cluster:{zoom}:{row['lat_bucket']}:{row['lng_bucket']}",
        "item_type": "cluster",
        "case_id": None,
        "disease_id": None,
        "severity": None,
        "latitude": float(row["latitude"]),
        "longitude": float(row["longitude"]),
        "province": (row["province"] or "").strip() or "Cluster",
        "city": "Cluster",
        "total_news": int(row["total_news"] or 0),
        "cluster_count": int(row["cluster_count"] or 0),
    }


def _build_marker_payload(filters: dict[str, Any], viewport: dict[str, float | int]):
    news_count = _build_news_count_expression(filters)
    queryset = apply_viewport_filter(
        apply_case_filters(build_lightweight_case_queryset(), filters),
        viewport,
    )
    rows = (
        queryset.annotate(
            total_news=news_count,
            latitude=Cast("location__latitude", FloatField()),
            longitude=Cast("location__longitude", FloatField()),
            province=F("location__province"),
        )
        .values("id", "disease_id", "severity", "latitude", "longitude", "province", "city", "total_news")
        .order_by()
    )
    return [_serialize_marker_row(row) for row in rows]


def _build_cluster_payload(filters: dict[str, Any], viewport: dict[str, float | int]):
    cell_size = _get_cluster_cell_size(int(viewport["zoom"]))
    news_count = _build_news_count_expression(filters)
    base_queryset = apply_viewport_filter(
        apply_case_filters(build_lightweight_case_queryset(), filters),
        viewport,
    ).annotate(
        latitude_value=Cast("location__latitude", FloatField()),
        longitude_value=Cast("location__longitude", FloatField()),
    )

    rows = (
        base_queryset.annotate(
            lat_bucket=Floor(F("latitude_value") / Value(cell_size)),
            lng_bucket=Floor(F("longitude_value") / Value(cell_size)),
        )
        .values("lat_bucket", "lng_bucket")
        .annotate(
            latitude=Avg("latitude_value"),
            longitude=Avg("longitude_value"),
            province=Min("location__province"),
            city=Min("city"),
            cluster_count=Count("id", distinct=True),
            total_news=news_count,
        )
        .order_by()
    )
    return [_serialize_cluster_row(row, int(viewport["zoom"])) for row in rows]


def get_map_data_payload(filters: dict[str, Any] | None = None, viewport: dict[str, float | int] | None = None):
    normalized_filters = normalize_filter_payload(filters)
    normalized_viewport = {**DEFAULT_VIEWPORT, **(viewport or {})}
    cache_key = build_cache_key(
        "map_data",
        {
            "filters": normalized_filters,
            "viewport": normalized_viewport,
        },
    )
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return cached_payload

    if _should_cluster(int(normalized_viewport["zoom"])):
        payload = _build_cluster_payload(normalized_filters, normalized_viewport)
    else:
        payload = _build_marker_payload(normalized_filters, normalized_viewport)

    cache.set(cache_key, payload, timeout=CACHE_TTLS["map_data"])
    return payload
