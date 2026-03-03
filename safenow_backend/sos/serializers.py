from rest_framework import serializers
from .models import SOSRequest
from authentication.serializers import UserSerializer


class SOSRequestCreateSerializer(serializers.Serializer):
    """Serializer for creating a new SOS request."""
    type = serializers.ChoiceField(choices=[
        'Ambulance', 'Police', 'Medical Help', 'NGO Support'
    ])
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    accuracy = serializers.FloatField(required=False, allow_null=True)
    address = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_latitude(self, value):
        """Round to 6 decimal places to fit model constraints."""
        return round(value, 6)

    def validate_longitude(self, value):
        """Round to 6 decimal places to fit model constraints."""
        return round(value, 6)


class SOSRequestSerializer(serializers.ModelSerializer):
    """Full serializer for SOS requests."""
    userName = serializers.CharField(source='user.name', read_only=True)
    userId = serializers.CharField(source='user.mobile', read_only=True)
    location = serializers.SerializerMethodField()
    timestamp = serializers.DateTimeField(source='created_at', read_only=True)
    respondedByName = serializers.CharField(
        source='responded_by.name', read_only=True, default=None
    )

    class Meta:
        model = SOSRequest
        fields = [
            'id', 'userId', 'userName', 'type', 'location', 'status',
            'timestamp', 'response_time', 'respondedByName', 'notes',
            'created_at', 'updated_at', 'accepted_at', 'completed_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_location(self, obj):
        return {
            'latitude': float(obj.latitude),
            'longitude': float(obj.longitude),
            'accuracy': obj.accuracy,
            'address': obj.address,
        }


class SOSRequestUpdateSerializer(serializers.Serializer):
    """Serializer for updating SOS request status (admin only)."""
    status = serializers.ChoiceField(choices=['accepted', 'rejected', 'completed'])
    notes = serializers.CharField(required=False, allow_blank=True, default='')
