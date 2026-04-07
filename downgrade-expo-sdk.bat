@echo off
echo ========================================
echo Downgrading Expo SDK 55 to SDK 51
echo ========================================
echo.
echo This will make the app compatible with older
echo Expo Go versions on Android
echo.
echo Press Ctrl+C to cancel, or
pause

cd mobile

echo.
echo Step 1: Cleaning up old installation...
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 2: Installing dependencies with SDK 51...
call npm install

if errorlevel 1 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b 1
)

echo.
echo Step 3: Verifying Expo SDK version...
call npx expo --version

echo.
echo ========================================
echo Downgrade Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Start Metro: npx expo start -c
echo 2. Scan QR code with Expo Go on your phone
echo.
pause
