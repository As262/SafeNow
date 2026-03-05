# Role-Based Authentication Implementation Guide

## Frontend Changes Completed

### 1. Login Component (Login.jsx)

✅ Added toggle between User Login (OTP) and Service Provider Login (ID + Password)
✅ Service Provider login form with Service ID and Password fields
✅ Service ID validation with prefix format (ADM-, HSP-, FIR-, NGO-)
✅ Automatic role detection from Service ID prefix
✅ Role-based redirection after login

### 2. API Integration (api.js)

✅ Added `serviceLogin(serviceId, password)` function
✅ Endpoint: `POST /api/auth/service-login/`
✅ Payload: `{ service_id: string, password: string }`

### 3. Authentication Context (AuthContext.jsx)

✅ Added role helper methods:

- `isAdmin` - Admin role check
- `isHospital` - Hospital role check
- `isFire` - Fire department role check
- `isNGO` - NGO role check
- `isServiceProvider` - Any service provider check

### 4. Service Dashboard (ServiceDashboard.jsx)

✅ Unified dashboard for all service providers
✅ Automatic request filtering based on role:

- **Hospital**: Shows only "Ambulance" requests
- **Fire**: Shows only "Fire Emergency" requests
- **NGO**: Shows only "NGO Support" requests
  ✅ Service-specific branding (icon, color, name)
  ✅ Real-time WebSocket integration
  ✅ Request accept/reject functionality

### 5. Protected Routes (ProtectedRoute.jsx)

✅ Updated to support multiple roles
✅ Role-based access control
✅ Automatic redirection to appropriate dashboard

### 6. App Routing (App.jsx)

✅ Added routes:

- `/hospital-dashboard` - Hospital providers
- `/fire-dashboard` - Fire department
- `/ngo-dashboard` - NGO providers

### 7. User Dashboard (UserDashboard.jsx)

✅ Added "Fire Emergency" request type for users to send fire-related emergencies

---

## Backend Implementation Required

### 1. Service Provider Authentication Endpoint

**Endpoint**: `POST /api/auth/service-login/`

**Request Body**:

```json
{
  "service_id": "HSP-001",
  "password": "your_password"
}
```

**Response** (Success - 200 OK):

```json
{
  "user": {
    "service_id": "HSP-001",
    "name": "City General Hospital",
    "role": "hospital",
    "email": "admin@cityhospital.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response** (Error - 401 Unauthorized):

```json
{
  "detail": "Invalid service ID or password"
}
```

### 2. Role Extraction Logic

The backend should extract role from service ID prefix:

- `ADM-xxx` → role = "admin"
- `HSP-xxx` → role = "hospital"
- `FIR-xxx` → role = "fire"
- `NGO-xxx` → role = "ngo"

### 3. Database Schema

**ServiceProvider Model** (suggested):

```python
class ServiceProvider(models.Model):
    service_id = models.CharField(max_length=20, unique=True)  # e.g., "HSP-001"
    name = models.CharField(max_length=200)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)  # Hashed
    role = models.CharField(max_length=20, choices=[
        ('admin', 'Admin'),
        ('hospital', 'Hospital'),
        ('fire', 'Fire Department'),
        ('ngo', 'NGO'),
    ])
    phone = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto-extract role from service_id prefix
        if self.service_id.startswith('ADM-'):
            self.role = 'admin'
        elif self.service_id.startswith('HSP-'):
            self.role = 'hospital'
        elif self.service_id.startswith('FIR-'):
            self.role = 'fire'
        elif self.service_id.startswith('NGO-'):
            self.role = 'ngo'
        super().save(*args, **kwargs)
```

### 4. Authentication View

**File**: `backend/authentication/views.py`

```python
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import check_password
from rest_framework_simplejwt.tokens import RefreshToken
from .models import ServiceProvider

