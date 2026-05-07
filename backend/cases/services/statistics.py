from collections import defaultdict
from typing import Any

from django.core.cache import cache
from django.db.models import Case, CharField, Count, Max, Q, Value, When
from django.db.models.functions import TruncDate

from cases.models import CaseNews
from cases.services.cache import CACHE_TTLS, build_cache_key
from cases.services.common import apply_case_filters, build_lightweight_case_queryset, normalize_filter_payload


INDONESIA_POPULATION_ESTIMATE = 281_603_800
INDONESIA_PROVINCES = {
    "aceh",
    "sumatera utara",
    "sumatera barat",
    "riau",
    "kepulauan riau",
    "jambi",
    "sumatera selatan",
    "kepulauan bangka belitung",
    "bengkulu",
    "lampung",
    "banten",
    "dki jakarta",
    "jawa barat",
    "jawa tengah",
    "di yogyakarta",
    "jawa timur",
    "bali",
    "nusa tenggara barat",
    "nusa tenggara timur",
    "kalimantan barat",
    "kalimantan tengah",
    "kalimantan selatan",
    "kalimantan timur",
    "kalimantan utara",
    "sulawesi utara",
    "gorontalo",
    "sulawesi tengah",
    "sulawesi barat",
    "sulawesi selatan",
    "sulawesi tenggara",
    "maluku",
    "maluku utara",
    "papua",
    "papua barat",
    "papua selatan",
    "papua tengah",
    "papua pegunungan",
    "papua barat daya",
}
PROVINCE_ALIASES = {
    "bangka belitung": "kepulauan bangka belitung",
    "dki": "dki jakarta",
}

_MALE_GENDER_QUERY = (
    Q(gender__iexact="male")
    | Q(gender__iexact="l")
    | Q(gender__iexact="pria")
    | Q(gender__iexact="laki-laki")
    | Q(gender__iexact="laki laki")
)
_FEMALE_GENDER_QUERY = (
    Q(gender__iexact="female")
    | Q(gender__iexact="p")
    | Q(gender__iexact="wanita")
    | Q(gender__iexact="perempuan")
)
_INACTIVE_STATUS_QUERY = (
    Q(status__iexact="sembuh")
    | Q(status__iexact="recovered")
    | Q(status__iexact="selesai")
    | Q(status__iexact="closed")
    | Q(status__iexact="inactive")
    | Q(status__iexact="tidak aktif")
    | Q(status__iexact="meninggal")
    | Q(status__iexact="deceased")
)


def _empty_severity_counts():
    return {"hospitalisasi": 0, "insiden": 0, "mortalitas": 0}


def _normalize_province_name(value: str | None):
    if not value:
        return None
    normalized = " ".join(value.strip().casefold().split())
    if not normalized:
        return None
    return PROVINCE_ALIASES.get(normalized, normalized)


def _count_monitored_provinces(queryset):
    rows = (
        queryset.exclude(location__province__isnull=True)
        .exclude(location__province__exact="")
        .values_list("location__province", flat=True)
        .distinct()
    )

    provinces = set()
    for row in rows:
        province = _normalize_province_name(row)
        if province in INDONESIA_PROVINCES:
            provinces.add(province)
    return len(provinces)


def _build_news_block(rows, bucket: str):
    bucket_rows = [
        {
            "portal": row["portal"],
            "news_count": int(row["news_count"]),
            "disease_count": int(row["disease_count"]),
        }
        for row in rows
        if row["bucket"] == bucket
    ]
    bucket_rows.sort(key=lambda item: (-item["news_count"], item["portal"].lower()))
    return (
        [{"portal": item["portal"], "count": item["news_count"]} for item in bucket_rows[:5]],
        bucket_rows,
    )


def _build_news_statistics(filters: dict[str, Any], queryset):
    portals = filters.get("portals") or []
    news_queryset = CaseNews.objects.filter(case_id__in=queryset.values("id"))
    if portals:
        news_queryset = news_queryset.filter(portal__in=portals)

    bucket_rows = news_queryset.annotate(
        bucket=Case(
            When(type__iexact="Nasional", then=Value("national")),
            When(type__iexact="Lokal", then=Value("local")),
            When(type__iexact="Kesehatan", then=Value("healthcare")),
            default=Value("other"),
            output_field=CharField(),
        )
    ).exclude(bucket="other")

    rows = list(
        bucket_rows.values("bucket", "portal")
        .annotate(news_count=Count("id"), disease_count=Count("case__disease_id", distinct=True))
        .order_by()
    )

    top_national, all_national = _build_news_block(rows, "national")
    top_local, all_local = _build_news_block(rows, "local")
    top_healthcare, all_healthcare = _build_news_block(rows, "healthcare")

    return {
        "national_news_statistics": {
            "top_national": top_national,
            "all_national": all_national,
        },
        "local_portal_statistics": {
            "top_local": top_local,
            "all_local": all_local,
        },
        "healthcare_news_statistics": {
            "top_healthcare": top_healthcare,
            "all_healthcare": all_healthcare,
        },
    }


