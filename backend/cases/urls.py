from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CaseDetailView,
    CaseLocationsView,
    CitySeverityStatsView,
    DiseaseListCreateView,
    DiseaseNameListView,
    DiseaseSeverityStatsView,
    DiseaseViewSet,
    FiltersView,
    LocationViewSet,
    MapDataView,
    MapDetailView,
    ProvinceCaseHeatmapView,
    ProvinceHumidityView,
    ProvincePrecipitationView,
    ProvinceTemperatureView,
    ProvinceSeverityStatsView,
    ProvinceWeightedSeverityView,
    SeverityStatsFilterView,
    SpatialComparisonsView,
    StatisticsView,
)


router = DefaultRouter()
router.register("diseases", DiseaseViewSet, basename="disease")
router.register("locations", LocationViewSet, basename="location")

urlpatterns = [
    path("cases/locations/", CaseLocationsView.as_view(), name="case-locations"),
    path("cases/spatial-comparisons/", SpatialComparisonsView.as_view(), name="case-spatial-comparisons"),
    path("cases/<uuid:case_id>/", CaseDetailView.as_view(), name="case-detail"),
    path("api/map-data/", MapDataView.as_view(), name="api-map-data"),
    path("api/map-detail/<uuid:case_id>/", MapDetailView.as_view(), name="api-map-detail"),
    path("cases/diseases/", DiseaseNameListView.as_view(), name="case-diseases"),
    path("api/diseases/", DiseaseListCreateView.as_view(), name="api-diseases"),
    path("api/filters/", FiltersView.as_view(), name="api-filters"),
    path("api/statistics/", StatisticsView.as_view(), name="api-statistics"),
    path("api/province-humidity/", ProvinceHumidityView.as_view(), name="province-humidity"),
    path("api/province-temperature/", ProvinceTemperatureView.as_view(), name="province-temperature"),
    path("api/province-precipitation/", ProvincePrecipitationView.as_view(), name="province-precipitation"),
    path("api/province-case-heatmap/", ProvinceCaseHeatmapView.as_view(), name="province-case-heatmap"),
    path("api/province-weighted-severity/", ProvinceWeightedSeverityView.as_view(), name="province-weighted-severity"),
    path("api/diseases/severity-stats/", DiseaseSeverityStatsView.as_view(), name="disease-severity-stats"),
    path("api/locations/province/severity-stats/", ProvinceSeverityStatsView.as_view(), name="province-severity-stats"),
    path("api/locations/city/severity-stats/", CitySeverityStatsView.as_view(), name="city-severity-stats"),
    path("api/severity-stats/filter/", SeverityStatsFilterView.as_view(), name="severity-stats-filter"),
]

urlpatterns += router.urls
