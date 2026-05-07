from typing import Any

from django.db.models import Count, Q

from cases.services.common import apply_case_filters, build_lightweight_case_queryset, normalize_filter_payload


def _build_grouped_severity_rows(group_field: str, filters: dict[str, Any] | None = None):
    queryset = apply_case_filters(build_lightweight_case_queryset(), normalize_filter_payload(filters))
    rows = (
        queryset.values(group_field)
        .annotate(
            total_cases=Count("id", distinct=True),
            hospitalisasi=Count("id", filter=Q(severity__iexact="Hospitalisasi"), distinct=True),
            insiden=Count("id", filter=Q(severity__iexact="Insiden"), distinct=True),
            mortalitas=Count("id", filter=Q(severity__iexact="Mortalitas"), distinct=True),
        )
        .order_by(group_field)
    )

    payload = []
    for row in rows:
        name = (row.get(group_field) or "").strip()
        if not name:
            continue

        payload.append(
            {
                "name": name,
                "severity_counts": {
                    "hospitalisasi": int(row["hospitalisasi"] or 0),
                    "insiden": int(row["insiden"] or 0),
                    "mortalitas": int(row["mortalitas"] or 0),
                },
                "total_cases": int(row["total_cases"] or 0),
            }
        )

    return payload


def get_disease_severity_rows(filters: dict[str, Any] | None = None):
    return _build_grouped_severity_rows("disease__name", filters)


def get_province_severity_rows(filters: dict[str, Any] | None = None):
    return _build_grouped_severity_rows("location__province", filters)


def get_city_severity_rows(filters: dict[str, Any] | None = None):
    return _build_grouped_severity_rows("city", filters)


def get_filtered_severity_payload(filters: dict[str, Any] | None = None):
    normalized_filters = normalize_filter_payload(filters)
    return {
        "disease_stats": get_disease_severity_rows(normalized_filters),
        "province_stats": get_province_severity_rows(normalized_filters),
        "city_stats": get_city_severity_rows(normalized_filters),
    }
