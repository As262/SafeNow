@echo off
title SafeNow - Start Without Emulator
color 0A

cls
echo.
echo   ███████╗ █████╗ ███████╗███████╗███╗   ██╗ ██████╗ ██╗    ██╗
echo   ██╔════╝██╔══██╗██╔════╝██╔════╝████╗  ██║██╔═══██╗██║    ██║
echo   ███████╗███████║█████╗  █████╗  ██╔██╗ ██║██║   ██║██║ █╗ ██║
echo   ╚════██║██╔══██║██╔══╝  ██╔══╝  ██║╚██╗██║██║   ██║██║███╗██║
echo   ███████║██║  ██║██║     ███████╗██║ ╚████║╚██████╔╝╚███╔███╔╝
echo   ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝  ╚══╝╚══╝ 
echo.
echo   Simplified Start (Backend + Mobile Only)
echo   ═══════════════════════════════════════════════════════════════
echo.

set ROOT_DIR=%~dp0

echo [1/2] Starting Django Backend Server...
echo ========================================
start "SafeNow Backend" cmd /k "cd /d %ROOT_DIR%backend && python manage.py runserver 0.0.0.0:8000"
echo [OK] Backend starting on http://localhost:8000
timeout /t 3 /nobreak >nul

echo.
echo [2/2] Starting Expo Mobile App...
echo ========================================
start "SafeNow Mobile" cmd /k "cd /d %ROOT_DIR%mobile && npm start"
echo [OK] Mobile app starting...
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo Services Started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Admin:    http://localhost:8000/admin
echo Mobile:   Check the Expo terminal window
echo.
echo ========================================
echo Next Steps:
echo ========================================
echo.
echo 1. Wait for Expo to load (QR code appears)
echo 2. Start Android Emulator MANUALLY:
echo    - Open Android Studio
echo    - Go to: Tools ^> Device Manager
echo    - Click the ▶ play button
echo.
echo 3. Once emulator is running, press 'a' in Expo window
echo.
echo ========================================
echo.
pause

cls
echo.
echo To launch Android Emulator manually:
echo ========================================
echo.
echo METHOD 1: Android Studio (EASIEST)
echo   1. Open Android Studio
echo   2. Tools ^> Device Manager
echo   3. Click ▶ play button on any device
echo.
echo METHOD 2: Command Line
echo   Run: launch-emulator.bat
echo.
echo METHOD 3: Check if Android SDK is installed
echo   Run this command:
echo   where emulator
echo.
pause
