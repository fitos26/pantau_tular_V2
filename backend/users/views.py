from django.conf import settings
from django.core import signing
from django.db import DatabaseError, connection
from rest_framework import status
from rest_framework.permissions import AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError

from .models import AdminUserLog, LegacyUser
from .serializers import (
    AdminUserListSerializer,
    AdminUserLogSerializer,
    AdminUserRoleUpdateSerializer,
    LoginSerializer,
    RegisterSerializer,
)


class IsAdminUser(BasePermission):
    message = "Hanya admin yang dapat mengakses endpoint ini."

    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        return bool(user and getattr(user, "is_authenticated", False) and getattr(user, "role", None) == "ADMIN")


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        token_serializer = LoginSerializer(
            data={
                "email": user.email,
                "password": request.data.get("password"),
            },
            context={"request": request},
        )
        token_serializer.is_valid(raise_exception=True)

        return Response(
            {
                "detail": "Registration successful.",
                "user": token_serializer.validated_data["user"],
                "access_token": token_serializer.validated_data["access_token"],
                "refresh_token": token_serializer.validated_data["refresh_token"],
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            refresh = RefreshToken(refresh_token)
            access = refresh.access_token
            return Response(
                {
                    "access": str(access),
                    "access_token": str(access),
                },
                status=status.HTTP_200_OK,
            )
        except TokenError:
            return Response({"detail": "Refresh token is invalid or expired."}, status=status.HTTP_401_UNAUTHORIZED)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = str(request.data.get("email", "")).strip().lower()

        response_payload = {
            "detail": "Jika email terdaftar, kami telah mengirimkan link reset password.",
        }

        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = LegacyUser.objects.get(email=email)
        except LegacyUser.DoesNotExist:
            return Response(response_payload, status=status.HTTP_200_OK)

        token = signing.TimestampSigner().sign(f"reset:{user.id}:{user.password}")
        if settings.DEBUG:
            response_payload["reset_path"] = f"/forgot-password/reset/{user.id}/{token}"
            response_payload["reset_url"] = f"http://localhost:3000/forgot-password/reset/{user.id}/{token}"

        return Response(response_payload, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, uid: str, token: str):
        password = str(request.data.get("password", ""))
        confirm_password = str(
            request.data.get("password-confirm", request.data.get("confirmPassword", ""))
        )

        if not password or not confirm_password:
            return Response({"detail": "Password dan konfirmasi password wajib diisi."}, status=status.HTTP_400_BAD_REQUEST)

        if password != confirm_password:
            return Response({"detail": "Konfirmasi password tidak sesuai."}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({"detail": "Password minimal 8 karakter."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = LegacyUser.objects.get(id=int(uid))
        except (LegacyUser.DoesNotExist, ValueError):
            return Response({"detail": "Link reset password tidak valid."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            unsigned = signing.TimestampSigner().unsign(token, max_age=60 * 60 * 24)
        except signing.SignatureExpired:
            return Response({"detail": "Link reset password sudah kadaluarsa."}, status=status.HTTP_400_BAD_REQUEST)
        except signing.BadSignature:
            return Response({"detail": "Link reset password tidak valid atau kadaluarsa."}, status=status.HTTP_400_BAD_REQUEST)

        expected = f"reset:{user.id}:{user.password}"
        if unsigned != expected:
            return Response({"detail": "Link reset password tidak valid."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(password)
        user.save(update_fields=["password"])
        return Response({"detail": "Password berhasil diganti."}, status=status.HTTP_200_OK)


class AdminUsersView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = LegacyUser.objects.all().order_by("-id")
        return Response(AdminUserListSerializer(users, many=True).data, status=status.HTTP_200_OK)


class AdminUserDetailView(APIView):
    permission_classes = [IsAdminUser]

    def delete(self, request, user_id: int):
        try:
            user = LegacyUser.objects.get(id=user_id)
        except LegacyUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        if user.id == getattr(request.user, "id", None):
            return Response({"detail": "Admin tidak dapat menghapus akun sendiri."}, status=status.HTTP_403_FORBIDDEN)

        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminUserRoleView(APIView):
    permission_classes = [IsAdminUser]

    def put(self, request, user_id: int):
        try:
            user = LegacyUser.objects.get(id=user_id)
        except LegacyUser.DoesNotExist:
            return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminUserRoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.role = serializer.validated_data["role_name"]
        user.save(update_fields=["role"])
        return Response(AdminUserListSerializer(user).data, status=status.HTTP_200_OK)


class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get_datasets_count(self) -> int:
        if connection.vendor == "postgresql":
            try:
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        select exists (
                            select 1
                            from information_schema.tables
                            where table_schema = 'public'
                              and table_name = 'expert_dataset'
                        )
                        """
                    )
                    exists = bool(cursor.fetchone()[0])
                    if not exists:
                        return 0

                    cursor.execute('select count(*) from "public"."expert_dataset"')
                    row = cursor.fetchone()
                    return int(row[0] if row else 0)
            except DatabaseError:
                return 0

        if "expert_dataset" not in set(connection.introspection.table_names()):
            return 0

        try:
            with connection.cursor() as cursor:
                cursor.execute(f"select count(*) from {connection.ops.quote_name('expert_dataset')}")
                row = cursor.fetchone()
                return int(row[0] if row else 0)
        except DatabaseError:
            return 0

        return 0

    def get(self, request):
        total_users = LegacyUser.objects.count()
        roles = [label for _, label in LegacyUser.ROLE_CHOICES]
        datasets_count = self.get_datasets_count()

        return Response(
            {
                "totalUsers": total_users,
                "datasets": datasets_count,
                "roles": roles,
            },
            status=status.HTTP_200_OK,
        )


class AdminUserLogListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        logs = AdminUserLog.objects.all().order_by("-timestamp", "-id")
        payload = AdminUserLogSerializer(logs, many=True).data
        return Response({"count": len(payload), "logs": payload}, status=status.HTTP_200_OK)


class ExpertBatchesView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response([], status=status.HTTP_200_OK)
