import uuid

from rest_framework import serializers

from .models import CuratedTag, NewsArticle


class NewsArticleSerializer(serializers.ModelSerializer):
    curated_tags = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        write_only=True,
    )

    class Meta:
        model = NewsArticle
        fields = (
            "id",
            "title",
            "summary",
            "source_name",
            "source_url",
            "thumbnail_url",
            "published_at",
            "is_curated",
            "curated_tags",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["curated_tags"] = list(instance.curated_tags.values_list("name", flat=True))
        return data

    def _resolve_tags(self, tags: list[str]) -> list[CuratedTag]:
        cleaned_tags = [tag.strip() for tag in tags if tag.strip()]
        resolved = []
        for tag_name in cleaned_tags:
            tag = CuratedTag.objects.filter(name__iexact=tag_name).first()
            if tag is None:
                tag = CuratedTag.objects.create(name=tag_name)
            resolved.append(tag)
        return resolved

    def create(self, validated_data):
        tags = validated_data.pop("curated_tags", [])
        article = NewsArticle.objects.create(
            id=validated_data.pop("id", uuid.uuid4()),
            external_id=f"api-{uuid.uuid4()}",
            curator_note="",
            **validated_data,
        )
        if tags:
            article.curated_tags.set(self._resolve_tags(tags))
        return article

    def update(self, instance, validated_data):
        tags = validated_data.pop("curated_tags", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        if tags is not None:
            instance.curated_tags.set(self._resolve_tags(tags))
        return instance
