from datetime import datetime, time
from typing import Any
from uuid import UUID

from django.conf import settings
from django.db.models import Avg, Count, F, Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime

from cases.models import Case, CaseNews, Climate, Disease, Location
from cases.services.province_codes import get_province_geojson_id


DEFAULT_VIEWPORT = {
    "min_lat": -11.5,
    "max_lat": 6.5,
    "min_lng": 94.0,
    "max_lng": 141.5,
    "zoom": 3,
}


def build_base_case_queryset():
    return Case.objects.select_related("disease", "location").prefetch_related("news_items").all()


def build_lightweight_case_queryset():
    return Case.objects.select_related("disease", "location").all()


def _ensure_datetime(value: Any, *, end_of_day: bool = False):
    if value in (None, ""):
        return None
    if isinstance(value, datetime):
        if settings.USE_TZ and timezone.is_naive(value):
            return timezone.make_aware(value, timezone.get_current_timezone())
        return value

    parsed_datetime = parse_datetime(str(value))
    if parsed_datetime is not None:
        if settings.USE_TZ and timezone.is_naive(parsed_datetime):
            return timezone.make_aware(parsed_datetime, timezone.get_current_timezone())
        return parsed_datetime

    parsed_date = parse_date(str(value))
    if parsed_date is None:
        return None

    combined = datetime.combine(parsed_date, time.max if end_of_day else time.min)
    if settings.USE_TZ:
        return timezone.make_aware(combined, timezone.get_current_timezone())
    return combined


def _normalize_uuid(value: Any):
    if value in (None, "", "null"):
        return None
    if isinstance(value, UUID):
        return value
    try:
        return UUID(str(value))
    except (TypeError, ValueError):
        return None


def _extract_location_terms(raw_locations):
    if isinstance(raw_locations, dict):
        provinces = [str(item).strip() for item in raw_locations.get("provinces", []) if str(item).strip()]
        cities = [str(item).strip() for item in raw_locations.get("cities", []) if str(item).strip()]
        return provinces + cities
    if isinstance(raw_locations, list):
        return [str(item).strip() for item in raw_locations if str(item).strip()]
    if raw_locations in (None, ""):
        return []
    return [str(raw_locations).strip()]


def normalize_filter_payload(payload: dict[str, Any] | None) -> dict[str, Any]:
    payload = payload or {}
    return {
        "diseases": [str(item).strip() for item in payload.get("diseases", []) if str(item).strip()],
        "locations": _extract_location_terms(payload.get("locations")),
        "portals": [str(item).strip() for item in payload.get("portals", []) if str(item).strip()],
        "level_of_alertness": int(payload.get("level_of_alertness") or 0),
        "start_date": _ensure_datetime(payload.get("start_date")),
        "end_date": _ensure_datetime(payload.get("end_date"), end_of_day=True),
        "batch": _normalize_uuid(payload.get("batch")),
    }


def parse_filter_query_params(query_params) -> dict[str, Any]:
    return normalize_filter_payload(
        {
            "diseases": query_params.getlist("disease"),
            "locations": query_params.getlist("location"),
            "portals": query_params.getlist("portal"),
            "level_of_alertness": query_params.get("level_of_alertness"),
            "start_date": query_params.get("start_date"),
            "end_date": query_params.get("end_date"),
            "batch": query_params.get("batch"),
        }
    )


def parse_viewport_query_params(query_params) -> dict[str, float | int]:
    viewport = DEFAULT_VIEWPORT.copy()

    for key in ("min_lat", "max_lat", "min_lng", "max_lng"):
        raw_value = query_params.get(key)
        if raw_value in (None, ""):
            continue
        try:
            viewport[key] = float(raw_value)
        except (TypeError, ValueError):
            continue

    raw_zoom = query_params.get("zoom")
    if raw_zoom not in (None, ""):
        try:
            viewport["zoom"] = max(1, int(float(raw_zoom)))
        except (TypeError, ValueError):
            pass

    return viewport


def apply_case_filters(queryset, filters):
    normalized = normalize_filter_payload(filters)
    diseases = normalized["diseases"]
    locations = normalized["locations"]
    portals = normalized["portals"]
    level = normalized["level_of_alertness"]
    start_date = normalized["start_date"]
    end_date = normalized["end_date"]
    batch = normalized["batch"]

    if diseases:
        queryset = queryset.filter(disease__name__in=diseases)
    if locations:
        location_query = Q()
        for item in locations:
            location_query |= Q(location__province__iexact=item) | Q(location__city__iexact=item) | Q(city__iexact=item)
        queryset = queryset.filter(location_query)
    if portals:
        queryset = queryset.filter(news_items__portal__in=portals).distinct()
    if level:
        queryset = queryset.filter(disease__level_of_alertness=level)
    if start_date:
        queryset = queryset.filter(created_at__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__lte=end_date)
    if batch is not None:
        queryset = queryset.filter(batch_id=batch)

    return queryset


