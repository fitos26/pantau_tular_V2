from django.db.models import Count, Q
from rest_framework import serializers

from .models import Case, Climate, Disease, HealthProtocolDisease, Location


class DiseaseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Disease
        fields = ("id", "name", "level_of_alertness")


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ("id", "latitude", "longitude", "city", "province")


class MapLocationSerializer(serializers.ModelSerializer):
    location__longitude = serializers.SerializerMethodField()
    location__latitude = serializers.SerializerMethodField()
    location__province = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = ("id", "location__longitude", "location__latitude", "location__province", "city")

    def get_location__longitude(self, obj):
        return float(obj.location.longitude) if obj.location and obj.location.longitude is not None else None

    def get_location__latitude(self, obj):
        return float(obj.location.latitude) if obj.location and obj.location.latitude is not None else None

    def get_location__province(self, obj):
        return obj.location.province.strip() if obj.location and obj.location.province else None


class CaseDetailSerializer(serializers.ModelSerializer):
    location = serializers.SerializerMethodField()
    level_of_alertness = serializers.SerializerMethodField()
    related_search = serializers.SerializerMethodField()
    news = serializers.SerializerMethodField()
    health_protocols = serializers.SerializerMethodField()
    total_news = serializers.SerializerMethodField()
    disease_name = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Case
        fields = (
            "id",
            "location",
            "severity",
            "gender",
            "age",
            "level_of_alertness",
            "disease_name",
            "date",
            "total_news",
            "related_search",
            "news",
            "health_protocols",
        )

    def get_location(self, obj):
        city = obj.location.city.strip() if obj.location and obj.location.city else ""
        province = obj.location.province.strip() if obj.location and obj.location.province else ""
        return f"{city}, {province}".strip(", ")

    def get_level_of_alertness(self, obj):
        return obj.disease.level_of_alertness

    def get_related_search(self, obj):
        query = f"{obj.disease.name} {obj.location.city} {obj.location.province}"
        return f"https://www.google.com/search?q={query.replace(' ', '+')}"

    def get_total_news(self, obj):
        return obj.news_items.count()

    def get_disease_name(self, obj):
        return obj.disease.name

    def get_date(self, obj):
        return obj.created_at.isoformat()

    def get_news(self, obj):
        items = []
        for news in obj.news_items.all()[:5]:
            items.append(
                {
                    "img_url": news.img_url,
                    "url": news.url,
                    "date": news.date_published.isoformat(),
                    "title": news.title,
                    "domain": news.portal,
                    "content": news.content,
                }
            )
        return items

    def get_health_protocols(self, obj):
        mappings = (
            HealthProtocolDisease.objects.filter(disease_id=obj.disease_id)
            .select_related("health_protocol")
            .all()
        )
        return [{"title": item.health_protocol.title, "url": item.health_protocol.url} for item in mappings]


class FilterLocationsSerializer(serializers.Serializer):
    diseases = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    locations = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    portals = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    level_of_alertness = serializers.IntegerField(required=False, default=0)
    start_date = serializers.DateTimeField(required=False, allow_null=True)
    end_date = serializers.DateTimeField(required=False, allow_null=True)
    batch = serializers.UUIDField(required=False, allow_null=True)


class CreateLocationSerializer(serializers.ModelSerializer):
    name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Location
        fields = ("id", "name", "latitude", "longitude", "city", "province")
        read_only_fields = ("id",)

    def validate(self, attrs):
        name = attrs.pop("name", "").strip()
        if name and not attrs.get("city"):
            attrs["city"] = name
        if not attrs.get("city"):
            raise serializers.ValidationError({"city": "City or name is required."})
        attrs.setdefault("province", attrs["city"])
        return attrs


class ProvinceSeveritySerializer(serializers.Serializer):
    id = serializers.CharField()
    province = serializers.CharField(required=False)
    value = serializers.IntegerField()
    status = serializers.CharField(allow_null=True)


class ProvinceClimateSerializer(serializers.Serializer):
    id = serializers.CharField()
    province = serializers.CharField(required=False)
    value = serializers.FloatField()
    status = serializers.CharField(allow_null=True)
    year = serializers.IntegerField(required=False, allow_null=True)
    month = serializers.IntegerField(required=False, allow_null=True)
    aggregation = serializers.CharField(required=False)


def build_base_case_queryset():
    return Case.objects.select_related("disease", "location").prefetch_related("news_items").all()


def build_lightweight_case_queryset():
    return Case.objects.select_related("disease", "location").all()


def apply_case_filters(queryset, filters):
    diseases = filters.get("diseases") or []
    locations = filters.get("locations") or []
    portals = filters.get("portals") or []
    level = filters.get("level_of_alertness") or 0
    start_date = filters.get("start_date")
    end_date = filters.get("end_date")
    batch = filters.get("batch")

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


def build_province_weighted_severity():
    rows = (
        Case.objects.select_related("disease", "location")
        .values("location__province")
        .annotate(value=Count("id") + Count("id", filter=Q(disease__level_of_alertness=3)) * 2)
        .order_by("location__province")
    )
    return [
        {"id": row["location__province"], "value": row["value"], "status": None}
        for row in rows
        if row["location__province"]
    ]


def build_latest_climate_series(field_name: str):
    rows = (
        Climate.objects.all()
        .order_by("province", "-year", "-month")
    )
    seen = set()
    payload = []
    for row in rows:
        province = (row.province or "").strip()
        if not province or province in seen:
            continue
        seen.add(province)
        payload.append(
            {
                "id": province,
                "value": float(getattr(row, field_name)),
                "status": None,
            }
        )
    return payload
