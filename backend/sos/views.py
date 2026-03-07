import json
import logging
import threading
import os
from django.utils import timezone
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
from authentication.models import User

logger = logging.getLogger('sos')

# ---------------------------------------------------------------------------
# In-memory conversation store:
#   { session_id: [{"role": "user"|"assistant", "content": str}] }
# A lock guards concurrent access; sessions persist until server restart.
# ---------------------------------------------------------------------------
_conversation_store: dict = {}
_store_lock = threading.Lock()
_MAX_HISTORY = 10  # maximum messages kept per session (user+assistant pairs)


def is_admin(user):
    return user.role == 'admin'


def is_service_provider(user):
    return user.role in ('admin', 'hospital', 'fire', 'ngo', 'police')


# Map SOS type to the service provider group(s) that should be notified
SOS_TYPE_TO_GROUPS = {
    'Ambulance': ['hospital_sos'],
    'Medical Help': ['hospital_sos'],
    'Fire Emergency': ['fire_sos'],
    'NGO Support': ['ngo_sos'],
    'Police': ['police_sos'],
}

# Map service role to the SOS types they handle
ROLE_TO_SOS_TYPES = {
    'hospital': ['Ambulance', 'Medical Help'],
    'fire': ['Fire Emergency'],
    'ngo': ['NGO Support'],
    'police': ['Police'],
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


_SYSTEM_INSTRUCTION = (
    "You are a calm, concise safety assistant for an emergency SOS app called SafeNow. "
    "You remember the full conversation history and use it to decide how to respond.\n\n"

    "RESPONSE FORMAT RULES — choose the format based on the user's intent:\n\n"

    "1. NEW INJURY OR EMERGENCY (user describes a new situation for the first time):\n"
    "   - Use a short header (e.g. 'Immediate steps:') followed by numbered steps.\n"
    "   - Maximum 4 steps. One short sentence per step.\n"
    "   - End with 'Send an SOS alert if symptoms worsen.' if the situation could need help.\n\n"

    "2. FOLLOW-UP QUESTION (user asks about the same situation already discussed):\n"
    "   - Respond with 1–2 short direct sentences. Do NOT repeat the full step list.\n"
    "   - Only add a bullet list if new distinct points are needed (max 3 bullets).\n\n"

    "3. SEVERE OR LIFE-THREATENING SITUATION (unconscious, severe bleeding, can't breathe, chest pain, etc.):\n"
    "   - Respond with exactly: '⚠️ Call emergency services immediately. Do not wait.'\n"
    "   - Add one sentence of what to do while waiting (e.g. keep them still, don't remove objects).\n\n"

    "GENERAL RULES:\n"
    "- Never write long paragraphs.\n"
    "- Use bullet points (•) only for listing signs or options, not for action steps.\n"
    "- Keep tone calm and reassuring.\n"
    "- Prioritize the most urgent action first.\n\n"

    "EXAMPLES:\n"
    "User: I burned my hand\n"
    "→ Immediate steps:\n"
    "   1. Run cool water over the burn for 10 minutes\n"
    "   2. Remove rings or tight items nearby\n"
    "   3. Cover loosely with a sterile dressing\n"
    "   4. Seek medical care if blistering occurs\n\n"

    "User (follow-up): Should I apply a bandage now?\n"
    "→ Yes. Once the burn has cooled and is clean, cover it loosely with a sterile bandage.\n\n"

    "User: He is unconscious and not breathing\n"
    "→ ⚠️ Call emergency services immediately. Do not wait.\n"
    "   Start CPR if you are trained while waiting for help to arrive.\n"
)


@api_view(['POST'])
@permission_classes([AllowAny])
def chatbot_response(request):
    """
    AI Safety Chatbot endpoint with session-based conversation memory.
    Provides safety guidance and emergency advice using Google Gemini AI.

    Expected request body:
      { "message": "...", "session_id": "<uuid>" }

    Response:
      { "success": true, "response": "...", "session_id": "<uuid>" }
    """
    user_message = request.data.get('message', '').strip()
    session_id = request.data.get('session_id', '').strip()

    if not user_message:
        return Response(
            {'success': False, 'error': 'Message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Retrieve existing history for this session (copy so we can mutate freely)
    with _store_lock:
        history = list(_conversation_store.get(session_id, [])) if session_id else []

    api_key = os.environ.get('GROQ_API_KEY')
    if not api_key:
        logger.warning("GROQ_API_KEY not set — using fallback responses")
        return Response({
            'success': True,
            'response': get_fallback_response(user_message),
            'session_id': session_id,
        })

    # Build the messages list: system prompt + conversation history + new message
    messages = [
        {"role": "system", "content": _SYSTEM_INSTRUCTION},
        *history,
        {"role": "user", "content": user_message},
    ]

    try:
        import httpx
        with httpx.Client(timeout=30) as client:
            resp = client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.3-70b-versatile",
                    "messages": messages,
                    "max_tokens": 300,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            ai_response = data["choices"][0]["message"]["content"].strip()

        # Persist updated history (cap at _MAX_HISTORY messages)
        if session_id:
            updated_history = history + [
                {"role": "user",      "content": user_message},
                {"role": "assistant", "content": ai_response},
            ]
            if len(updated_history) > _MAX_HISTORY:
                updated_history = updated_history[-_MAX_HISTORY:]
            with _store_lock:
                _conversation_store[session_id] = updated_history

        return Response({
            'success': True,
            'response': ai_response,
            'session_id': session_id,
        })

    except Exception as e:
        logger.error(f"Chatbot error (Groq): {str(e)}")
        return Response({
            'success': True,
            'response': get_fallback_response(user_message),
            'session_id': session_id,
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

