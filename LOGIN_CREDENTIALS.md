# Service Provider Login Credentials

## ✅ Backend Setup Complete!

All service provider accounts have been created. Use these credentials to log in:

---

## 🔐 Test Credentials

### Service ID Format: 7-digit PIN code
- `400xxxx` = Admin
- `100xxxx` = Hospital
- `300xxxx` = Fire Department
- `200xxxx` = NGO

### Admin

- **Service ID**: `4001923`
- **Password**: `admin123`
- **Dashboard**: All requests (admin dashboard)

---

### Hospitals (Shows all SOS requests)

- **Service ID**: `1004782` | **Password**: `hospital123` | **Name**: City General Hospital
- **Service ID**: `1007361` | **Password**: `hospital123` | **Name**: Emergency Medical Center
- **Service ID**: `1002594` | **Password**: `hospital123` | **Name**: Community Health Hospital

---

### Fire Departments (Shows all SOS requests)

- **Service ID**: `3006147` | **Password**: `fire123` | **Name**: City Fire Department
- **Service ID**: `3008253` | **Password**: `fire123` | **Name**: District Fire Brigade

---

### NGOs (Shows all SOS requests)

- **Service ID**: `2003891` | **Password**: `ngo123` | **Name**: Community Support NGO
- **Service ID**: `2005674` | **Password**: `ngo123` | **Name**: Help Foundation

---

## 🚀 How to Login

### Using the Web Interface:

1. Navigate to: `http://localhost:5173/login`
2. Click **"Login as Service Provider"** at the bottom
3. Enter your Service ID (e.g., `1004782`)
4. Enter your password (e.g., `hospital123`)
5. Click **Login**
6. You'll be redirected to your role-specific dashboard!

---

## 🔧 Backend API

### Service Login Endpoint

```
POST http://localhost:8000/api/auth/service-login/
```

### Request Body

```json
{
  "service_id": "1004782",
  "password": "hospital123"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "service_id": "1004782",
    "name": "City General Hospital",
    "email": "admin@cityhospital.com",
    "role": "hospital",
    "id": "uuid-here"
  },
  "token": "jwt-access-token-here",
  "refresh": "jwt-refresh-token-here"
}
```

### Error Response (401 Unauthorized)

```json
{
  "success": false,
  "message": "Invalid service ID or password"
}
```

---

## 📊 Dashboard Access by Role

| Role         | Login        | Dashboard URL         | Sees Requests       |
| ------------ | ------------ | --------------------- | ------------------- |
| **User**     | Mobile + OTP | `/user-dashboard`     | Their own requests  |
| **Admin**    | 4001923      | `/admin-dashboard`    | All requests        |
| **Hospital** | 100xxxx      | `/hospital-dashboard` | All requests        |
| **Fire**     | 300xxxx      | `/fire-dashboard`     | All requests        |
| **NGO**      | 200xxxx      | `/ngo-dashboard`      | All requests        |

---

## ✨ Features Available

All service provider dashboards include:

- ✅ Real-time notifications for new requests
- ✅ Live map showing request locations
- ✅ Accept/Reject buttons for requests
- ✅ Request history
- ✅ Statistics dashboard
- ✅ WebSocket auto-refresh

---

## 🧪 Testing the Complete Flow

### 1. As a Regular User:

```
1. Login with mobile: 9876543210 → OTP
2. Send SOS → Choose "Ambulance"
3. Submit request with location
```

### 2. As Hospital (1004782):

```
1. Click "Login as Service Provider"
2. Service ID: 1004782
3. Password: hospital123
4. See the ambulance request
5. Click "Accept" to respond
```

### 3. As Fire Department (3006147):

```
1. Service ID: 3006147
2. Password: fire123
3. See all SOS requests
4. Accept/Reject as needed
```

---

## 🔄 Re-create Service Providers

If you need to reset or recreate service providers:

```bash
cd backend
python manage.py create_service_providers
```

This will create new providers or update existing ones with the default passwords.

---

## 🔐 Change Passwords

To change a service provider password, use Django admin or shell:

```python
python manage.py shell

from authentication.models import ServiceProvider
from django.contrib.auth.hashers import make_password

provider = ServiceProvider.objects.get(service_id='1004782')
provider.password = make_password('new_password_here')
provider.save()
```

---

## 📝 Notes

- Service IDs are 7-digit numeric PIN codes
- Passwords are securely hashed using Django's password hasher
- JWT tokens are used for authentication
- Sessions are tracked in the database
- WebSocket connections use the same authentication

---

## 🎯 Quick Start

1. **Start Backend**: `cd backend && python manage.py runserver`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Login**: Open `http://localhost:5173/login`
4. **Click**: "Login as Service Provider"
5. **Use**: Any credentials from above
6. **Done**: You're logged in!

---

Enjoy your role-based authentication system! 🚀
