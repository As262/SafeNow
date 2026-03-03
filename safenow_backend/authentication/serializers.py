from rest_framework import serializers
from .models import User, UserSession


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'mobile', 'name', 'email', 'role', 'created_at']
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
