import uuid
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom manager for User model using mobile as unique identifier."""

    def create_user(self, mobile, name='', role='user', **extra_fields):
        if not mobile:
            raise ValueError('Mobile number is required')
        user = self.model(mobile=mobile, name=name, role=role, **extra_fields)
        # No password for OTP-based auth
        user.set_unusable_password()
        user.save(using=self._db)
        return user

    def create_superuser(self, mobile, name='Admin', **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'admin')
        return self.create_user(mobile, name, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom User model with mobile-based authentication."""

    ROLE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
        ('hospital', 'Hospital'),
        ('fire', 'Fire Department'),
        ('ngo', 'NGO'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    mobile = models.CharField(max_length=15, unique=True, db_index=True)
    name = models.CharField(max_length=150, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='user')
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = 'mobile'
    REQUIRED_FIELDS = ['name']

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.mobile})"


class OTP(models.Model):
    """OTP model for mobile verification via Twilio."""

    mobile = models.CharField(max_length=15, db_index=True)
    otp_code = models.CharField(max_length=6)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    attempts = models.IntegerField(default=0)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"OTP for {self.mobile} - {'Verified' if self.is_verified else 'Pending'}"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    def save(self, *args, **kwargs):
        if not self.expires_at:
            from django.conf import settings
            self.expires_at = timezone.now() + timezone.timedelta(
                minutes=settings.OTP_EXPIRY_MINUTES
            )
        super().save(*args, **kwargs)


class ServiceProvider(models.Model):
    """Service Provider model for hospitals, fire departments, NGOs, and admins."""

    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('hospital', 'Hospital'),
        ('fire', 'Fire Department'),
        ('ngo', 'NGO'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    service_id = models.CharField(max_length=20, unique=True, db_index=True)
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Hashed password
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    phone = models.CharField(max_length=15, blank=True, default='')
    address = models.TextField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.service_id})"

    def save(self, *args, **kwargs):
        """Auto-extract role from service_id prefix if not set."""
        if not self.role and self.service_id and len(self.service_id) == 7:
            prefix = self.service_id[:3]
            if prefix == '400':
                self.role = 'admin'
            elif prefix == '100':
                self.role = 'hospital'
            elif prefix == '300':
                self.role = 'fire'
            elif prefix == '200':
                self.role = 'ngo'
        super().save(*args, **kwargs)


class EmergencyContact(models.Model):
    """Emergency contacts for a user (max 3 per user)."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='emergency_contacts'
    )
    name = models.CharField(max_length=150)
    relationship = models.CharField(max_length=100, blank=True, default='')
    phone_number = models.CharField(max_length=20)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.name} ({self.phone_number}) — {self.user.name}"


class UserSession(models.Model):
    """Track active user sessions with JWT tokens."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    token_id = models.CharField(max_length=255, unique=True)  # JWT jti claim
    device_info = models.CharField(max_length=500, blank=True, default='')
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Session {self.id} for {self.user.name}"
