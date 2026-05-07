from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from posts.views import NewsArticleViewSet
from users.views import (
    AdminStatsView,
    AdminUserDetailView,
    AdminUserLogListView,
    AdminUserRoleView,
    AdminUsersView,
    ExpertBatchesView,
    LoginView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RefreshView,
    RegisterView,
)


router = DefaultRouter()
router.register("posts", NewsArticleViewSet, basename="post")
router.register("news", NewsArticleViewSet, basename="news")

admin_feature_patterns = [
    path("stats", AdminStatsView.as_view(), name="admin-stats"),
    path("users", AdminUsersView.as_view(), name="admin-users"),
    path("users/<int:user_id>", AdminUserDetailView.as_view(), name="admin-user-detail"),
    path("users/<int:user_id>/role", AdminUserRoleView.as_view(), name="admin-user-role"),
    path("api/admin/user-logs/all", AdminUserLogListView.as_view(), name="admin-user-logs-all"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/register", RegisterView.as_view(), name="register"),
    path("api/login", LoginView.as_view(), name="login"),
    path("api/token/refresh", RefreshView.as_view(), name="token-refresh"),
    path("authentication/password-reset-request", PasswordResetRequestView.as_view(), name="password-reset-request"),
    path(
        "authentication/password-reset-confirm/<str:uid>/<path:token>",
        PasswordResetConfirmView.as_view(),
        name="password-reset-confirm",
    ),
    path("expert-feature/experts/batches/", ExpertBatchesView.as_view(), name="expert-batches"),
    path("admin-feature/", include((admin_feature_patterns, "admin_feature"))),
    path("api/admin-feature/", include((admin_feature_patterns, "api_admin_feature"))),
    path("", include("cases.urls")),
    path("api/", include(router.urls)),
]
