from django.db import models


class Disease(models.Model):
    id = models.UUIDField(primary_key=True)
    name = models.CharField(max_length=255)
    level_of_alertness = models.IntegerField()

    class Meta:
        managed = False
        db_table = "pt_backend_disease"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class Location(models.Model):
    id = models.UUIDField(primary_key=True)
    latitude = models.DecimalField(max_digits=18, decimal_places=12, null=True, blank=True)
    longitude = models.DecimalField(max_digits=18, decimal_places=12, null=True, blank=True)
    city = models.CharField(max_length=255)
    province = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "pt_backend_location"
        ordering = ("province", "city")

    def __str__(self) -> str:
        return f"{self.city}, {self.province}"


class HealthProtocol(models.Model):
    id = models.UUIDField(primary_key=True)
    title = models.CharField(max_length=255)
    url = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "pt_backend_healthprotocol"
        ordering = ("title",)


class HealthProtocolDisease(models.Model):
    id = models.UUIDField(primary_key=True)
    disease = models.ForeignKey(Disease, on_delete=models.DO_NOTHING, db_column="disease_id", related_name="+")
    health_protocol = models.ForeignKey(
        HealthProtocol,
        on_delete=models.DO_NOTHING,
        db_column="health_protocol_id",
        related_name="+",
    )

    class Meta:
        managed = False
        db_table = "pt_backend_healthprotocoldisease"


class Climate(models.Model):
    id = models.UUIDField(primary_key=True)
    province = models.CharField(max_length=255)
    temperature = models.DecimalField(max_digits=10, decimal_places=2)
    humidity = models.DecimalField(max_digits=10, decimal_places=2)
    month = models.IntegerField()
    year = models.IntegerField()
    precipitation = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        managed = False
        db_table = "pt_backend_climate"


class Case(models.Model):
    id = models.UUIDField(primary_key=True)
    gender = models.CharField(max_length=255)
    age = models.IntegerField()
    city = models.CharField(max_length=255)
    status = models.CharField(max_length=255)
    disease = models.ForeignKey(Disease, on_delete=models.DO_NOTHING, db_column="disease_id", related_name="cases")
    location = models.ForeignKey(Location, on_delete=models.DO_NOTHING, db_column="location_id", related_name="cases")
    severity = models.CharField(max_length=255)
    created_by_id = models.IntegerField(null=True, blank=True)
    batch_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField()

    class Meta:
        managed = False
        db_table = "pt_backend_case"
        ordering = ("-created_at",)


class CaseNews(models.Model):
    id = models.UUIDField(primary_key=True)
    portal = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    type = models.CharField(max_length=255)
    content = models.TextField()
    url = models.CharField(max_length=200)
    author = models.CharField(max_length=255)
    date_published = models.DateTimeField()
    case = models.ForeignKey(Case, on_delete=models.DO_NOTHING, db_column="case_id", related_name="news_items")
    img_url = models.TextField()

    class Meta:
        managed = False
        db_table = "pt_backend_news"
        ordering = ("-date_published",)
