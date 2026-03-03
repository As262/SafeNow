import json
import logging
import threading
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from .models import SOSRequest
from .serializers import (
    SOSRequestCreateSerializer,
    SOSRequestSerializer,
    SOSRequestUpdateSerializer,
)
from authentication.models import User

logger = logging.getLogger('sos')


def is_admin(user):
    return user.role == 'admin'


def serialize_for_ws(serializer_data):
    """Convert DRF serializer data to plain JSON-safe dict."""
    return json.loads(JSONRenderer().render(serializer_data))


def notify_ws(group, msg_type, data):
    """Send WebSocket notification in a separate thread to avoid async_to_sync issues under ASGI."""
    def _send():
        try:
            import asyncio
            from channels.layers import get_channel_layer
            channel_layer = get_channel_layer()
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(
                channel_layer.group_send(group, {'type': msg_type, 'request': data})
            )
            loop.close()
            logger.info(f"WS notification sent: {msg_type} to {group}")
        except Exception as e:
            logger.warning(f"WS notification failed: {e}")
    threading.Thread(target=_send, daemon=True).start()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_sos_request(request):
    """Submit a new SOS emergency request."""
    serializer = SOSRequestCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    sos = SOSRequest.objects.create(
        user=request.user,
        type=serializer.validated_data['type'],
        latitude=serializer.validated_data['latitude'],
        longitude=serializer.validated_data['longitude'],
        accuracy=serializer.validated_data.get('accuracy'),
        address=serializer.validated_data.get('address', ''),
    )

    sos_data = SOSRequestSerializer(sos).data

    # Notify admin via WebSocket (in background thread)
    notify_ws('admin_sos', 'new_sos_request', serialize_for_ws(sos_data))

    return Response({
        'success': True,
        'request': sos_data,
        'message': 'Emergency request sent successfully. Help is on the way!',
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_requests(request):
    """Get the authenticated user's SOS request history."""
    requests_qs = SOSRequest.objects.filter(user=request.user)
    serializer = SOSRequestSerializer(requests_qs, many=True)

    return Response({
        'success': True,
        'requests': serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def all_sos_requests(request):
    """Get all SOS requests (admin only)."""
    if not is_admin(request.user):
        return Response(
            {'success': False, 'message': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    requests_qs = SOSRequest.objects.select_related('user', 'responded_by').all()
    serializer = SOSRequestSerializer(requests_qs, many=True)

    return Response({
        'success': True,
        'requests': serializer.data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_request_status(request, request_id):
    """Update SOS request status (admin only)."""
    if not is_admin(request.user):
        return Response(
            {'success': False, 'message': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        sos = SOSRequest.objects.get(id=request_id)
    except SOSRequest.DoesNotExist:
        return Response(
            {'success': False, 'message': 'Request not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = SOSRequestUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    new_status = serializer.validated_data['status']
    notes = serializer.validated_data.get('notes', '')

    sos.status = new_status
    sos.notes = notes
    sos.responded_by = request.user

    if new_status == 'accepted':
        sos.accepted_at = timezone.now()
        sos.response_time = sos.calculate_response_time()
    elif new_status == 'completed':
        sos.completed_at = timezone.now()

    sos.save()

    sos_data = SOSRequestSerializer(sos).data
    ws_data = serialize_for_ws(sos_data)

    # Notify via WebSocket (in background threads)
    notify_ws('admin_sos', 'sos_status_update', ws_data)
    notify_ws(f'user_{sos.user.mobile}', 'sos_status_update', ws_data)

    return Response({
        'success': True,
        'message': f'Request {new_status} successfully',
        'requestId': str(sos.id),
        'status': new_status,
    })
