# Service Provider Login Credentials

## ✅ Backend Setup Complete!

All service provider accounts have been created. Use these credentials to log in:

---

## 🔐 Test Credentials

### Admin

- **Service ID**: `ADM-001`
- **Password**: `admin123`
- **Dashboard**: All requests (admin dashboard)

---

### Hospitals (Shows only "Ambulance" requests)

- **Service ID**: `HSP-001` | **Password**: `hospital123` | **Name**: City General Hospital
- **Service ID**: `HSP-002` | **Password**: `hospital123` | **Name**: Emergency Medical Center
- **Service ID**: `HSP-003` | **Password**: `hospital123` | **Name**: Community Health Hospital

---

### Fire Departments (Shows only "Fire Emergency" requests)

- **Service ID**: `FIR-001` | **Password**: `fire123` | **Name**: City Fire Department
- **Service ID**: `FIR-002` | **Password**: `fire123` | **Name**: District Fire Brigade

---

### NGOs (Shows only "NGO Support" requests)

- **Service ID**: `NGO-001` | **Password**: `ngo123` | **Name**: Community Support NGO
- **Service ID**: `NGO-002` | **Password**: `ngo123` | **Name**: Help Foundation

---

## 🚀 How to Login

### Using the Web Interface:

1. Navigate to: `http://localhost:5173/login`
2. Click **"Login as Service Provider"** at the bottom
3. Enter your Service ID (e.g., `HSP-001`)
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
  "service_id": "HSP-001",
  "password": "hospital123"
}
```

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "service_id": "HSP-001",
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
| **Admin**    | ADM-001      | `/admin-dashboard`    | All requests        |
| **Hospital** | HSP-xxx      | `/hospital-dashboard` | Ambulance only      |
| **Fire**     | FIR-xxx      | `/fire-dashboard`     | Fire Emergency only |
| **NGO**      | NGO-xxx      | `/ngo-dashboard`      | NGO Support only    |

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

### 2. As Hospital (HSP-001):

```
1. Click "Login as Service Provider"
2. Service ID: HSP-001
3. Password: hospital123
4. See the ambulance request
5. Click "Accept" to respond
```

### 3. As Fire Department (FIR-001):

```
1. Service ID: FIR-001
2. Password: fire123
3. See only "Fire Emergency" requests
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

provider = ServiceProvider.objects.get(service_id='HSP-001')
provider.password = make_password('new_password_here')
provider.save()
```

---

## 📝 Notes

- Service IDs are case-insensitive (HSP-001 = hsp-001)
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
