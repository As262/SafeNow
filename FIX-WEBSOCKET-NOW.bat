@echo off
color 0A
title SafeNow - WebSocket Fix & Restart

cls
echo.
echo   ╔══════════════════════════════════════════════════════════╗
echo   ║                                                          ║
echo   ║         SafeNow WebSocket Connection Fix                ║
echo   ║                                                          ║
echo   ╚══════════════════════════════════════════════════════════╝
echo.
echo   This script will:
echo   ✓ Stop any running backend servers
echo   ✓ Start backend with Daphne (WebSocket support)
echo   ✓ Restart Expo mobile app with cleared cache
echo.
echo   Press any key to start the fix...
pause >nul

cls
echo.
echo ════════════════════════════════════════════════════════════
echo  Step 1/4: Stopping Existing Services
echo ════════════════════════════════════════════════════════════
echo.

REM Kill any Python processes on port 8000
echo Checking for processes on port 8000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Stopping process ID: %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

REM Kill Metro bundler if running
echo Checking for Metro bundler on port 8081...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING') do (
    echo Stopping Metro bundler: %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul

echo.
echo [✓] Services stopped
timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════════
echo  Step 2/4: Starting Backend with Daphne (WebSocket Support)
echo ════════════════════════════════════════════════════════════
echo.
echo IMPORTANT: Backend will start with Daphne ASGI server
echo This enables WebSocket support for real-time SOS updates
echo.

set ROOT_DIR=%~dp0
cd /d %ROOT_DIR%

start "SafeNow Backend - WebSocket Enabled" cmd /k "cd /d %ROOT_DIR%backend && echo ═══════════════════════════════════════ && echo  SafeNow Backend - WebSocket Enabled && echo ═══════════════════════════════════════ && echo. && echo Starting Daphne ASGI server... && echo Server: http://0.0.0.0:8000 && echo WebSocket: ws://0.0.0.0:8000/ws && echo. && python -m daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application"

echo Waiting for backend to start...
timeout /t 7 /nobreak >nul

echo.
echo [✓] Backend started with WebSocket support
timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════════
echo  Step 3/4: Starting Expo with Cleared Cache
echo ════════════════════════════════════════════════════════════
echo.

start "SafeNow Mobile - WebSocket Ready" cmd /k "cd /d %ROOT_DIR%mobile && echo ═══════════════════════════════════════ && echo  SafeNow Mobile - WebSocket Ready && echo ═══════════════════════════════════════ && echo. && echo Starting Expo with cleared cache... && echo This will reload the updated IP configuration && echo. && npx expo start -c"

echo Waiting for Expo to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [✓] Expo Metro bundler starting
timeout /t 2 /nobreak >nul

echo.
echo ════════════════════════════════════════════════════════════
echo  Step 4/4: Verification
echo ════════════════════════════════════════════════════════════
echo.

timeout /t 3 /nobreak >nul

echo Checking backend status...
netstat -ano | findstr :8000 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] Backend running on port 8000
) else (
    echo [✗] Backend NOT detected - check the backend window
)

echo.
echo Checking Metro bundler status...
timeout /t 5 /nobreak >nul
netstat -ano | findstr :8081 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] Metro bundler running on port 8081
) else (
    echo [!] Metro bundler still starting - wait a moment
)

echo.
echo ════════════════════════════════════════════════════════════
echo  Configuration Summary
echo ════════════════════════════════════════════════════════════
echo.
echo   Backend IP:      10.49.250.225:8000
echo   WebSocket URL:   ws://10.49.250.225:8000/ws
echo   Metro Bundler:   10.49.250.225:8081
echo.
echo   Backend Server:  Daphne (ASGI - WebSocket enabled)
echo.
echo ════════════════════════════════════════════════════════════
echo  Next Steps
echo ════════════════════════════════════════════════════════════
echo.
echo   1. Wait for Expo QR code to appear (in Mobile window)
echo   2. In the Android emulator:
echo      - Tap "SafeNow" from recent history
echo      - OR scan the QR code
echo   3. Watch for this message in the Mobile window:
echo      "✅ WebSocket connected (real-time mode)"
echo.
echo   If WebSocket doesn't connect:
echo   - Check the Backend window for errors
echo   - Verify emulator shows "IPv4 server found: 10.49.250.225"
echo   - Read WEBSOCKET_FIX.md for detailed troubleshooting
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo   Keep both windows open!
echo   Press any key to close this window...
echo.
echo ════════════════════════════════════════════════════════════
pause >nul
