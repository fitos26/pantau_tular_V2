from django.contrib.auth.hashers import check_password, make_password
from django.db import models


class LegacyRole(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)

    class Meta:
        managed = False
        db_table = "pt_backend_role"

    def __str__(self) -> str:
        return self.name


class LegacyUser(models.Model):
    ROLE_CHOICES = (
        ("ADMIN", "Admin"),
        ("CURATOR", "Curator"),
        ("CONTRIBUTOR", "Contributor"),
        ("EXP_USER", "Expert User"),
        ("TENAGA_AHLI", "Tenaga Ahli"),
    )

    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=255, choices=ROLE_CHOICES, default="CONTRIBUTOR")
    email = models.EmailField(unique=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "pt_backend_user"

    def __str__(self) -> str:
        return self.email

    @property
    def is_authenticated(self) -> bool:
        return True

    @property
    def is_anonymous(self) -> bool:
        return False

    @property
    def is_active(self) -> bool:
        return True

    def set_password(self, raw_password: str) -> None:
        self.password = make_password(raw_password)

    def check_password(self, raw_password: str) -> bool:
        if not self.password:
            return False
        if self.password.startswith("pbkdf2_"):
            return check_password(raw_password, self.password)
        return self.password == raw_password


class AdminUserLog(models.Model):
    id = models.BigAutoField(primary_key=True)
    username = models.CharField(max_length=255)
    email = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField()
    action = models.CharField(max_length=255, null=True, blank=True)
    detail = models.TextField(null=True, blank=True)
    note = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        managed = False
        db_table = "admin_feature_userlog"
