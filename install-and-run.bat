@echo off
echo ========================================
echo Installing Expo SDK 52
echo ========================================
echo.

cd /d "c:\Users\avina\OneDrive\Desktop\final\SafeNow\mobile"

echo Step 1: Cleaning up...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 2: Installing dependencies (this may take 2-5 minutes)...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed! Trying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
)

echo.
echo Step 3: Starting Expo with tunnel mode...
echo This will work better for your physical phone!
echo.
start cmd /k "cd /d c:\Users\avina\OneDrive\Desktop\final\SafeNow\mobile && npx expo start -c --tunnel"

echo.
echo ========================================
echo Done! Expo is starting in a new window
echo ========================================
echo.
echo Scan the QR code with Expo Go on your phone
echo.
