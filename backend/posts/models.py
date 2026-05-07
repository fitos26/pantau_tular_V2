from django.db import models


class CuratedTag(models.Model):
    id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "news_feature_curatedtag"
        ordering = ("name",)

    def __str__(self) -> str:
        return self.name


class NewsArticle(models.Model):
    id = models.UUIDField(primary_key=True)
    title = models.CharField(max_length=500)
    summary = models.TextField()
    source_url = models.CharField(max_length=200)
    source_name = models.CharField(max_length=255)
    thumbnail_url = models.CharField(max_length=200, blank=True)
    published_at = models.DateTimeField()
    is_curated = models.BooleanField(default=False)
    curator_note = models.TextField(blank=True)
    external_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    curated_tags = models.ManyToManyField(
        CuratedTag,
        blank=True,
        related_name="articles",
        db_table="news_feature_newsarticle_curated_tags",
    )

    class Meta:
        managed = False
        db_table = "news_feature_newsarticle"
        ordering = ("-created_at",)

    def __str__(self) -> str:
        return self.title
