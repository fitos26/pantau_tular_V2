from django.core.cache import cache

from cases.serializers import CaseDetailSerializer
from cases.services.cache import CACHE_TTLS, build_cache_key
from cases.services.common import build_base_case_queryset


def get_case_detail_payload(case_id):
    cache_key = build_cache_key("map_detail", {"case_id": str(case_id)})
    cached_payload = cache.get(cache_key)
    if cached_payload is not None:
        return cached_payload

    case = build_base_case_queryset().filter(id=case_id).first()
    if case is None:
        return None

    payload = CaseDetailSerializer(case).data
    cache.set(cache_key, payload, timeout=CACHE_TTLS["map_detail"])
    return payload

