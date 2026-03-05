# Service Provider Login - Quick Reference

## How to Use

### User Login (Mobile + OTP)

1. Open the login page
2. Enter your 10-digit mobile number
3. Click "Send OTP"
4. Enter the 6-digit OTP you receive
5. Click "Verify & Login"
6. You'll be redirected to the **User Dashboard**

### Service Provider Login

1. Open the login page
2. Click **"Login as Service Provider →"** at the bottom
3. Enter your 7-digit Service PIN (e.g., 1004782)
4. Enter your password
5. Click "Login"
6. You'll be redirected to your role-specific dashboard

---

## Service ID Format

All service providers use a 7-digit PIN code:

| Prefix | Organization Type     | Example IDs                   |
| ------ | --------------------- | ----------------------------- |
| 400    | Admin                 | 4001923                       |
| 100    | Hospital              | 1004782, 1007361, 1002594     |
| 300    | Fire Department       | 3006147, 3008253              |
| 200    | NGO/Community Support | 2003891, 2005674              |

---

## Test Credentials (After Backend Setup)

### Admin

- **Service ID**: `4001923`
- **Password**: `admin123`
- **Dashboard**: Shows ALL requests

### Hospital

- **Service ID**: `1004782`
- **Name**: City General Hospital
- **Password**: `hospital123`
- **Dashboard**: Shows ALL SOS requests

### Fire Department

- **Service ID**: `3006147`
- **Name**: City Fire Department
- **Password**: `fire123`
- **Dashboard**: Shows ALL SOS requests

### NGO

- **Service ID**: `2003891`
- **Name**: Community Support NGO
- **Password**: `ngo123`
- **Dashboard**: Shows ALL SOS requests

---

## SOS Request Visibility

All SOS requests are visible on ALL service dashboards:

| Request Type   | Who Can See It               |
| -------------- | ---------------------------- |
| Ambulance      | All dashboards               |
| Police         | All dashboards               |
| Medical Help   | All dashboards               |
| NGO Support    | All dashboards               |

---

## Dashboard Features

All service provider dashboards include:

- ✅ Real-time request notifications
- ✅ Pending requests list with user details
- ✅ Accept/Reject buttons for each request
- ✅ Live location map view
- ✅ Request history (accepted requests)
- ✅ Statistics (pending, accepted, total)
- ✅ Auto-refresh via WebSocket

---

## Toggle Between Login Methods

You can easily switch between user login and service provider login:

- On **User Login** screen → Click "Login as Service Provider →"
- On **Service Provider Login** screen → Click "← Back to User Login"

---

## Role-Based Routing

After successful login, you're automatically redirected:

| User Role | Redirect To           |
| --------- | --------------------- |
| user      | `/user-dashboard`     |
| admin     | `/admin-dashboard`    |
| hospital  | `/hospital-dashboard` |
| fire      | `/fire-dashboard`     |
| ngo       | `/ngo-dashboard`      |

If you try to access a dashboard you don't have permission for, you'll be automatically redirected to your correct dashboard.

---

## Backend Setup Required

⚠️ **Important**: The backend needs to implement the service provider authentication endpoint.

See [ROLE_BASED_AUTH_IMPLEMENTATION.md](./ROLE_BASED_AUTH_IMPLEMENTATION.md) for complete backend setup instructions.

**Required Backend Endpoint**:

- `POST /api/auth/service-login/`
- Accepts: `{ service_id: string, password: string }`
- Returns: `{ user: {...}, token: string, refresh: string }`

---

## Development Notes

### Frontend Files Modified:

1. ✅ `frontend/src/components/Login.jsx` - Added service provider login form
2. ✅ `frontend/src/utils/api.js` - Added serviceLogin API function
3. ✅ `frontend/src/contexts/AuthContext.jsx` - Added role helpers
4. ✅ `frontend/src/components/ServiceDashboard.jsx` - New unified dashboard
5. ✅ `frontend/src/components/ProtectedRoute.jsx` - Updated for multiple roles
6. ✅ `frontend/src/App.jsx` - Added service provider routes
7. ✅ `frontend/src/components/UserDashboard.jsx` - Added Fire Emergency type

### Backend Files to Create/Modify:

1. ⏳ Create `ServiceProvider` model
2. ⏳ Implement `service_login` view
3. ⏳ Add URL routing
4. ⏳ Create sample accounts
5. ⏳ Update permissions

---

## Demo Flow

### As a User:

1. Login with mobile: `9876543210`
2. Send SOS → Select "Ambulance"
3. Submit request

### As Hospital (HSP-001):

1. Click "Login as Service Provider"
2. Service ID: `HSP-001`
3. Password: `hospital123`
4. See the ambulance request in your dashboard
5. Click "Accept" to respond

### As Fire Department (FIR-001):

1. Service ID: `FIR-001`
2. See only "Fire Emergency" requests
3. Accept/Reject as needed

---

## Support

For issues or questions:

1. Check `ROLE_BASED_AUTH_IMPLEMENTATION.md` for detailed backend setup
2. Verify Service ID format matches PREFIX-NUMBER pattern
3. Ensure backend endpoint is working: `/api/auth/service-login/`
4. Check browser console for errors
