"""Twilio OTP Service for SafeNow."""

import random
import logging
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger('authentication')


def generate_otp():
    """Generate a random 6-digit OTP."""
    return ''.join([str(random.randint(0, 9)) for _ in range(settings.OTP_LENGTH)])


def send_otp_via_twilio(mobile, otp_code):
    """
    Send OTP via Twilio SMS.
    Falls back to console logging if Twilio credentials are not configured.
    """
    full_number = f"{settings.PHONE_COUNTRY_CODE}{mobile}"

    # Check if Twilio is configured
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning(
            f"Twilio not configured. OTP for {mobile}: {otp_code}. "
            f"Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars."
        )
        return {
            'success': True,
            'message': 'OTP sent (dev mode - check console)',
            'dev_otp': otp_code if settings.DEBUG else None,
        }

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your SafeNow verification code is: {otp_code}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes.",
            from_=settings.TWILIO_PHONE_NUMBER,
            to=full_number,
        )

        logger.info(f"OTP sent to {mobile} via Twilio. SID: {message.sid}")
        return {
            'success': True,
            'message': 'OTP sent successfully',
            'sid': message.sid,
        }

    except Exception as e:
        logger.error(f"Twilio error sending OTP to {mobile}: {str(e)}")
        # In dev mode, fall back to console
        if settings.DEBUG:
            logger.info(f"DEV FALLBACK - OTP for {mobile}: {otp_code}")
            return {
                'success': True,
                'message': 'OTP sent (dev fallback - check console)',
                'dev_otp': otp_code,
            }
        raise Exception(f"Failed to send OTP: {str(e)}")


def create_otp(mobile):
    """Create and store a new OTP for the given mobile number."""
    from .models import OTP

    # Invalidate any existing unused OTPs for this number
    OTP.objects.filter(mobile=mobile, is_verified=False).delete()

    otp_code = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    otp = OTP.objects.create(
        mobile=mobile,
        otp_code=otp_code,
        expires_at=expires_at,
    )

    # Send via Twilio
    result = send_otp_via_twilio(mobile, otp_code)

    return otp, result


def verify_otp(mobile, otp_code):
    """
    Verify OTP for a mobile number.
    Returns (success: bool, message: str)
    """
    from .models import OTP

    try:
        otp = OTP.objects.filter(
            mobile=mobile,
            is_verified=False,
        ).latest('created_at')
    except OTP.DoesNotExist:
        return False, "No OTP sent to this number. Please request OTP first."

    # Check expiry
    if otp.is_expired:
        otp.delete()
        return False, "OTP has expired. Please request a new one."

    # Check max attempts (max 5)
    if otp.attempts >= 5:
        otp.delete()
        return False, "Too many failed attempts. Please request a new OTP."

    # Verify
    if otp.otp_code != otp_code:
        otp.attempts += 1
        otp.save()
        return False, "Invalid OTP. Please try again."

    # Success - mark as verified
    otp.is_verified = True
    otp.save()

    return True, "OTP verified successfully."
