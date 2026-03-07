import json
import logging
import threading
import os
from django.utils import timezone
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer

from .models import SOSRequest
from .serializers import (
    SOSRequestCreateSerializer,
    SOSRequestSerializer,
    SOSRequestUpdateSerializer,
)
from authentication.models import User, EmergencyContact

logger = logging.getLogger('sos')


def is_admin(user):
    return user.role == 'admin'


def is_service_provider(user):
    return user.role in ('admin', 'hospital', 'fire', 'ngo', 'police')


# Map SOS type to the service provider group(s) that should be notified
SOS_TYPE_TO_GROUPS = {
    'Medical Help': ['hospital_sos'],
    'Fire Emergency': ['fire_sos'],
    'NGO Support': ['ngo_sos'],
    'Police': ['admin_sos'],
}

# Map service role to the SOS types they handle
ROLE_TO_SOS_TYPES = {
    'hospital': ['Medical Help'],
    'fire': ['Fire Emergency'],
    'ngo': ['NGO Support'],
    'admin': None,  # Admin sees all types
}


def get_target_groups(sos_type):
    """Get the WebSocket groups to notify for a given SOS type. Admin always included."""
    groups = list(SOS_TYPE_TO_GROUPS.get(sos_type, []))
    if 'admin_sos' not in groups:
        groups.append('admin_sos')
    return groups


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


