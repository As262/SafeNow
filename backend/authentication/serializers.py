from rest_framework import serializers
from .models import User, UserSession, ServiceProvider


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'mobile', 'name', 'email', 'role', 'created_at']
        read_only_fields = ['id', 'created_at']


class ServiceProviderSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceProvider
        fields = ['id', 'service_id', 'name', 'email', 'role', 'phone', 'address', 'created_at']
        read_only_fields = ['id', 'created_at']


class SendOTPSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)

    def validate_mobile(self, value):
        # Remove any non-digit characters
        cleaned = ''.join(filter(str.isdigit, value))
        if len(cleaned) != 10:
            raise serializers.ValidationError("Mobile number must be 10 digits.")
        return cleaned


class VerifyOTPSerializer(serializers.Serializer):
    mobile = serializers.CharField(max_length=15)
    otp = serializers.CharField(max_length=6)

    def validate_mobile(self, value):
        cleaned = ''.join(filter(str.isdigit, value))
        if len(cleaned) != 10:
            raise serializers.ValidationError("Mobile number must be 10 digits.")
        return cleaned

    def validate_otp(self, value):
        cleaned = ''.join(filter(str.isdigit, value))
        if len(cleaned) != 6:
            raise serializers.ValidationError("OTP must be 6 digits.")
        return cleaned


class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['id', 'device_info', 'ip_address', 'is_active', 'created_at', 'last_activity']
        read_only_fields = ['id', 'created_at', 'last_activity']


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['name', 'email']


class ServiceLoginSerializer(serializers.Serializer):
    service_id = serializers.CharField(max_length=20)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate_service_id(self, value):
        value = value.upper().strip()
        # Validate format: PREFIX-NUMBER
        import re
        if not re.match(r'^(ADM|HSP|FIR|NGO)-\d+$', value):
            raise serializers.ValidationError(
                "Invalid Service ID format. Use PREFIX-NUMBER (e.g., HSP-001)"
            )
        return value
