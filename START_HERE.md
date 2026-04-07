# SafeNow - Quick Start Guide

## 🚀 ONE-CLICK LAUNCH (RECOMMENDED)

**Double-click this file to start everything with all fixes applied:**

```
run-all-services.bat
```

This single script will:
- ✅ Stop any existing services (clean slate)
- ✅ Start backend with **Daphne** (WebSocket support enabled)
- ✅ Launch Android emulator (Pixel_9)
- ✅ Start Expo with cleared cache (updated IP: 10.49.250.225)
- ✅ Verify all services are running
- ✅ Show clear next steps

---

## What This Script Does

### Configuration Applied:
- **Backend IP**: `10.49.250.225:8000`
- **WebSocket**: `ws://10.49.250.225:8000/ws`
- **Server**: Daphne ASGI (not runserver - this is critical!)

### The Three Windows:
1. **SafeNow Backend - WebSocket Enabled** - Django with Daphne
2. **Android Emulator** - Pixel_9 device
3. **SafeNow Mobile - WebSocket Ready** - Expo Metro bundler

---

## Expected Output

### ✅ Backend Window (Daphne):
```
Starting server at tcp:port=8000:interface=0.0.0.0
HTTP/2 support enabled
Listening on TCP address 0.0.0.0:8000
```

### ✅ Mobile Window (Expo):
```
› Metro: exp://10.49.250.225:8081
Android Bundled 14259ms index.ts
✅ WebSocket connected (real-time mode)
📥 Received X initial requests
```

---

## Troubleshooting

### WebSocket Not Connecting?

**1. Check Backend Window**
- Should say: `"Starting server at tcp:port=8000"`
- Should NOT say: `"Starting development server"` (that's runserver - wrong!)

**2. If Backend Shows Wrong Message**
- Close backend window
- Manually run:
  ```bash
  cd backend
  daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application
  ```

**3. Check Emulator Log**
- Should show: `"IPv4 server found: 10.49.250.225"`
- If different IP, you need to update configuration files

**4. In Expo Go App**
- Shake device → Reload
- Or tap "SafeNow" from recent history

---

## Alternative: Individual Scripts

If you prefer to start services separately:

### Option 1: Start Backend Only
```
start-backend-websocket.bat
```

### Option 2: Complete Restart with Fix
```
restart-with-fix.bat
```

### Option 3: Fix Port Issues
```
fix-port-8081.bat
```

---

## Important Notes

### ⚠️ IP Address May Change
The IP `10.49.250.225` is your current network IP. If it changes (after WiFi reconnect):

**Check current IP:**
- Look in emulator startup log: `"IPv4 server found: X.X.X.X"`
- Or run: `ipconfig | findstr IPv4`

**Update these files:**
1. `mobile\app.json` (lines 54-55)
2. `mobile\src\api\client.ts` (line 20, 28)
3. `mobile\src\hooks\useWebSocket.ts` (line 5)
4. `mobile\src\components\chatbot\ChatbotModal.tsx` (line 46)
5. `backend\safenow_backend\settings.py` (line 168)

### ⚠️ Always Use Daphne
Never use `python manage.py runserver` - it doesn't support WebSockets!
Always use: `daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application`

---

## Login Credentials

See `LOGIN_CREDENTIALS.md` for user accounts.

---

## Documentation

- `WEBSOCKET_FIX.md` - Detailed WebSocket troubleshooting
- `HOW_TO_RUN.md` - General running instructions
- `NETWORK_ERROR_FIX.md` - Network troubleshooting

---

## Success Checklist

- [ ] Backend window shows "Starting server at tcp:port=8000"
- [ ] Metro bundler shows "Metro: exp://10.49.250.225:8081"
- [ ] Mobile app shows "✅ WebSocket connected (real-time mode)"
- [ ] No WebSocket errors in mobile console
- [ ] SOS requests appear in real-time

If all checked, you're good to go! 🎉
