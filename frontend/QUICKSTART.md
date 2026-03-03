# SafeNow - Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Run the Application

```bash
npm run dev
```

### Step 3: Login and Explore

Open http://localhost:5173 in your browser

## 🔐 Login

1. Enter any 10-digit mobile number
2. Click "Send OTP"
3. In dev mode, the OTP is shown in the server console / API response
4. Paste and click "Verify & Login"
5. First login auto-creates a user account; promote to admin via Django shell if needed

## 📱 Key Features to Test

### As a User:

1. ✅ Select an emergency type (Ambulance, Police, Medical, NGO)
2. ✅ Click the big red SOS button
3. ✅ Allow location access when prompted
4. ✅ Confirm the emergency request
5. ✅ View your request history

### As an Admin:

1. ✅ View all pending SOS requests
2. ✅ Click on a request to see its location on the map
3. ✅ Accept or reject requests
4. ✅ Switch to Analytics tab to view charts and metrics

## 🗺️ Google Maps Setup (Optional)

To enable the interactive map:

1. Get a Google Maps API Key:
   - Visit: https://console.cloud.google.com/
   - Create a project
   - Enable "Maps JavaScript API"
   - Create credentials (API Key)

2. Add the key to the project:
   - Open `src/components/MapView.jsx`
   - Find line: `const GOOGLE_MAPS_API_KEY = 'YOUR_GOOGLE_MAPS_API_KEY_HERE';`
   - Replace with your actual key

**Note:** The app works without the key, showing a mock map interface.

## 🎨 What You'll See

### Login Page

- Clean, dark-themed interface
- Mobile number input
- OTP verification with demo OTP displayed

### User Dashboard

- Large red SOS button (pulsing effect)
- Four emergency type options
- Request history cards
- Profile information

### Admin Dashboard

- Real-time request cards
- Interactive map (with API key) or mock map view
- Accept/Reject buttons
- Analytics charts (Pie, Bar, Line charts)
- Performance metrics

## 🛠️ Technology Stack

- ⚛️ React 18
- 🎨 Tailwind CSS
- 🗺️ Google Maps React
- 📊 Recharts
- 🎯 Lucide Icons
- 🔌 Socket.io Client

## 📝 Notes

- All authentication is mocked for demonstration
- OTP is displayed on screen (not sent via SMS)
- Location requests use browser's Geolocation API
- Real-time features are simulated (no actual WebSocket server)
- All data is stored in browser localStorage

## 🆘 Troubleshooting

### Port Already in Use

If port 5173 is busy:

```bash
npm run dev -- --port 3000
```

### Tailwind Styles Not Loading

```bash
npm install -D tailwindcss postcss autoprefixer
```

### Dependencies Issues

```bash
rm -rf node_modules package-lock.json
npm install
```

## 🎯 Next Steps

1. Test all features with different mobile numbers
2. Try the admin and user workflows
3. Explore the analytics dashboard
4. Check mobile responsiveness (F12 → Device Toolbar)
5. Add Google Maps API key for full map functionality

## 💡 Demo Tips

- In dev mode, OTP is returned in the API response and printed to the server console
- Use 10-digit Indian mobile numbers
- First login auto-creates a user account
- Promote a user to admin via Django shell: `User.objects.filter(mobile='...').update(role='admin', is_staff=True)`
- Location permission must be granted for SOS to work

---

**Enjoy exploring SafeNow! 🚨**
