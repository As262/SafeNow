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
    """Send OTP via Twilio SMS."""
    # Ensure the number always has country code prefix
    if mobile.startswith('+'):
        full_number = mobile
    else:
        full_number = f"{settings.PHONE_COUNTRY_CODE}{mobile}"

    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        raise Exception(
            "Twilio credentials are not configured. "
            "Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in your .env file."
        )

    try:
        from twilio.rest import Client

        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        message = client.messages.create(
            body=f"Your SafeNow verification code is: {otp_code}. Valid for {settings.OTP_EXPIRY_MINUTES} minutes. Do not share this with anyone.",
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
        raise Exception(f"Failed to send OTP via SMS: {str(e)}")


def send_sos_sms_to_emergency_contacts(user, sos):
    """Send an SOS alert SMS to all emergency contacts of the user."""
    from authentication.models import EmergencyContact

    contacts = EmergencyContact.objects.filter(user=user)
    if not contacts.exists():
        return

    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio not configured — skipping SOS SMS to emergency contacts.")
        return

    maps_link = f"https://maps.google.com/?q={sos.latitude},{sos.longitude}"
    location_text = sos.address if sos.address else f"{sos.latitude}, {sos.longitude}"

    message_body = (
        f"EMERGENCY ALERT: {user.name} has triggered a SafeNow SOS!\n"
        f"Emergency type: {sos.type}\n"
        f"Location: {location_text}\n"
        f"Maps: {maps_link}\n"
        f"Please contact them or call emergency services immediately."
    )

    try:
        from twilio.rest import Client
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        for contact in contacts:
            phone = contact.phone_number.strip()
            if not phone.startswith('+'):
                phone = f"{settings.PHONE_COUNTRY_CODE}{phone}"
            try:
                msg = client.messages.create(
                    body=message_body,
                    from_=settings.TWILIO_PHONE_NUMBER,
                    to=phone,
                )
                logger.info(f"SOS SMS sent to emergency contact {contact.name} ({phone}). SID: {msg.sid}")
            except Exception as e:
                logger.error(f"Failed to send SOS SMS to {contact.name} ({phone}): {e}")

    except Exception as e:
        logger.error(f"Twilio client error during SOS SMS: {e}")


def is_admin_mobile(mobile):
    """Check if the mobile number belongs to an admin user."""
    from .models import User
    return User.objects.filter(mobile=mobile, role='admin').exists() or \
           User.objects.filter(mobile=mobile, is_staff=True).exists()


def create_otp(mobile):
    """Create and store a new OTP for the given mobile number."""
    from .models import OTP

    # Invalidate any existing unused OTPs for this number
    OTP.objects.filter(mobile=mobile, is_verified=False).delete()

    # Admin accounts use a fixed demo OTP — no Twilio needed
    if is_admin_mobile(mobile):
        otp_code = settings.ADMIN_DEMO_OTP
        expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)
        otp = OTP.objects.create(
            mobile=mobile,
            otp_code=otp_code,
            expires_at=expires_at,
        )
        logger.info(f"Admin demo OTP issued for {mobile}")
        return otp, {
            'success': True,
            'message': 'Admin demo OTP ready',
            'demo_otp': otp_code,
        }

    # Regular users — send real SMS via Twilio
    otp_code = generate_otp()
    expires_at = timezone.now() + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    otp = OTP.objects.create(
        mobile=mobile,
        otp_code=otp_code,
        expires_at=expires_at,
    )

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