@api_view(['POST'])
def service_login(request):
    service_id = request.data.get('service_id')
    password = request.data.get('password')

    if not service_id or not password:
        return Response(
            {'detail': 'Service ID and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        provider = ServiceProvider.objects.get(service_id=service_id, is_active=True)

        if not check_password(password, provider.password):
            return Response(
                {'detail': 'Invalid service ID or password'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken.for_user(provider)

        return Response({
            'user': {
                'service_id': provider.service_id,
                'name': provider.name,
                'role': provider.role,
                'email': provider.email,
            },
            'token': str(refresh.access_token),
            'refresh': str(refresh),
        })

    except ServiceProvider.DoesNotExist:
        return Response(
            {'detail': 'Invalid service ID or password'},
            status=status.HTTP_401_UNAUTHORIZED
        )
```

### 5. URL Configuration

**File**: `backend/authentication/urls.py`

```python
from django.urls import path
from . import views

urlpatterns = [
    # Existing endpoints
    path('send-otp/', views.send_otp, name='send_otp'),
    path('verify-otp/', views.verify_otp, name='verify_otp'),

    # New service provider endpoint
    path('service-login/', views.service_login, name='service_login'),
]
```

### 6. Create Sample Service Providers

**Management Command or Admin Panel**:

```python
# Example service providers to create
service_providers = [
    {
        'service_id': 'ADM-001',
        'name': 'SafeNow Admin',
        'email': 'admin@safenow.com',
        'password': 'admin123',  # Will be hashed
        'role': 'admin'
    },
    {
        'service_id': 'HSP-001',
        'name': 'City General Hospital',
        'email': 'admin@cityhospital.com',
        'password': 'hospital123',
        'role': 'hospital'
    },
    {
        'service_id': 'HSP-002',
        'name': 'Emergency Medical Center',
        'email': 'admin@emc.com',
        'password': 'hospital123',
        'role': 'hospital'
    },
    {
        'service_id': 'FIR-001',
        'name': 'City Fire Department',
        'email': 'admin@cityfire.com',
        'password': 'fire123',
        'role': 'fire'
    },
    {
        'service_id': 'NGO-001',
        'name': 'Community Support NGO',
        'email': 'admin@supportngo.com',
        'password': 'ngo123',
        'role': 'ngo'
    },
]
```

---

## Testing the Implementation

### Test Service Provider Login

1. **Start the frontend**:

   ```bash
   cd frontend
   npm run dev
   ```

2. **Access login page**: `http://localhost:5173/login`

3. **Click "Login as Service Provider"**

4. **Test with sample credentials**:
   - Service ID: `HSP-001`
   - Password: `hospital123`
5. **Verify**:
   - User is redirected to `/hospital-dashboard`
   - Only "Ambulance" type requests are visible
   - User can accept/reject requests

### Test Different Roles

Test each role with appropriate credentials:

| Service ID | Password    | Expected Dashboard  | Visible Requests    |
| ---------- | ----------- | ------------------- | ------------------- |
| ADM-001    | admin123    | /admin-dashboard    | All requests        |
| HSP-001    | hospital123 | /hospital-dashboard | Ambulance only      |
| FIR-001    | fire123     | /fire-dashboard     | Fire Emergency only |
| NGO-001    | ngo123      | /ngo-dashboard      | NGO Support only    |

---

## Security Considerations

1. **Password Hashing**: Always hash passwords using Django's `make_password()`
2. **Service ID Validation**: Validate service ID format on backend
3. **Rate Limiting**: Implement rate limiting on login endpoints
4. **Token Expiry**: Configure appropriate JWT token expiry times
5. **HTTPS**: Use HTTPS in production for secure transmission
6. **Role Verification**: Always verify role on backend for API access

---

## Request Type Mapping

The frontend sends these request types:

- **"Ambulance"** → Hospital dashboard
- **"Fire Emergency"** → Fire department dashboard
- **"NGO Support"** → NGO dashboard
- **"Police"** → Currently shown to Admin only
- **"Medical Help"** → Currently shown to Admin only

You may want to extend this logic to also show "Medical Help" to hospitals.

---

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Create ServiceProvider model in Django
3. ⏳ Implement service_login view
4. ⏳ Add URL routing
5. ⏳ Create sample service provider accounts
6. ⏳ Test end-to-end login flow
7. ⏳ Update WebSocket consumer to handle service provider roles
8. ⏳ Add role-based permissions to SOS request endpoints
