# WebSocket Connection Fix for Android Emulator

## Problem
WebSocket connections were failing because:
1. The app was configured with the wrong IP address
2. **The backend was running with `runserver` instead of Daphne (ASGI server)**

## Solution
1. Updated all connection URLs to use your machine's actual network IP: `10.49.250.225`
2. **Changed backend to use Daphne server for WebSocket support**

## Changes Made

### 1. Mobile App Configuration (app.json)
```json
"extra": {
  "apiUrl": "http://10.49.250.225:8000/api",
  "wsUrl": "ws://10.49.250.225:8000/ws"
}
```

### 2. API Client (src/api/client.ts)
Updated fallback URLs to use `10.49.250.225` instead of `10.0.2.2`

### 3. WebSocket Hook (src/hooks/useWebSocket.ts)
Updated default WebSocket URL to `ws://10.49.250.225:8000/ws`

### 4. Chatbot Modal (src/components/chatbot/ChatbotModal.tsx)
Updated API base URL to `http://10.49.250.225:8000`

### 5. Backend CORS Settings (backend/safenow_backend/settings.py)
Added Expo Metro bundler origin: `http://10.49.250.225:8081`

### 6. **Backend Startup Scripts** ⭐ CRITICAL
Changed all startup scripts to use **Daphne** instead of `runserver`:
- `start-backend.bat` - Now uses Daphne
- `start-all.bat` - Now uses Daphne
- `restart-with-fix.bat` - Now uses Daphne

**Why Daphne?**
Django's `runserver` only supports HTTP, not WebSockets. Daphne is the ASGI server that supports both HTTP and WebSocket protocols.

## How to Apply

### **IMPORTANT: Stop Current Backend First**
1. Close the current backend terminal window (it's running the wrong server)
2. OR press Ctrl+C in the backend terminal

### **Restart with WebSocket Support**

**Option 1 - Use the restart script (RECOMMENDED):**
```bash
restart-with-fix.bat
```

**Option 2 - Manual restart:**
1. **Stop the current backend** (Ctrl+C)
2. **Start backend with Daphne:**
   ```bash
   cd backend
   daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application
   ```
3. **Reload mobile app** (press `r` in Metro bundler)

## Verification

After restarting, you should see in the **backend terminal**:
```
2026-04-06 XX:XX:XX [INFO] Starting server at tcp:port=8000:interface=0.0.0.0
2026-04-06 XX:XX:XX [INFO] HTTP/2 support enabled
2026-04-06 XX:XX:XX [INFO] Listening on TCP address 0.0.0.0:8000
```

And in the **mobile app console**:
```
✅ WebSocket connected (real-time mode)
📥 Received X initial requests
```

## Important Notes

- **IP Address**: The IP `10.49.250.225` is your current network IP. If your computer's IP changes (e.g., after reconnecting to WiFi), you'll need to update these values again.

- **Find Your Current IP**: 
  ```bash
  # Check emulator log for "IPv4 server found:"
  # OR run:
  ipconfig | findstr IPv4
  ```

- **Always use Daphne**: Never use `python manage.py runserver` - it doesn't support WebSockets!

## Troubleshooting

### WebSocket Still Not Connecting?

1. **Check Backend Terminal** - Should say "Starting server at tcp:port=8000" (Daphne)
   - If it says "Starting development server" → Wrong! You're using runserver
   - Solution: Stop and use `daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application`

2. **Check Firewall**: Ensure Windows Firewall allows Python on port 8000
   - Add exception: Control Panel → Firewall → Allow an app

3. **Check Network**: Ensure emulator can reach your IP
   - From emulator browser, try: `http://10.49.250.225:8000/api/`
   - Should see Django API response

4. **Try ADB Reverse** (Alternative if network doesn't work):
   ```bash
   adb reverse tcp:8000 tcp:8000
   ```
   Then change IP to `localhost` in app.json

5. **Check Django Consumer**: Verify WebSocket consumer exists
   ```bash
   # Should exist: backend/sos/consumers.py
   # Should have: class SOSConsumer(AsyncWebsocketConsumer)
   ```

## Quick Reference Commands

```bash
# Start backend with WebSocket support
cd backend
daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application

# Start mobile app
cd mobile
npx expo start -c

# Check what's on port 8000
netstat -ano | findstr :8000

# Kill process on port 8000
for /f "tokens=5" %a in ('netstat -ano ^| findstr :8000') do taskkill /F /PID %a
```
