# 🔧 Android Emulator Not Launching - Solutions

## Quick Fix: Launch Emulator Manually

### **Option 1: Use Android Studio (RECOMMENDED - EASIEST)**

1. **Open Android Studio**
2. Click **"More Actions"** or go to **Tools → Device Manager**
3. You'll see a list of virtual devices
4. Click the **▶️ Play button** next to any device
5. Wait 30-60 seconds for it to boot
6. Once you see the Android home screen, press **`a`** in the Expo terminal

---

### **Option 2: Use Command Line**

Double-click: **`launch-emulator.bat`**

This will:
- Check if Android SDK is installed
- List all available virtual devices
- Let you choose which one to start

---

### **Option 3: Run Backend & Mobile Only (Launch Emulator Separately)**

Double-click: **`start-without-emulator.bat`**

Then manually start the emulator using Android Studio (Option 1 above).

---

## 🔍 Troubleshooting: Why Emulator Didn't Launch

### Check 1: Is Android Studio Installed?

Run this command in Command Prompt:
```cmd
where emulator
```

**If it says "Could not find...":**
- Android SDK is not installed or not in PATH
- Solution: Install Android Studio → See "Installation" section below

**If it shows a path:**
- Android SDK is installed
- Try running: `emulator -list-avds`

---

### Check 2: Do You Have Any Virtual Devices?

Run:
```cmd
emulator -list-avds
```

**If empty (no output):**
- You need to create a virtual device
- Solution: Open Android Studio → Tools → Device Manager → Click "+"

**If you see device names:**
- You have devices, they just didn't auto-launch
- Pick one and run: `emulator -avd <DEVICE_NAME>`

Example:
```cmd
emulator -avd Pixel_5_API_30
```

---

## 📦 Installation: Android Studio & SDK

If you don't have Android Studio installed:

1. **Download Android Studio**
   - Go to: https://developer.android.com/studio
   - Download and install (takes 10-15 minutes)

2. **First-time Setup**
   - Open Android Studio
   - Follow the setup wizard
   - It will download Android SDK automatically

3. **Create a Virtual Device**
   - Go to: **Tools → Device Manager**
   - Click **"+"** or **"Create Device"**
   - Choose any phone (e.g., Pixel 5)
   - Download a system image (API 30 or higher recommended)
   - Click **Finish**

4. **Add to System PATH** (Optional, for command line)
   
   Add these to Windows PATH:
   ```
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\emulator
   C:\Users\<YourUsername>\AppData\Local\Android\Sdk\platform-tools
   ```

---

## ✅ Current Workaround (Works Right Now!)

You don't need to fix the auto-launch. Just do this:

### **Step 1:** Run this file
```
start-without-emulator.bat
```
This starts Backend + Mobile app (no emulator)

### **Step 2:** Open Android Studio manually
- Tools → Device Manager
- Click ▶️ on any device
- Wait for it to boot

### **Step 3:** In the Expo terminal window, press:
```
a
```

The app will install and open on the emulator!

---

## 🎯 Alternative: Use Physical Device

If emulator issues persist, use your real Android phone:

1. **Install Expo Go** from Play Store
2. **Enable Developer Options** on your phone:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

3. **Connect phone via USB**

4. Run:
```cmd
cd mobile
npm start
```

5. In Expo, scan the QR code with Expo Go app

---

## 🚀 Quick Reference Commands

```cmd
# Check if emulator is available
where emulator

# List all virtual devices
emulator -list-avds

# Start a specific device
emulator -avd Pixel_5_API_30

# Start with GPU acceleration (faster)
emulator -avd Pixel_5_API_30 -gpu host

# Check if any emulator is running
adb devices
```

---

## 📞 What's Currently Running?

After running `RUN_ME.bat` or `start-without-emulator.bat`:

✅ **Backend Server:** Running on http://localhost:8000
✅ **Expo Mobile App:** Running, showing QR code
❌ **Android Emulator:** You need to launch this manually

**Just open Android Studio → Device Manager → Click ▶️**

That's it! 🎉
