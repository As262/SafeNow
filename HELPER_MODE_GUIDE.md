# Helper Mode Feature - Implementation Guide

## 🎯 Overview

A new **Helper Mode** feature has been added to SafeNow that allows regular users to opt-in as helpers who can respond to emergency requests. Helpers can see nearby emergency requests, accept them, and get directions to help people in need.

---

## ✨ Features

### For Users Who Become Helpers:

✅ **Opt-in Helper Mode** - Enable/disable helper mode anytime  
✅ **Custom Service Radius** - Set how far (1-20 km) you want to help  
✅ **Skills Profile** - Optional: Add your skills (First Aid, CPR, etc.)  
✅ **Availability Toggle** - Control when you're available to help  
✅ **Real-time Requests** - See nearby emergency requests with distance  
✅ **Accept Requests** - Accept and respond to emergencies  
✅ **Get Directions** - Direct Google Maps navigation to emergency location  
✅ **Request Filtering** - Only see requests within your service radius

---

## 🗂️ Files Changed

### Backend

1. **`backend/authentication/models.py`**
   - Added helper fields to User model:
     - `is_helper` (Boolean)
     - `helper_available` (Boolean)
     - `helper_skills` (String)
     - `helper_radius_km` (Integer, default 5)

2. **`backend/authentication/migrations/0005_user_helper_fields.py`**
   - Migration to add helper fields

3. **`backend/authentication/views.py`**
   - `toggle_helper_mode_view()` - Enable/disable helper mode
   - `toggle_helper_availability_view()` - Control availability

4. **`backend/authentication/urls.py`**
   - `/api/auth/helper/toggle/` - Toggle helper mode
   - `/api/auth/helper/availability/` - Toggle availability

5. **`backend/sos/views.py`**
   - `calculate_distance()` - Haversine distance calculation
   - `helper_requests_view()` - Get nearby requests for helpers
   - `helper_respond_request_view()` - Accept/reject requests

6. **`backend/sos/urls.py`**
   - `/api/sos/helper/requests/` - Get requests
   - `/api/sos/helper/request/<id>/respond/` - Respond to request

### Frontend

1. **`frontend/src/components/UserDashboard.jsx`**
   - Added helper states
   - Created Helper Mode section UI
   - Added helper request management
   - Integrated accept/reject/directions

2. **`frontend/src/components/Sidebar.jsx`**
   - Added "Helper Mode" menu item

3. **`frontend/src/utils/api.js`**
   - `toggleHelperMode()` - API call to toggle
   - `toggleHelperAvailability()` - Toggle availability
   - `getHelperRequests()` - Fetch requests
   - `helperRespondToRequest()` - Accept/reject

4. **`frontend/src/utils/translations.js`**
   - Added "helper" translations (English & Hindi)

---

## 📡 API Endpoints

### 1. Toggle Helper Mode

```http
POST /api/auth/helper/toggle/
Authorization: Bearer <token>
Content-Type: application/json

{
  "is_helper": true,
  "helper_skills": "First Aid, CPR",
  "helper_radius_km": 10
}
```

**Response:**
```json
{
  "success": true,
  "message": "Helper mode updated successfully",
  "is_helper": true,
  "helper_available": true,
  "helper_skills": "First Aid, CPR",
  "helper_radius_km": 10
}
```

### 2. Toggle Helper Availability

```http
POST /api/auth/helper/availability/
Authorization: Bearer <token>
Content-Type: application/json

{
  "available": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Helper availability updated",
  "helper_available": true
}
```

### 3. Get Helper Requests

```http
GET /api/sos/helper/requests/?latitude=28.6139&longitude=77.209
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "requests": [
    {
      "id": "uuid",
      "type": "Medical Help",
      "userName": "John Doe",
      "userId": "9876543210",
      "location": {
        "latitude": 28.6140,
        "longitude": 77.2095
      },
      "address": "123 Main St",
      "distance": 0.45,
      "timestamp": "2026-03-07T10:30:00Z",
      "status": "pending"
    }
  ],
  "count": 1,
  "helper_radius_km": 10
}
```

### 4. Respond to Request

```http
POST /api/sos/helper/request/<uuid>/respond/
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "accept"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Request accepted successfully",
  "request": { ... }
}
```

---

## 🧭 User Flow

### Becoming a Helper

1. User logs into their account
2. Clicks **"Helper Mode"** in the sidebar
3. Sees the Helper Mode page with enable/disable toggle
4. Clicks **"Enable"** button
5. (Optional) Enters their skills and adjusts service radius
6. Clicks **"Save Settings"**
7. Toggles **"Available for Requests"** to go online

### Viewing Emergency Requests

1. Helper navigates to Helper Mode section
2. System automatically fetches nearby requests
3. Requests are shown with:
   - Emergency type (Police, Fire, Medical, NGO)
   - Distance from helper's location
   - User name
   - Address
   - Timestamp
   - Accept button
   - Directions button

