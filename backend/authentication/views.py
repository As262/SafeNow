import uuid
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserSession
from .serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    UserSessionSerializer,
)
from .services import create_otp, verify_otp

logger = logging.getLogger('authentication')


def get_client_ip(request):
    """Extract client IP from request."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    return x_forwarded.split(',')[0] if x_forwarded else request.META.get('REMOTE_ADDR')


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp_view(request):
    """Send OTP to the given mobile number via Twilio."""
    serializer = SendOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    mobile = serializer.validated_data['mobile']

    try:
        otp_obj, result = create_otp(mobile)
        response_data = {
            'success': True,
            'message': result.get('message', 'OTP sent successfully'),
        }
        # Only expose OTP for admin accounts (demo mode)
        if result.get('demo_otp'):
            response_data['otp'] = result['demo_otp']

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error sending OTP to {mobile}: {str(e)}")
        return Response(
            {'success': False, 'message': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_view(request):
    """Verify OTP and return JWT tokens + user data."""
    serializer = VerifyOTPSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    mobile = serializer.validated_data['mobile']
    otp_code = serializer.validated_data['otp']

    success, message = verify_otp(mobile, otp_code)

    if not success:
        return Response(
            {'success': False, 'message': message},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get or create user
    user, created = User.objects.get_or_create(
        mobile=mobile,
        defaults={
            'name': f'User {mobile[-4:]}',
            'email': '',
            'role': 'user',
        }
    )

    if created:
        logger.info(f"New user created: {mobile}")

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    token_jti = str(refresh.get('jti', uuid.uuid4()))

    # Create session record
    UserSession.objects.create(
        user=user,
        token_id=token_jti,
        ip_address=get_client_ip(request),
        device_info=request.META.get('HTTP_USER_AGENT', '')[:500],
    )

    return Response({
        'success': True,
        'message': 'Login successful',
        'user': UserSerializer(user).data,
        'token': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get authenticated user's profile."""
    return Response({
        'success': True,
        'user': UserSerializer(request.user).data,
    })


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """Update user profile (name, email)."""
    serializer = UserProfileUpdateSerializer(
        request.user, data=request.data, partial=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response({
        'success': True,
        'user': UserSerializer(request.user).data,
        'message': 'Profile updated successfully',
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout - invalidate refresh token and session."""
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass  # Token may already be blacklisted

    # Deactivate sessions for this user
    UserSession.objects.filter(user=request.user, is_active=True).update(is_active=False)

    return Response({
        'success': True,
        'message': 'Logged out successfully',
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sessions_view(request):
    """Get all active sessions for the user."""
    sessions = UserSession.objects.filter(user=request.user, is_active=True)
    return Response({
        'success': True,
        'sessions': UserSessionSerializer(sessions, many=True).data,
    })
