import uuid
import logging
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from django.contrib.auth.hashers import check_password

from .models import User, UserSession, ServiceProvider, EmergencyContact
from .serializers import (
    SendOTPSerializer,
    VerifyOTPSerializer,
    UserSerializer,
    UserProfileUpdateSerializer,
    UserSessionSerializer,
    ServiceLoginSerializer,
    ServiceProviderSerializer,
    EmergencyContactSerializer,
    PointsTransactionSerializer,
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


@api_view(['POST'])
@permission_classes([AllowAny])
def service_login_view(request):
    """Service Provider Login with service_id and password."""
    serializer = ServiceLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    service_id = serializer.validated_data['service_id']
    password = serializer.validated_data['password']

    try:
        provider = ServiceProvider.objects.get(service_id=service_id, is_active=True)
    except ServiceProvider.DoesNotExist:
        logger.warning(f"Failed login attempt for service ID: {service_id}")
        return Response(
            {'success': False, 'message': 'Invalid service ID or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Verify password
    if not check_password(password, provider.password):
        logger.warning(f"Invalid password for service ID: {service_id}")
        return Response(
            {'success': False, 'message': 'Invalid service ID or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Create or get a corresponding User object for JWT generation
    # Service providers are stored separately but we need a User for JWT
    user, created = User.objects.get_or_create(
        mobile=f"SP_{provider.service_id}",
        defaults={
            'name': provider.name,
            'email': provider.email,
            'role': provider.role,
        }
    )

    # Update role if it changed
    if user.role != provider.role:
        user.role = provider.role
        user.name = provider.name
        user.email = provider.email
        user.save()

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

    logger.info(f"Service provider login successful: {service_id} ({provider.role})")

    return Response({
        'success': True,
        'message': 'Login successful',
        'user': {
            'service_id': provider.service_id,
            'name': provider.name,
            'email': provider.email,
            'role': provider.role,
            'id': str(user.id),
        },
        'token': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def emergency_contacts_view(request):
    """List or create emergency contacts for the authenticated user."""
    if request.method == 'GET':
        contacts = EmergencyContact.objects.filter(user=request.user)
        serializer = EmergencyContactSerializer(contacts, many=True)
        return Response({'success': True, 'contacts': serializer.data})

    # POST — create new contact
    if EmergencyContact.objects.filter(user=request.user).count() >= 3:
        return Response(
            {'success': False, 'message': 'You can only add up to 3 emergency contacts.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    serializer = EmergencyContactSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(user=request.user)
        return Response({'success': True, 'contact': serializer.data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def emergency_contact_detail_view(request, contact_id):
    """Update or delete a specific emergency contact."""
    try:
        contact = EmergencyContact.objects.get(id=contact_id, user=request.user)
    except EmergencyContact.DoesNotExist:
        return Response({'success': False, 'message': 'Contact not found.'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = EmergencyContactSerializer(contact, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'success': True, 'contact': serializer.data})
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    contact.delete()
    return Response({'success': True, 'message': 'Contact deleted.'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_helper_mode_view(request):
    """Toggle helper mode for the authenticated user."""
    user = request.user
    
    # Get data from request
    is_helper = request.data.get('is_helper', False)
    helper_skills = request.data.get('helper_skills', '')
    helper_radius_km = request.data.get('helper_radius_km', 5)
    
    # Update user helper fields
    user.is_helper = is_helper
    user.helper_available = is_helper  # Set available when enabling helper mode
    user.helper_skills = helper_skills
    user.helper_radius_km = helper_radius_km
    user.save()
    
    return Response({
        'success': True,
        'message': 'Helper mode updated successfully',
        'is_helper': user.is_helper,
        'helper_available': user.helper_available,
        'helper_skills': user.helper_skills,
        'helper_radius_km': user.helper_radius_km
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_helper_availability_view(request):
    """Toggle helper availability status."""
    user = request.user
    
    if not user.is_helper:
        return Response({
            'success': False,
            'message': 'User is not registered as a helper'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user.helper_available = request.data.get('available', not user.helper_available)
    user.save()
    
    return Response({
        'success': True,
        'message': 'Helper availability updated',
        'helper_available': user.helper_available
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_service_providers_view(request):
    """Get all service providers (Admin only)."""
    # Check if user is admin
    if request.user.role != 'admin':
        return Response({
            'success': False,
            'message': 'Only admins can view service providers'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Get optional filter by role
    role_filter = request.GET.get('role', None)
    
    if role_filter:
        providers = ServiceProvider.objects.filter(role=role_filter, is_active=True)
    else:
        providers = ServiceProvider.objects.filter(is_active=True)
    
    serializer = ServiceProviderSerializer(providers, many=True)
    
    return Response({
        'success': True,
        'providers': serializer.data,
        'count': providers.count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def points_balance_view(request):
    """Get the current points balance and stats for the authenticated user."""
    user = request.user
    
    return Response({
        'success': True,
        'points': float(user.points),
        'total_earnings': float(user.total_earnings),
        'total_requests_completed': user.total_requests_completed,
        'is_helper': user.is_helper
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def points_transactions_view(request):
    """Get points transaction history for the authenticated user."""
    from .models import PointsTransaction
    
    transactions = PointsTransaction.objects.filter(user=request.user)
    serializer = PointsTransactionSerializer(transactions, many=True)
    
    return Response({
        'success': True,
        'transactions': serializer.data
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_points_view(request):
    """Request to withdraw points (convert to real money)."""
    from .points_utils import deduct_points
    from decimal import Decimal
    
    user = request.user
    amount = request.data.get('amount')
    
    if not amount:
        return Response({
            'success': False,
            'message': 'Amount is required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        amount = Decimal(str(amount))
        if amount <= 0:
            raise ValueError("Amount must be positive")
        
        # Minimum withdrawal amount
        if amount < Decimal('100.00'):
            return Response({
                'success': False,
                'message': 'Minimum withdrawal amount is ₹100'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Attempt to deduct points
        transaction = deduct_points(
            user=user,
            amount=amount,
            description=f"Withdrawal of ₹{amount}",
            transaction_type='withdrawn'
        )
        
        return Response({
            'success': True,
            'message': 'Withdrawal request submitted successfully',
            'transaction': PointsTransactionSerializer(transaction).data,
            'new_balance': float(user.points)
        })
        
    except ValueError as e:
        return Response({
            'success': False,
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error processing withdrawal: {str(e)}")
        return Response({
            'success': False,
            'message': 'Failed to process withdrawal'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
