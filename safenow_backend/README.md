# SafeNow Django Backend

Django REST API backend for the SafeNow emergency response platform.

## Features

- **OTP Authentication via Twilio** - Send and verify OTP codes via SMS
- **JWT Token Auth** - Secure API access with JSON Web Tokens
- **Session Management** - Track and manage user login sessions
- **SOS Request System** - Submit, view, accept/reject emergency requests
- **Real-time WebSocket** - Live SOS notifications via Django Channels
- **Analytics API** - Aggregated data for admin dashboard
- **Admin Panel** - Django admin for managing users and requests

## Tech Stack

- Django 6.0
- Django REST Framework
- Django Channels (WebSocket)
- Daphne (ASGI server)
- Simple JWT (authentication)
- Twilio (SMS/OTP)
- SQLite (dev) / PostgreSQL (prod)

## Setup

### 1. Create Virtual Environment

```bash
python -m venv backend_env
# Windows
backend_env\Scripts\activate
# Linux/Mac
source backend_env/bin/activate
```

### 2. Install Dependencies

```bash
cd safenow_backend
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your Twilio credentials:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Your Twilio phone number (e.g., +1234567890) |
| `PHONE_COUNTRY_CODE` | Target country code (default: +91 for India) |

> **Note:** Without Twilio credentials, the app runs in **dev mode** - OTPs are printed to the console and returned in the API response.

### 4. Run Migrations

```bash
python manage.py migrate
```

### 5. Start Server

```bash
# With WebSocket support (recommended)
daphne -b 127.0.0.1 -p 8000 safenow_backend.asgi:application

# OR standard Django dev server (no WebSocket)
python manage.py runserver 8000
```

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/send-otp/` | Send OTP to mobile number | No |
| POST | `/api/auth/verify-otp/` | Verify OTP and get JWT token | No |
| GET | `/api/auth/profile/` | Get user profile | Yes |
| PATCH | `/api/auth/profile/update/` | Update name/email | Yes |
| POST | `/api/auth/logout/` | Logout and invalidate session | Yes |
| GET | `/api/auth/sessions/` | List active sessions | Yes |

### SOS Requests

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/sos/request/` | Submit SOS request | Yes |
| GET | `/api/sos/user-requests/` | Get user's request history | Yes |
| GET | `/api/sos/all-requests/` | Get all requests (admin) | Admin |
| PATCH | `/api/sos/request/<id>/status/` | Update request status (admin) | Admin |

### Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/analytics/` | Get analytics data | Admin |

### WebSocket

| URL | Description |
|-----|-------------|
| `ws://localhost:8000/ws/sos/?role=admin&mobile=<mobile>` | Admin - receive all SOS notifications |
| `ws://localhost:8000/ws/sos/?role=user&mobile=<mobile>` | User - receive status updates for own requests |

## Django Admin

Access at `http://localhost:8000/admin/` using the admin credentials created by `seed_data`.
