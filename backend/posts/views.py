from django.db.models import Q
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import NewsArticle
from .serializers import NewsArticleSerializer


class NewsArticleViewSet(ModelViewSet):
    serializer_class = NewsArticleSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        queryset = NewsArticle.objects.prefetch_related("curated_tags").all()

        search = self.request.query_params.get("search")
        source = self.request.query_params.get("source")
        tags = self.request.query_params.get("tags")
        curated_only = self.request.query_params.get("curated_only")
        from_date = self.request.query_params.get("from_date")
        to_date = self.request.query_params.get("to_date")
        has_image = self.request.query_params.get("has_image")

        if search:
            queryset = queryset.filter(Q(title__icontains=search) | Q(summary__icontains=search))
        if source:
            queryset = queryset.filter(source_name__icontains=source)
        if curated_only == "true":
            queryset = queryset.filter(is_curated=True)
        if from_date:
            queryset = queryset.filter(published_at__date__gte=from_date)
        if to_date:
            queryset = queryset.filter(published_at__date__lte=to_date)
        if has_image == "true":
            queryset = queryset.exclude(thumbnail_url="")
        if has_image == "false":
            queryset = queryset.filter(thumbnail_url="")
        if tags:
            tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]
            if tag_list:
                queryset = queryset.filter(curated_tags__name__in=tag_list).distinct()

        return queryset.order_by("-published_at", "-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        page = max(int(request.query_params.get("page", 1)), 1)
        page_size = max(int(request.query_params.get("page_size", 10)), 1)
        start = (page - 1) * page_size
        end = start + page_size
        serializer = self.get_serializer(queryset[start:end], many=True)
        return Response(
            {
                "data": serializer.data,
                "page": page,
                "pageSize": page_size,
                "total": queryset.count(),
            }
        )
