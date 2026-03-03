import logging
from django.utils import timezone
from django.db.models import Count, Avg, Q
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from sos.models import SOSRequest

logger = logging.getLogger('sos')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analytics_view(request):
    """Get analytics data (admin only)."""
    if request.user.role != 'admin':
        return Response(
            {'success': False, 'message': 'Admin access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    now = timezone.now()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Total requests
    total_requests = SOSRequest.objects.count()

    # Active (pending) requests
    active_requests = SOSRequest.objects.filter(status='pending').count()

    # Completed today
    completed_today = SOSRequest.objects.filter(
        status__in=['accepted', 'completed'],
        updated_at__gte=today_start
    ).count()

    # Average response time (only for accepted/completed requests with response_time)
    accepted_requests = SOSRequest.objects.filter(
        accepted_at__isnull=False,
        created_at__isnull=False,
    )

    total_seconds = 0
    count = 0
    for req in accepted_requests:
        if req.accepted_at and req.created_at:
            diff = (req.accepted_at - req.created_at).total_seconds()
            total_seconds += diff
            count += 1

    avg_response_minutes = round(total_seconds / (count * 60), 1) if count > 0 else 0
    avg_response_time = f"{avg_response_minutes} minutes" if count > 0 else "N/A"

    # Requests by type
    requests_by_type = list(
        SOSRequest.objects.values('type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )

    # Response time data by time of day (last 30 days)
    thirty_days_ago = now - timedelta(days=30)
    response_time_data = []
    for hour in [0, 4, 8, 12, 16, 20]:
        hour_requests = accepted_requests.filter(
            created_at__gte=thirty_days_ago,
            created_at__hour__gte=hour,
            created_at__hour__lt=hour + 4,
        )
        total_mins = 0
        cnt = 0
        for req in hour_requests:
            if req.accepted_at:
                diff = (req.accepted_at - req.created_at).total_seconds() / 60
                total_mins += diff
                cnt += 1
        avg_time = round(total_mins / cnt, 1) if cnt > 0 else 0
        response_time_data.append({
            'time': f"{hour:02d}:00",
            'avgTime': avg_time,
        })

    return Response({
        'success': True,
        'analytics': {
            'totalRequests': total_requests,
            'activeRequests': active_requests,
            'completedToday': completed_today,
            'averageResponseTime': avg_response_time,
            'requestsByType': requests_by_type,
            'responseTimeData': response_time_data,
        }
    })
