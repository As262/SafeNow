# Network Error Fix Guide

## Problem
The mobile app shows "Network request failed" when trying to send OTP or login.

## Root Cause
The mobile app cannot connect to the Django backend server. This happens when:
1. The backend server is not running
2. The API URL configuration doesn't match your environment
3. Network/firewall blocks the connection

## Solution

### Step 1: Start the Backend Server

**Windows (Command Prompt or PowerShell):**
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```

**Mac/Linux:**
```bash
cd backend
python3 manage.py runserver 0.0.0.0:8000
```

Keep this terminal window open. You should see:
```
Starting development server at http://0.0.0.0:8000/
```

### Step 2: Configure the Mobile App API URL

The mobile app automatically detects the correct API URL based on your platform:

- **Android Emulator**: Uses `http://10.0.2.2:8000/api` (emulator's localhost alias)
- **iOS Simulator**: Uses `http://localhost:8000/api`
- **Physical Device**: Needs your computer's local IP address

#### For Physical Devices

1. Find your computer's local IP address:
   - **Windows**: Run `ipconfig` and look for "IPv4 Address" (e.g., 192.168.1.100)
   - **Mac/Linux**: Run `ifconfig` or `ip addr` and look for your network interface IP

2. Update `mobile/app.json`:
```json
"extra": {
  "apiUrl": "http://YOUR_COMPUTER_IP:8000/api",
  "wsUrl": "ws://YOUR_COMPUTER_IP:8000/ws"
}
```

Example:
```json
"extra": {
  "apiUrl": "http://192.168.1.100:8000/api",
  "wsUrl": "ws://192.168.1.100:8000/ws"
}
```

3. Restart the Expo app:
```bash
cd mobile
npm start
```

### Step 3: Test the Connection

1. Open the mobile app
2. Try to send OTP with the demo credentials:
   - **Mobile Number**: 1234567890
   - **OTP**: 000000

If it works, you'll move to the OTP verification screen!

## Common Issues

### Issue: "Cannot connect to server"
**Fix**: Make sure the backend server is running. Check the terminal for errors.

### Issue: "Connection refused"
**Fix**: 
- Ensure backend is running on `0.0.0.0:8000` (not just `127.0.0.1`)
- Check firewall settings
- For physical devices, ensure both device and computer are on the same Wi-Fi network

### Issue: "Timeout"
**Fix**: 
- Check your network connection
- Verify the API URL in app.json matches your setup
- Try restarting both backend server and mobile app

## Quick Test Commands

Test if backend is accessible:

**From your computer:**
```bash
curl http://localhost:8000/api/auth/send-otp/
```

**From Android emulator:**
```bash
adb shell
curl http://10.0.2.2:8000/api/auth/send-otp/
```

## Verification Checklist

- [ ] Backend server is running on port 8000
- [ ] You can access http://localhost:8000/admin in your browser
- [ ] API URL in app.json is correct for your environment
- [ ] Mobile app has been restarted after configuration changes
- [ ] For physical devices: computer and device on same Wi-Fi network

## Still Having Issues?

Check the Django server logs in the terminal where you ran `python manage.py runserver`. You should see API requests coming through when you tap "Send OTP" in the app.
