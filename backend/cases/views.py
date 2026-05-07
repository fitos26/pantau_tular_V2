import uuid

from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from .models import Disease, Location
from .serializers import (
    CreateLocationSerializer,
    DiseaseSerializer,
    FilterLocationsSerializer,
    LocationSerializer,
    MapLocationSerializer,
    ProvinceClimateSerializer,
    ProvinceSeveritySerializer,
    build_lightweight_case_queryset,
)
from .services.common import (
    DEFAULT_VIEWPORT,
    apply_case_filters,
    build_latest_climate_series,
    build_province_case_heatmap,
    build_province_weighted_severity,
    parse_filter_query_params,
    parse_viewport_query_params,
)
from .services.detail import get_case_detail_payload
from .services.lookups import get_filter_options_payload
from .services.map_data import get_map_data_payload
from .services.severity import (
    get_city_severity_rows,
    get_disease_severity_rows,
    get_filtered_severity_payload,
    get_province_severity_rows,
)
from .services.statistics import get_statistics_payload


def _ensure_authenticated(request):
    if not getattr(request.user, "is_authenticated", False):
        return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)
    return None


class DiseaseViewSet(ModelViewSet):
    queryset = Disease.objects.all()
    serializer_class = DiseaseSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        unauthorized = _ensure_authenticated(request)
        if unauthorized is not None:
            return unauthorized

        payload = request.data.copy()
        payload.setdefault("level_of_alertness", 1)
        payload.setdefault("id", str(uuid.uuid4()))
        serializer = self.get_serializer(data=payload)
        serializer.is_valid(raise_exception=True)
        disease = Disease.objects.create(**serializer.validated_data)
        return Response(self.get_serializer(disease).data, status=status.HTTP_201_CREATED)


class LocationViewSet(ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [AllowAny]
    http_method_names = ["get", "post", "head", "options"]

    def create(self, request, *args, **kwargs):
        unauthorized = _ensure_authenticated(request)
        if unauthorized is not None:
            return unauthorized

        serializer = CreateLocationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        location = Location.objects.create(
            id=uuid.uuid4(),
            city=serializer.validated_data["city"],
            province=serializer.validated_data["province"],
            latitude=serializer.validated_data.get("latitude"),
            longitude=serializer.validated_data.get("longitude"),
        )
        return Response(LocationSerializer(location).data, status=status.HTTP_201_CREATED)


class CaseDetailView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "map_detail"

    def get(self, request, case_id):
        payload = get_case_detail_payload(case_id)
        if payload is None:
            return Response({"detail": "Case not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(payload)


class MapDetailView(CaseDetailView):
    pass


class CaseLocationsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        payload = MapLocationSerializer(build_lightweight_case_queryset(), many=True).data
        return Response(payload)

    def post(self, request):
        if "name" in request.data or "city" in request.data:
            unauthorized = _ensure_authenticated(request)
            if unauthorized is not None:
                return unauthorized

            serializer = CreateLocationSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            location = Location.objects.create(
                id=uuid.uuid4(),
                city=serializer.validated_data["city"],
                province=serializer.validated_data["province"],
                latitude=serializer.validated_data.get("latitude"),
                longitude=serializer.validated_data.get("longitude"),
            )
            return Response(LocationSerializer(location).data, status=status.HTTP_201_CREATED)

        serializer = FilterLocationsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        filtered_queryset = apply_case_filters(build_lightweight_case_queryset(), serializer.validated_data)
        payload = MapLocationSerializer(filtered_queryset, many=True).data
        return Response(payload)


class MapDataView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "map_data"

    def get(self, request):
        filters = parse_filter_query_params(request.query_params)
        viewport = parse_viewport_query_params(request.query_params)
        return Response(get_map_data_payload(filters, viewport))


class ProvinceWeightedSeverityView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        serializer = ProvinceSeveritySerializer(build_province_weighted_severity(), many=True)
        return Response(serializer.data)


class ProvinceClimateView(APIView):
    permission_classes = [AllowAny]
    metric = ""

    def get(self, request):
        serializer = ProvinceClimateSerializer(
            build_latest_climate_series(
                self.metric,
                year=request.query_params.get("year"),
                month=request.query_params.get("month"),
            ),
            many=True,
        )
        return Response(serializer.data)


class DiseaseSeverityStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"data": get_disease_severity_rows()})


class ProvinceSeverityStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"data": get_province_severity_rows()})


class CitySeverityStatsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"data": get_city_severity_rows()})


class SeverityStatsFilterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FilterLocationsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(get_filtered_severity_payload(serializer.validated_data))


class StatisticsView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "statistics"

    def get(self, request):
        filters = parse_filter_query_params(request.query_params)
        return Response(get_statistics_payload(filters))

    def post(self, request):
        serializer = FilterLocationsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(get_statistics_payload(serializer.validated_data))


class ProvinceHumidityView(ProvinceClimateView):
    metric = "humidity"


class ProvinceTemperatureView(ProvinceClimateView):
    metric = "temperature"


class ProvincePrecipitationView(ProvinceClimateView):
    metric = "precipitation"


class ProvinceCaseHeatmapView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        filters = parse_filter_query_params(request.query_params)
        serializer = ProvinceSeveritySerializer(build_province_case_heatmap(filters), many=True)
        return Response(serializer.data)


class DiseaseNameListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(list(Disease.objects.order_by("name").values_list("name", flat=True)))


class DiseaseListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(DiseaseSerializer(Disease.objects.order_by("name"), many=True).data)

    def post(self, request):
        unauthorized = _ensure_authenticated(request)
        if unauthorized is not None:
            return unauthorized

        payload = request.data.copy()
        payload.setdefault("level_of_alertness", 1)
        payload.setdefault("id", str(uuid.uuid4()))
        serializer = DiseaseSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        disease = Disease.objects.create(**serializer.validated_data)
        return Response(DiseaseSerializer(disease).data, status=status.HTTP_201_CREATED)


class FiltersView(APIView):
    permission_classes = [AllowAny]
    throttle_scope = "filters"

    def get(self, request):
        return Response(get_filter_options_payload())


class SpatialComparisonsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        regions = request.data.get("regions", [])
        comparisons = []

        for index, region in enumerate(regions):
            label = (region.get("label") or f"Region {index + 1}").strip()
            raw_filters = region.get("filters") or {}
            locations = get_map_data_payload(raw_filters, {**DEFAULT_VIEWPORT, "zoom": 6})
            comparisons.append(
                {
                    "label": label,
                    "count": sum(int(item.get("cluster_count") or 1) for item in locations),
                    "locations": locations,
                    "filters": raw_filters,
                }
            )

        return Response({"comparisons": comparisons})
