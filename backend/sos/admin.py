from django.contrib import admin
from .models import SOSRequest


@admin.register(SOSRequest)
class SOSRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'type', 'status', 'created_at', 'responded_by']
    list_filter = ['status', 'type']
    search_fields = ['user__mobile', 'user__name', 'address']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']
