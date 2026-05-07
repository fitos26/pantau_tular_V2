from django.contrib import admin
from .models import LegacyUser


@admin.register(LegacyUser)
class LegacyUserAdmin(admin.ModelAdmin):
    list_display = ("id", "email", "name", "role", "last_login")
    ordering = ("email",)
    search_fields = ("email", "name")
