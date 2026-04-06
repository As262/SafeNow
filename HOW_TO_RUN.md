# 🚀 How to Run SafeNow Complete Environment

## Quick Start (Recommended)

### Option 1: Use Python Script (Cross-Platform)
```bash
python start_all.py
```

This will automatically:
- ✅ Start Django backend server (port 8000)
- ✅ Start Android emulator (if available)
- ✅ Start Expo mobile app

### Option 2: Use Batch File (Windows Only)
Double-click: **RUN_ME.bat**

Or from command prompt:
```cmd
RUN_ME.bat
```

### Option 3: Manual Step-by-Step

If automatic scripts don't work, follow these steps:

#### Step 1: Start Backend Server
Open a new terminal/command prompt:
```bash
cd backend
python manage.py runserver 0.0.0.0:8000
```
Keep this terminal open. You should see:
```
Starting development server at http://0.0.0.0:8000/
```

#### Step 2: Start Android Emulator
- Open Android Studio
- Go to **Tools > Device Manager**
- Click the ▶️ play button next to any Android Virtual Device
- Wait for it to fully boot (30-60 seconds)

Or from command line:
```bash
emulator -list-avds
emulator -avd <AVD_NAME>
```

#### Step 3: Start Mobile App
Open another new terminal:
```bash
cd mobile
npm start
```

When Expo DevTools opens:
- Press `a` to open on Android emulator
- Or scan the QR code with Expo Go app on your phone

---

## ✅ Verification Checklist

After starting all services, verify:

- [ ] Backend running: Open http://localhost:8000/admin in browser
- [ ] Emulator running: You can see the Android home screen
- [ ] Expo running: Terminal shows "Metro waiting on exp://..."
- [ ] App loaded: SafeNow app opens in emulator

---

## 🔐 Login Credentials

### User Login (OTP)
- **Mobile Number:** 1234567890
- **OTP Code:** 000000

### Service Provider Login
| Role | Service ID | Password |
|------|-----------|----------|
| Police | 1004782 | police123 |
| Ambulance | 2001234 | ambulance123 |
| Fire | 3005678 | fire123 |
| Admin | 5009999 | admin123 |

---

## 🐛 Troubleshooting

### "Network request failed" Error
1. Make sure backend server is running (Step 1)
2. Check the terminal for any errors
3. Verify you can access http://localhost:8000/api in browser

### Android Emulator Not Found
1. Install Android Studio from https://developer.android.com/studio
2. Open Android Studio > Tools > SDK Manager
3. Install "Android SDK Command-line Tools"
4. Create a virtual device in Device Manager

### "Metro bundler error"
```bash
cd mobile
npm install
npm start -- --reset-cache
```

### Port 8000 Already in Use
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9
```

---

## 📱 Testing the App

Once everything is running:

1. **Open SafeNow app** in the emulator
2. **Log in** with demo credentials (1234567890 / 000000)
3. **Grant location permission** when prompted
4. **Try SOS button** to test emergency request
5. **Check backend logs** to see API calls

---

## 🛑 Stopping Services

1. Press `Ctrl+C` in each terminal window
2. Close Android Emulator
3. Or just close all terminal windows

---

## 📞 Need Help?

Check these files for more info:
- `NETWORK_ERROR_FIX.md` - Network troubleshooting
- `LOGIN_CREDENTIALS.md` - All login details
- `README.md` - Full project documentation

---

## 🎯 Quick Commands Reference

```bash
# Start backend only
cd backend && python manage.py runserver

# Start mobile only
cd mobile && npm start

# Install mobile dependencies
cd mobile && npm install

# Run backend tests
cd backend && python manage.py test

# Create admin user
cd backend && python manage.py createsuperuser

# Check database
cd backend && python manage.py dbshell
```
