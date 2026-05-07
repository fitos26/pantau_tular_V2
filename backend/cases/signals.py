from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from cases.models import Case, CaseNews, Disease, HealthProtocol, HealthProtocolDisease, Location
from cases.services.cache import invalidate_data_cache


@receiver([post_save, post_delete], sender=Case)
def invalidate_case_caches(**kwargs):
    invalidate_data_cache("map_data", "statistics", "map_detail")


@receiver([post_save, post_delete], sender=CaseNews)
def invalidate_case_news_caches(**kwargs):
    invalidate_data_cache("map_data", "statistics", "map_detail", "filters")


@receiver([post_save, post_delete], sender=Location)
def invalidate_location_caches(**kwargs):
    invalidate_data_cache("map_data", "statistics", "map_detail", "filters")


@receiver([post_save, post_delete], sender=Disease)
def invalidate_disease_caches(**kwargs):
    invalidate_data_cache("map_data", "statistics", "map_detail", "filters")


@receiver([post_save, post_delete], sender=HealthProtocol)
@receiver([post_save, post_delete], sender=HealthProtocolDisease)
def invalidate_detail_caches(**kwargs):
    invalidate_data_cache("map_detail")