def get_statistics_payload(filters: dict[str, Any] | None = None):
    normalized_filters = normalize_filter_payload(filters)
    cache_key = build_cache_key("statistics", normalized_filters)
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return cached_payload

    queryset = apply_case_filters(build_lightweight_case_queryset(), normalized_filters)

    summary = queryset.aggregate(
        total_cases=Count("id", distinct=True),
        hospitalisasi=Count("id", filter=Q(severity__iexact="Hospitalisasi"), distinct=True),
        insiden=Count("id", filter=Q(severity__iexact="Insiden"), distinct=True),
        mortalitas=Count("id", filter=Q(severity__iexact="Mortalitas"), distinct=True),
        under_12=Count("id", filter=Q(age__lt=12), distinct=True),
        age_12_25=Count("id", filter=Q(age__gte=12, age__lte=25), distinct=True),
        age_26_45=Count("id", filter=Q(age__gte=26, age__lte=45), distinct=True),
        above_45=Count("id", filter=Q(age__gt=45), distinct=True),
        male=Count("id", filter=_MALE_GENDER_QUERY, distinct=True),
        female=Count("id", filter=_FEMALE_GENDER_QUERY, distinct=True),
        active_cases=Count("id", filter=~_INACTIVE_STATUS_QUERY, distinct=True),
        latest_created=Max("created_at"),
    )

    severity_rows = list(
        queryset.annotate(date=TruncDate("created_at"))
        .values("date")
        .annotate(
            hospitalisasi=Count("id", filter=Q(severity__iexact="Hospitalisasi"), distinct=True),
            insiden=Count("id", filter=Q(severity__iexact="Insiden"), distinct=True),
            mortalitas=Count("id", filter=Q(severity__iexact="Mortalitas"), distinct=True),
        )
        .order_by("date")
    )

    severity_dates = defaultdict(list)
    for row in severity_rows:
        if row["hospitalisasi"]:
            severity_dates["hospitalisasi"].append({"date": row["date"].isoformat(), "count": int(row["hospitalisasi"])})
        if row["insiden"]:
            severity_dates["insiden"].append({"date": row["date"].isoformat(), "count": int(row["insiden"])})
        if row["mortalitas"]:
            severity_dates["mortalitas"].append({"date": row["date"].isoformat(), "count": int(row["mortalitas"])})

    news_statistics = _build_news_statistics(normalized_filters, queryset)
    total_cases = int(summary["total_cases"] or 0)
    active_cases = int(summary["active_cases"] or 0)
    province_count = _count_monitored_provinces(queryset)
    latest_created = summary["latest_created"]
    latest_update = latest_created.isoformat() if latest_created is not None else None
    latest_year = latest_created.year if latest_created is not None else 2025

    payload = {
        "latest_update": latest_update,
        "coverage_statistics": {
            "province_count": province_count,
            "latest_update": latest_update,
        },
        "prevalence_statistics": {
            "prevalence": round((total_cases / INDONESIA_POPULATION_ESTIMATE) * 100000, 4) if total_cases else 0,
            "year": latest_year,
            "population": INDONESIA_POPULATION_ESTIMATE,
        },
        "severity_statistics": {
            "total_cases": total_cases,
            "active_cases": active_cases,
            "severity_counts": {
                "hospitalisasi": int(summary["hospitalisasi"] or 0),
                "insiden": int(summary["insiden"] or 0),
                "mortalitas": int(summary["mortalitas"] or 0),
            },
        },
        "age_statistics": {
            "under_12": int(summary["under_12"] or 0),
            "12_25": int(summary["age_12_25"] or 0),
            "26_45": int(summary["age_26_45"] or 0),
            "above_45": int(summary["above_45"] or 0),
        },
        "gender_statistics": {
            "male": int(summary["male"] or 0),
            "female": int(summary["female"] or 0),
        },
        "severity_dates_count_statistics": dict(severity_dates),
        **news_statistics,
    }

    cache.set(cache_key, payload, timeout=CACHE_TTLS["statistics"])
    return payload
