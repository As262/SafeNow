@echo off
color 0E
title SafeNow - Restarting with WebSocket Fix

echo.
echo ========================================
echo  Restarting SafeNow with WebSocket Fix
echo ========================================
echo.

REM Get current directory
set ROOT_DIR=%~dp0
cd /d %ROOT_DIR%

echo [Step 1/3] Stopping existing services...
echo ========================================
taskkill /F /FI "WINDOWTITLE eq SafeNow Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq SafeNow Mobile*" 2>nul
timeout /t 2 /nobreak >nul
echo Done!

echo.
echo [Step 2/3] Starting Django Backend Server with WebSocket support...
echo ========================================
start "SafeNow Backend - UPDATED" cmd /k "cd /d %ROOT_DIR%backend && echo Starting backend with Daphne (WebSocket support)... && python -m daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application"
timeout /t 5 /nobreak >nul
echo Backend started!

echo.
echo [Step 3/3] Starting Expo Mobile App with cleared cache...
echo ========================================
start "SafeNow Mobile - UPDATED" cmd /k "cd /d %ROOT_DIR%mobile && echo Starting Expo with cleared cache... && npx expo start -c"

echo.
echo ========================================
echo  Services Restarted Successfully!
echo ========================================
echo.
echo CHANGES APPLIED:
echo   - API URL:       http://10.49.250.225:8000/api
echo   - WebSocket URL: ws://10.49.250.225:8000/ws
echo   - CORS:          Updated for mobile connections
echo.
echo NEXT STEPS:
echo   1. Wait for Expo to start (check the "SafeNow Mobile - UPDATED" window)
echo   2. In the emulator, tap "SafeNow" in recent history OR scan the QR code
echo   3. Look for "WebSocket connected" message in console
echo.
echo ========================================
echo Press any key to check service status...
pause >nul

echo.
echo Service Status Check:
echo ========================================
netstat -ano | findstr :8000 >nul && echo [OK] Backend running on port 8000 || echo [ERROR] Backend not running
timeout /t 1 /nobreak >nul
netstat -ano | findstr :8081 >nul && echo [OK] Expo Metro running on port 8081 || echo [WAITING] Expo still starting...

echo.
echo ========================================
echo All done! Keep the windows open.
echo ========================================
echo.
echo If WebSocket still doesn't connect:
echo   1. Check the backend window for any errors
echo   2. In Expo Go, shake device and select "Reload"
echo   3. Check WEBSOCKET_FIX.md for troubleshooting
echo.
pause