def apply_viewport_filter(queryset, viewport: dict[str, float | int]):
    return queryset.filter(
        location__latitude__isnull=False,
        location__longitude__isnull=False,
        location__latitude__gte=viewport["min_lat"],
        location__latitude__lte=viewport["max_lat"],
        location__longitude__gte=viewport["min_lng"],
        location__longitude__lte=viewport["max_lng"],
    )


def build_province_weighted_severity():
    rows = (
        Case.objects.select_related("disease", "location")
        .values("location__province")
        .annotate(value=Count("id") + Count("id", filter=Q(disease__level_of_alertness=3)) * 2)
        .order_by("location__province")
    )
    return [
        {
            "id": get_province_geojson_id(row["location__province"]) or row["location__province"],
            "province": row["location__province"],
            "value": row["value"],
            "status": _weighted_severity_status(int(row["value"] or 0)),
        }
        for row in rows
        if row["location__province"]
    ]


def _weighted_severity_status(value: int) -> str:
    if value >= 25:
        return "katastropik"
    if value >= 10:
        return "bahaya"
    if value >= 4:
        return "biasa"
    return "minimal"


def _coerce_int(value: Any):
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


def _resolve_latest_climate_period(month: int | None = None):
    queryset = Climate.objects.all()
    if month is not None:
        queryset = queryset.filter(month=month)
    return queryset.order_by("-year", "-month").values("year", "month").first()


def build_latest_climate_series(field_name: str, year: Any = None, month: Any = None):
    requested_year = _coerce_int(year)
    requested_month = _coerce_int(month)
    queryset = Climate.objects.all()

    if requested_month is not None and not 1 <= requested_month <= 12:
        requested_month = None

    if requested_year is None and requested_month is None:
        latest_period = _resolve_latest_climate_period()
        if latest_period is None:
            return []
        queryset = queryset.filter(year=latest_period["year"], month=latest_period["month"])
        period_year = latest_period["year"]
        period_month = latest_period["month"]
    else:
        period_year = requested_year
        period_month = requested_month
        if requested_year is None and requested_month is not None:
            latest_period = _resolve_latest_climate_period(requested_month)
            if latest_period is None:
                return []
            period_year = latest_period["year"]
        if period_year is not None:
            queryset = queryset.filter(year=period_year)
        if period_month is not None:
            queryset = queryset.filter(month=period_month)

    aggregate_fn = Sum if field_name == "precipitation" else Avg
    rows = (
        queryset.values("province")
        .annotate(value=aggregate_fn(field_name))
        .order_by("province")
    )

    payload = []
    for row in rows:
        province = (row["province"] or "").strip()
        geojson_id = get_province_geojson_id(province)
        value = row["value"]
        if not province or geojson_id is None or value is None:
            continue
        payload.append(
            {
                "id": geojson_id,
                "province": province,
                "value": round(float(value), 2),
                "status": None,
                "year": period_year,
                "month": period_month,
                "aggregation": "sum" if field_name == "precipitation" else "average",
            }
        )
    return payload


def _case_heatmap_status(value: int) -> str:
    if value >= 25:
        return "sangat_tinggi"
    if value >= 10:
        return "tinggi"
    if value >= 4:
        return "sedang"
    if value >= 1:
        return "rendah"
    return "nihil"


def build_province_case_heatmap(filters: dict[str, Any] | None = None):
    queryset = apply_case_filters(build_lightweight_case_queryset(), filters or {})
    rows = (
        queryset.values("location__province")
        .annotate(value=Count("id"))
        .order_by("location__province")
    )

    payload = []
    for row in rows:
        province = (row["location__province"] or "").strip()
        geojson_id = get_province_geojson_id(province)
        value = int(row["value"] or 0)
        if not province or geojson_id is None:
            continue
        payload.append(
            {
                "id": geojson_id,
                "province": province,
                "value": value,
                "status": _case_heatmap_status(value),
            }
        )
    return payload


def build_registry_locations():
    return Location.objects.order_by("province", "city")


def build_disease_options():
    return Disease.objects.order_by("name")


def build_news_portal_queryset():
    return CaseNews.objects.exclude(portal__isnull=True).exclude(portal__exact="")
