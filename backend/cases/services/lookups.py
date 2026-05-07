from django.core.cache import cache

from cases.services.cache import CACHE_TTLS, build_cache_key
from cases.services.common import build_disease_options, build_news_portal_queryset, build_registry_locations


def get_filter_options_payload():
    cache_key = build_cache_key("filters", {"scope": "global"})
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return cached_payload

    diseases = [
        {"value": disease.name, "label": disease.name}
        for disease in build_disease_options()
        if disease.name and disease.name.strip()
    ]

    provinces = list(
        build_registry_locations()
        .exclude(province__isnull=True)
        .exclude(province__exact="")
        .values_list("province", flat=True)
        .order_by("province")
        .distinct()
    )
    cities = list(
        build_registry_locations()
        .exclude(city__isnull=True)
        .exclude(city__exact="")
        .values_list("city", flat=True)
        .order_by("city")
        .distinct()
    )
    news_portals = list(
        build_news_portal_queryset().values_list("portal", flat=True).order_by("portal").distinct()
    )

    payload = {
        "data": {
            "diseases": diseases,
            "locations": {
                "provinces": [{"value": province, "label": province} for province in provinces if province],
                "cities": [{"value": city, "label": city} for city in cities if city],
            },
            "news": [{"value": portal, "label": portal} for portal in news_portals if portal],
            "severity": [
                {"value": item, "label": item.title()}
                for item in ("hospitalisasi", "insiden", "mortalitas")
            ],
            "level_of_alertness": [{"value": value, "label": str(value)} for value in range(1, 6)],
        }
    }

    cache.set(cache_key, payload, timeout=CACHE_TTLS["filters"])
    return payload