def send_emergency_sms(user, sos_request):
    """Send emergency SMS to all emergency contacts of the user."""
    # Get all emergency contacts for the user
    emergency_contacts = EmergencyContact.objects.filter(user=user)
    
    if not emergency_contacts.exists():
        logger.info(f"No emergency contacts found for user {user.name}")
        return
    
    # Check if Twilio is configured
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio credentials not configured. Cannot send emergency SMS.")
        return
    
    # Build the emergency message
    maps_link = f"https://maps.google.com/?q={sos_request.latitude},{sos_request.longitude}"
    
    message_body = (
        f"EMERGENCY ALERT: {user.name} has triggered a SafeNow SOS!\n"
        f"Emergency type: {sos_request.type}\n"
        f"Location: {sos_request.latitude}, {sos_request.longitude}\n"
        f"Maps: {maps_link}\n"
        f"Please contact them or call emergency services immediately."
    )
    
    # Send SMS to each emergency contact in a separate thread
    def _send_sms():
        try:
            from twilio.rest import Client
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            
            for contact in emergency_contacts:
                try:
                    # Format phone number with country code if needed
                    phone = contact.phone_number
                    if not phone.startswith('+'):
                        phone = f"{settings.PHONE_COUNTRY_CODE}{phone}"
                    
                    message = client.messages.create(
                        body=message_body,
                        from_=settings.TWILIO_PHONE_NUMBER,
                        to=phone
                    )
                    logger.info(f"Emergency SMS sent to {contact.name} ({phone}). SID: {message.sid}")
                    
                except Exception as e:
                    logger.error(f"Failed to send SMS to {contact.name} ({contact.phone_number}): {str(e)}")
                    
        except Exception as e:
            logger.error(f"Twilio client error: {str(e)}")
    
    # Send SMS in background thread to avoid blocking the request
    threading.Thread(target=_send_sms, daemon=True).start()
    logger.info(f"Emergency SMS dispatch initiated for {emergency_contacts.count()} contacts")


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

    # Notify only the relevant service provider groups via WebSocket
    ws_data = serialize_for_ws(sos_data)
    for group in get_target_groups(sos.type):
        notify_ws(group, 'new_sos_request', ws_data)
    
    # Send emergency SMS to all emergency contacts
    send_emergency_sms(request.user, sos)

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
    """Get all SOS requests (service providers only: admin, hospital, fire, ngo)."""
    if not is_service_provider(request.user):
        return Response(
            {'success': False, 'message': 'Service provider access required'},
            status=status.HTTP_403_FORBIDDEN
        )

    requests_qs = SOSRequest.objects.select_related('user', 'responded_by').all()

    # Filter by SOS types relevant to this service provider's role
    allowed_types = ROLE_TO_SOS_TYPES.get(request.user.role)
    if allowed_types is not None:
        requests_qs = requests_qs.filter(type__in=allowed_types)

    serializer = SOSRequestSerializer(requests_qs, many=True)

    return Response({
        'success': True,
        'requests': serializer.data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_request_status(request, request_id):
    """Update SOS request status (service providers only)."""
    if not is_service_provider(request.user):
        return Response(
            {'success': False, 'message': 'Service provider access required'},
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
        
        # Award points to helper (service provider) for completing the request
        try:
            from authentication.points_utils import calculate_points_for_request, award_points
            
            # Calculate points earned
            points_earned = calculate_points_for_request(sos)
            
            # Award points to the service provider who completed the request
            award_points(
                user=request.user,
                amount=points_earned,
                description=f"Completed SOS request - {sos.type}",
                sos_request=sos,
                transaction_type='earned'
            )
            
            logger.info(f"Awarded {points_earned} points to {request.user.mobile} for completing SOS {sos.id}")
        except Exception as e:
            logger.error(f"Error awarding points for SOS {sos.id}: {str(e)}")
            # Don't fail the request completion if points award fails

    sos.save()

    sos_data = SOSRequestSerializer(sos).data
    ws_data = serialize_for_ws(sos_data)

    # Notify only the relevant service provider groups + the user
    for group in get_target_groups(sos.type):
        notify_ws(group, 'sos_status_update', ws_data)
    notify_ws(f'user_{sos.user.mobile}', 'sos_status_update', ws_data)

    return Response({
        'success': True,
        'message': f'Request {new_status} successfully',
        'requestId': str(sos.id),
        'status': new_status,
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_response(request):
    """
    AI Safety Chatbot endpoint.
    Provides safety guidance and emergency advice using Google Gemini AI.
    """
    user_message = request.data.get('message', '').strip()

    if not user_message:
        return Response(
            {'success': False, 'error': 'Message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Import Gemini AI
        import google.generativeai as genai

        # Configure API key from environment
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            # Fallback response when API key is not configured
            return Response({
                'success': True,
                'response': get_fallback_response(user_message),
            })

        genai.configure(api_key=api_key)

        # Initialize the model
        model = genai.GenerativeModel('gemini-1.5-flash')

        # System instruction for safety assistant
        system_instruction = """You are a helpful safety assistant for an emergency SOS application called SafeNow. 
Your role is to provide short, practical, and clear advice for safety situations.

Guidelines:
- Keep responses brief (2-4 sentences maximum)
- Focus on immediate, actionable steps
- Be calm and reassuring
- Cover topics like: minor injuries (cuts, burns, sprains), safety precautions, harassment, accidents, fires, medical emergencies
- If the situation sounds like a MINOR issue that needs professional help (not life-threatening), suggest they can send an SOS alert
- For life-threatening emergencies, remind them to call emergency services immediately (they shouldn't be chatting)
- Use simple, clear language
- Prioritize safety above all

Examples of good responses:
User: "I have a small cut on my hand"
You: "For a small cut, wash it with clean water and soap, apply pressure with a clean cloth to stop bleeding, then cover with a bandage. If bleeding persists or the cut is deep, consider seeking medical attention."

User: "Someone is following me"
You: "Stay in well-lit public areas, keep walking toward crowded places, call a trusted contact, and if you feel threatened, use your SOS alert to get help immediately."

Remember: This chatbot is for MINOR safety concerns and guidance, not life-threatening emergencies."""

        # Generate response
        prompt = f"{system_instruction}\n\nUser: {user_message}\nAssistant:"
        response = model.generate_content(prompt)

        ai_response = response.text if response.text else "I'm here to help with safety questions. Could you please provide more details about your situation?"

        return Response({
            'success': True,
            'response': ai_response,
        })

    except ImportError:
        logger.error("google-generativeai library not installed")
        return Response({
            'success': True,
            'response': get_fallback_response(user_message),
        })
    except Exception as e:
        logger.error(f"Chatbot error: {str(e)}")
        return Response({
            'success': True,
            'response': get_fallback_response(user_message),
        })


def get_fallback_response(user_message):
    """Provide basic safety responses when AI is unavailable."""
    message_lower = user_message.lower()

    # Basic keyword matching for common scenarios
    if any(word in message_lower for word in ['cut', 'bleeding', 'wound']):
        return "For minor cuts: Clean with water and soap, apply pressure with a clean cloth, and cover with a bandage. If bleeding doesn't stop or the cut is deep, seek medical help."

    elif any(word in message_lower for word in ['burn', 'burnt', 'burning']):
        return "For minor burns: Cool the burn under running water for 10-15 minutes, cover with a clean cloth, and avoid ice or butter. For severe burns, seek medical attention immediately."

    elif any(word in message_lower for word in ['following', 'stalking', 'harass']):
        return "If you feel unsafe: Stay in well-lit public areas, move toward crowded places, call a trusted contact, and use the SOS button if you're in danger."

    elif any(word in message_lower for word in ['accident', 'crash', 'collision']):
        return "After an accident: Ensure you're safe, check for injuries, call emergency services if needed, and document the scene. Use the SOS button for immediate assistance."

    elif any(word in message_lower for word in ['fire', 'smoke']):
        return "In case of fire: Get out immediately, stay low to avoid smoke, close doors behind you, and call fire services. Never go back inside a burning building."

    elif any(word in message_lower for word in ['sprain', 'twisted', 'ankle', 'wrist']):
        return "For sprains: Rest the injured area, apply ice wrapped in cloth for 15 minutes, compress with a bandage, and elevate it. If pain is severe, seek medical help."

    elif any(word in message_lower for word in ['chest pain', 'heart', 'breathing']):
        return "Chest pain or breathing difficulty can be serious. Sit down, stay calm, and call emergency services immediately. Do not ignore these symptoms."

    elif any(word in message_lower for word in ['poison', 'swallowed', 'toxic']):
        return "If someone swallowed poison: Do NOT make them vomit. Call poison control or emergency services immediately. Keep the substance container if possible."

    else:
        return "I'm here to help with safety questions. For minor injuries, stay calm and apply basic first aid. For serious emergencies, please use the SOS button or call emergency services immediately."


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two points using Haversine formula.
    Returns distance in kilometers.
    """
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(radians, [float(lat1), float(lon1), float(lat2), float(lon2)])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    
    return R * c


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def helper_requests_view(request):
    """Get pending SOS requests within helper's service radius and accepted requests by this helper."""
    user = request.user
    
    # Check if user is a helper
    if not user.is_helper:
        return Response({
            'success': False,
            'message': 'User is not registered as a helper'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get helper's location from query params (they need to share their location)
    helper_lat = request.query_params.get('latitude')
    helper_lon = request.query_params.get('longitude')
    
    if not helper_lat or not helper_lon:
        # Return all pending requests if location not provided
        helper_lat = None
        helper_lon = None
    
    # Get all pending requests
    pending_requests = SOSRequest.objects.filter(
        status='pending'
    ).select_related('user').order_by('-created_at')
    
    # Get requests accepted by this helper (not yet completed)
    accepted_requests = SOSRequest.objects.filter(
        status='accepted',
        responded_by=user
    ).select_related('user').order_by('-accepted_at')
    
    # Filter pending by radius if location is provided
    if helper_lat and helper_lon:
        filtered_requests = []
        for req in pending_requests:
            distance = calculate_distance(
                helper_lat, helper_lon,
                req.latitude, req.longitude
            )
            if distance <= user.helper_radius_km:
                req.distance = round(distance, 2)
                filtered_requests.append(req)
        pending_requests = filtered_requests
    else:
        for req in pending_requests:
            req.distance = None
    
    # Add distance to accepted requests too if location provided
    if helper_lat and helper_lon:
        for req in accepted_requests:
            distance = calculate_distance(
                helper_lat, helper_lon,
                req.latitude, req.longitude
            )
            req.distance = round(distance, 2)
    else:
        for req in accepted_requests:
            req.distance = None
    
    pending_serializer = SOSRequestSerializer(pending_requests, many=True)
    accepted_serializer = SOSRequestSerializer(accepted_requests, many=True)
    
    pending_data = pending_serializer.data
    accepted_data = accepted_serializer.data
    
    # Add distance to each request if calculated
    if helper_lat and helper_lon:
        for i, req in enumerate(pending_requests):
            if hasattr(req, 'distance') and req.distance is not None:
                pending_data[i]['distance'] = req.distance
        for i, req in enumerate(accepted_requests):
            if hasattr(req, 'distance') and req.distance is not None:
                accepted_data[i]['distance'] = req.distance
    
    return Response({
        'success': True,
        'pending_requests': pending_data,
        'accepted_requests': accepted_data,
        'requests': pending_data,  # For backward compatibility
        'count': len(pending_data) + len(accepted_data),
        'helper_radius_km': user.helper_radius_km
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def helper_respond_request_view(request, request_id):
    """Helper accepts or rejects an SOS request."""
    user = request.user
    
    # Check if user is a helper
    if not user.is_helper:
        return Response({
            'success': False,
            'message': 'User is not registered as a helper'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Check if helper is available
    if not user.helper_available:
        return Response({
            'success': False,
            'message': 'Helper is currently unavailable'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Get the SOS request
    try:
        sos = SOSRequest.objects.get(id=request_id)
    except SOSRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'SOS request not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    action = request.data.get('action', '').lower()
    
    if action == 'accept':
        # Check if request is still pending (only for accept action)
        if sos.status != 'pending':
            return Response({
                'success': False,
                'message': f'Request is already {sos.status}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        sos.status = 'accepted'
        sos.responded_by = user
        sos.accepted_at = timezone.now()
        sos.response_time = sos.calculate_response_time()
        sos.notes = f"Accepted by helper: {user.name}"
        sos.save()
        
        # Notify user via WebSocket
        sos_data = serialize_for_ws(SOSRequestSerializer(sos).data)
        notify_ws(f'user_{sos.user.mobile}', 'sos_status_update', sos_data)
        
        return Response({
            'success': True,
            'message': 'Request accepted successfully',
            'request': SOSRequestSerializer(sos).data
        })
    
    elif action == 'reject':
        # Helper can't technically reject, but can skip/ignore
        return Response({
            'success': True,
            'message': 'Request skipped'
        })
    
    else:
        return Response({
            'success': False,
            'message': 'Invalid action. Use "accept" or "reject"'
            }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_confirm_completion_view(request, request_id):
    """The requesting user confirms that help was received, completing the request and awarding points to the helper."""
    user = request.user
    
    try:
        sos = SOSRequest.objects.get(id=request_id)
    except SOSRequest.DoesNotExist:
        return Response({
            'success': False,
            'message': 'SOS request not found'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Only the user who sent the SOS can confirm completion
    if sos.user != user:
        return Response({
            'success': False,
            'message': 'Only the person who sent this request can confirm completion'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Request must be in accepted status
    if sos.status != 'accepted':
        return Response({
            'success': False,
            'message': f'Request cannot be confirmed. Current status: {sos.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    sos.status = 'completed'
    sos.completed_at = timezone.now()
    sos.notes = f"Confirmed complete by user: {user.name}"
    
    # Award points to the helper who accepted the request
    points_earned = 0
    helper = sos.responded_by
    if helper:
        try:
            from authentication.points_utils import calculate_points_for_request, award_points
            
            points_earned = calculate_points_for_request(sos)
            
            award_points(
                user=helper,
                amount=points_earned,
                description=f"Completed SOS request - {sos.type}",
                sos_request=sos,
                transaction_type='earned'
            )
            
            logger.info(f"Awarded {points_earned} points to helper {helper.mobile} for SOS {sos.id} (confirmed by user)")
        except Exception as e:
            logger.error(f"Error awarding points for SOS {sos.id}: {str(e)}")
    
    sos.save()
    
    # Notify helper via WebSocket
    sos_data = serialize_for_ws(SOSRequestSerializer(sos).data)
    if helper:
        notify_ws(f'user_{helper.mobile}', 'sos_status_update', sos_data)
    for group in get_target_groups(sos.type):
        notify_ws(group, 'sos_status_update', sos_data)
    
    return Response({
        'success': True,
        'message': 'Help confirmed! Thank you for your feedback.',
        'points_awarded_to_helper': float(points_earned),
        'request': SOSRequestSerializer(sos).data
    })


