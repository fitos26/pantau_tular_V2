from django.db import IntegrityError
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import AdminUserLog, LegacyUser


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegacyUser
        fields = ("id", "email", "name", "role")


class AdminUserListSerializer(serializers.ModelSerializer):
    class Meta:
        model = LegacyUser
        fields = ("id", "name", "email", "last_login", "role")


class AdminUserRoleUpdateSerializer(serializers.Serializer):
    role_name = serializers.ChoiceField(choices=[choice for choice, _ in LegacyUser.ROLE_CHOICES])


class AdminUserLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminUserLog
        fields = ("id", "username", "email", "timestamp", "action", "detail", "note", "created_at")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.CharField(required=False, default="CONTRIBUTOR")

    class Meta:
        model = LegacyUser
        fields = ("id", "email", "name", "password", "role")
        read_only_fields = ("id",)

    def validate_role(self, value: str) -> str:
        return (value or "CONTRIBUTOR").upper()

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def validate_name(self, value: str) -> str:
        normalized = " ".join((value or "").split()).strip()
        if not normalized:
            raise serializers.ValidationError("Name is required.")
        return normalized

    def create(self, validated_data):
        user = LegacyUser(
            email=validated_data["email"],
            name=validated_data["name"],
            role=validated_data.get("role", "CONTRIBUTOR").upper(),
        )
        user.set_password(validated_data["password"])
        try:
            user.save(force_insert=True)
        except IntegrityError as exc:
            raise serializers.ValidationError({"email": "Email already exists."}) from exc
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_email(self, value: str) -> str:
        return value.strip().lower()

    def _build_tokens(self, user: LegacyUser) -> tuple[str, str]:
        refresh = RefreshToken()
        refresh["user_id"] = user.id
        refresh["email"] = user.email
        refresh["name"] = user.name
        refresh["role"] = user.role

        access = refresh.access_token
        access["user_id"] = user.id
        access["email"] = user.email
        access["name"] = user.name
        access["role"] = user.role
        return str(access), str(refresh)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")
        try:
            user = LegacyUser.objects.get(email=email)
        except LegacyUser.DoesNotExist as exc:
            raise serializers.ValidationError({"detail": "Invalid email or password."}) from exc

        if not user.check_password(password):
            raise serializers.ValidationError({"detail": "Invalid email or password."})

        access_token, refresh_token = self._build_tokens(user)
        return {
            "detail": "Login successful.",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": UserSerializer(user).data,
        }
