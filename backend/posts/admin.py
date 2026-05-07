from django.contrib import admin

from .models import NewsArticle


@admin.register(NewsArticle)
class NewsArticleAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "source_name", "published_at", "is_curated")
    search_fields = ("title", "summary", "source_name", "external_id")
    list_filter = ("created_at", "updated_at")
