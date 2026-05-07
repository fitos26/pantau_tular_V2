from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import AuthenticationFailed

from .models import LegacyUser


class LegacyJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        if user_id is None:
            raise AuthenticationFailed("Token contained no recognizable user identification.")

        try:
            return LegacyUser.objects.get(id=user_id)
        except LegacyUser.DoesNotExist as exc:
            raise AuthenticationFailed("User not found.") from exc