### Accepting a Request

1. Helper clicks **"Accept"** on a request
2. System updates request status to "accepted"
3. User who sent SOS gets notified via WebSocket
4. Helper can click **"Directions"** to navigate via Google Maps
5. Helper provides assistance

### Going Offline

1. Helper toggles **"Available for Requests"** to OFF
2. System stops showing them new requests
3. Helper can re-enable anytime

---

## 🎨 UI Components

### Helper Mode Card
- Large enable/disable toggle button
- Status indicator (Enabled/Disabled)
- Description text

### Configuration Section
- Skills input field (optional)
- Service radius slider (1-20 km)
- Save settings button
- Availability toggle switch

### Request List
- Card-based layout for each request
- Color-coded emergency type badges
- Distance indicator
- User information
- Timestamp
- Accept button (green)
- Directions button (blue)

---

## 🔒 Permissions & Security

- Only authenticated users can become helpers
- Helpers must be available to see requests
- Helpers can only accept pending requests
- Once accepted, request can't be accepted by another helper
- Helper location is used for distance calculation but not stored
- Helper responds are logged in the database

---

## 🧪 Testing the Feature

### Test Scenario 1: Enable Helper Mode

1. Login as user: `9876543210`
2. Go to sidebar → Helper Mode
3. Click Enable
4. Enter skills: "First Aid"
5. Set radius: 10 km
6. Click Save Settings
7. Toggle availability to ON

**Expected:** User is now a helper and can see requests

### Test Scenario 2: View Requests

1. As a different user, send an SOS request
2. As helper, refresh the Helper Mode page
3. Should see the new request with distance

**Expected:** Request appears in helper's list

### Test Scenario 3: Accept Request

1. Helper clicks "Accept" on a request
2. User who sent request gets notification
3. Request disappears from helper's pending list

**Expected:** Request accepted successfully

### Test Scenario 4: Get Directions

1. Helper clicks "Directions" button
2. Opens Google Maps in new tab
3. Shows route from helper to emergency location

**Expected:** Google Maps opens with directions

---

## 📊 Database Schema

### User Model Updates

```python
class User(AbstractBaseUser, PermissionsMixin):
    # ... existing fields ...
    
    # Helper fields
    is_helper = models.BooleanField(default=False)
    helper_available = models.BooleanField(default=True)
    helper_skills = models.CharField(max_length=200, blank=True, default='')
    helper_radius_km = models.IntegerField(default=5)
```

---

## 🌐 WebSocket Integration

When a helper accepts a request:
- User who sent SOS receives real-time notification
- Request status updates to "accepted"
- Responded_by field set to helper's user ID

---

## 🚀 Future Enhancements

Potential improvements for the helper feature:

1. **Helper Rating System** - Users can rate helpers after assistance
2. **Helper Badges** - Award badges for helping multiple people
3. **Helper Leaderboard** - Showcase top helpers
4. **Helper Verification** - Verify skills/certifications
5. **In-app Chat** - Communication between helper and user
6. **Helper Analytics** - Track helper response times
7. **Push Notifications** - Notify helpers of new nearby requests
8. **Helper Map View** - Show all helpers on a map
9. **Multi-Helper Response** - Allow multiple helpers for one request
10. **Helper History** - Track all responses and outcomes

---

## 🐛 Troubleshooting

### Issue: Helper not seeing requests
- **Solution:** Ensure helper mode is enabled and availability is ON
- Check if location permissions are granted
- Verify requests exist within service radius

### Issue: Cannot accept request
- **Solution:** Request may already be accepted by another helper
- Refresh the page to see updated status
- Check if helper is marked as available

### Issue: Distance not showing
- **Solution:** Enable location permissions in browser
- Allow app to access your current location
- Manually refresh location

---

## 📝 Notes

- Helpers are volunteer users, not professional service providers
- Helper mode is completely optional - all users can choose to participate
- Helpers can enable/disable at any time without limitations
- Service radius helps limit requests to manageable distances
- Skills field is optional but helps users know what assistance to expect
- Google Maps integration requires internet connection

---

## 🎉 Summary

The Helper Mode feature empowers community members to help each other during emergencies. It creates a network of willing volunteers who can provide immediate assistance while professional services are on their way. This feature promotes community solidarity and faster emergency response times.

**Key Benefits:**
- ✅ Faster emergency response
- ✅ Community-driven help network
- ✅ Flexible opt-in system
- ✅ Customizable service parameters
- ✅ Real-time request notifications
- ✅ Easy navigation to emergency locations
- ✅ Seamless integration with existing features

---

**Implementation Complete! 🎊**

All backend APIs, database models, frontend components, and UI elements have been successfully implemented and tested.
