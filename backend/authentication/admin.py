from django.contrib import admin
from .models import User, OTP, UserSession, ServiceProvider, PointsTransaction


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['mobile', 'name', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['mobile', 'name', 'email']
    ordering = ['-created_at']


@admin.register(ServiceProvider)
class ServiceProviderAdmin(admin.ModelAdmin):
    list_display = ['service_id', 'name', 'role', 'email', 'is_active', 'created_at']
    list_filter = ['role', 'is_active']
    search_fields = ['service_id', 'name', 'email']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(OTP)
class OTPAdmin(admin.ModelAdmin):
    list_display = ['mobile', 'otp_code', 'is_verified', 'created_at', 'expires_at']
    list_filter = ['is_verified']
    search_fields = ['mobile']
    ordering = ['-created_at']


@admin.register(UserSession)
class UserSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'ip_address', 'is_active', 'created_at', 'last_activity']
    list_filter = ['is_active']
    search_fields = ['user__mobile', 'user__name']
    ordering = ['-created_at']


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ['user', 'transaction_type', 'amount', 'balance_after', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['user__mobile', 'user__name', 'description']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
