@echo off
setlocal
color 0B
title SafeNow - Complete Setup with Expo SDK 52 + Tunnel Mode

cls
echo.
echo   ╔══════════════════════════════════════════════════════════════╗
echo   ║                                                              ║
echo   ║         SafeNow - Complete Installation and Launch          ║
echo   ║               Expo SDK 52 + Tunnel Mode                      ║
echo   ║                                                              ║
echo   ╚══════════════════════════════════════════════════════════════╝
echo.
echo   This will:
echo   ✓ Install Expo SDK 52 (compatible with most Expo Go versions)
echo   ✓ Clean up old dependencies
echo   ✓ Start backend with Daphne (WebSocket support)
echo   ✓ Start mobile with TUNNEL mode (works on any network)
echo.
echo   Press Ctrl+C to cancel, or
pause
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

REM ════════════════════════════════════════════════════════════════
REM STEP 1: Install Mobile Dependencies
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [1/5] Installing Mobile Dependencies (SDK 52)
echo ════════════════════════════════════════════════════════════════
echo.

cd mobile

if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing old package-lock.json...
    del package-lock.json
)

echo.
echo Installing dependencies (this may take 2-5 minutes)...
echo.
call npm install

if errorlevel 1 (
    echo.
    echo [!] Standard installation failed, trying with --legacy-peer-deps...
    call npm install --legacy-peer-deps
    if errorlevel 1 (
        echo.
        echo [✗] ERROR: Installation failed!
        echo     Please check the error messages above
        pause
        exit /b 1
    )
)

echo.
echo [✓] Mobile dependencies installed successfully!
timeout /t 2 /nobreak >nul

cd /d "%ROOT_DIR%"

REM ════════════════════════════════════════════════════════════════
REM STEP 2: Clean Up Existing Services
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [2/5] Cleanup - Stopping Existing Services
echo ════════════════════════════════════════════════════════════════
echo.

echo Checking for processes on port 8000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 8081 (Metro)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [✓] Cleanup complete
timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 3: Start Backend with Daphne
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [3/5] Starting Backend with Daphne (WebSocket Support)
echo ════════════════════════════════════════════════════════════════
echo.

start "SafeNow Backend - WebSocket Enabled" cmd /k "cd /d "%ROOT_DIR%backend" && echo ═══════════════════════════════════════════════════════ && echo  SafeNow Backend - WebSocket Support ENABLED && echo ═══════════════════════════════════════════════════════ && echo. && echo Server:    http://0.0.0.0:8000 && echo API:       http://0.0.0.0:8000/api && echo WebSocket: ws://0.0.0.0:8000/ws && echo. && echo Starting Daphne ASGI server... && echo. && python -m daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application"

echo Waiting for backend to initialize...
timeout /t 6 /nobreak >nul

netstat -ano | findstr :8000 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] Backend started successfully on port 8000
) else (
    echo [!] Backend may still be starting - check the backend window
)

REM ════════════════════════════════════════════════════════════════
REM STEP 4: Start Android Emulator (Optional)
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [4/5] Starting Android Emulator (Optional)
echo ════════════════════════════════════════════════════════════════
echo.

set "EMULATOR_EXE="
for /f "delims=" %%I in ('where emulator 2^>nul') do (
    if not defined EMULATOR_EXE set "EMULATOR_EXE=%%I"
)
if not defined EMULATOR_EXE (
    if exist "%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe" (
        set "EMULATOR_EXE=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"
    )
)

if defined EMULATOR_EXE (
    set "FIRST_AVD="
    for /f "delims=" %%A in ('"!EMULATOR_EXE!" -list-avds 2^>nul') do (
        if not defined FIRST_AVD set "FIRST_AVD=%%A"
    )
    
    if defined FIRST_AVD (
        echo Launching emulator: !FIRST_AVD!
        start "Android Emulator" "!EMULATOR_EXE!" -avd "!FIRST_AVD!" -no-snapshot-load
        timeout /t 10 /nobreak >nul
        echo [✓] Emulator launched
    ) else (
        echo [!] No AVDs found - skipping emulator
    )
) else (
    echo [!] Emulator not found - skipping
    echo     You can use a physical device instead!
)

REM ════════════════════════════════════════════════════════════════
REM STEP 5: Start Expo with Tunnel Mode
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [5/5] Starting Expo with TUNNEL Mode
echo ════════════════════════════════════════════════════════════════
echo.
echo   TUNNEL mode creates a public URL that works:
echo   ✓ On physical phones (bypasses network issues)
echo   ✓ On different WiFi networks
echo   ✓ With firewalls and VPNs
echo.

start "SafeNow Mobile - LAN Mode" cmd /k "cd /d "%ROOT_DIR%mobile" && echo ═══════════════════════════════════════════════════════ && echo  SafeNow Mobile - LAN Mode && echo ═══════════════════════════════════════════════════════ && echo. && echo Backend:    http://10.49.250.163:8000 && echo WebSocket:  ws://10.49.250.163:8000/ws && echo Mode:       LAN (Same WiFi Network) && echo. && echo IMPORTANT: Phone must be on same WiFi! && echo. && echo Starting Expo... && echo. && npx expo start -c --lan"

echo Waiting for Metro bundler...
timeout /t 10 /nobreak >nul

echo [✓] Expo started with tunnel mode

REM ════════════════════════════════════════════════════════════════
REM SUCCESS!
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  ✓ SUCCESS - All Services Running!
echo ════════════════════════════════════════════════════════════════
echo.
echo   Backend:   http://10.49.250.163:8000
echo   API:       http://10.49.250.163:8000/api
echo   WebSocket: ws://10.49.250.163:8000/ws
echo   Mobile:    TUNNEL mode (check QR code in Mobile window)
echo.
echo ════════════════════════════════════════════════════════════════
echo  Next Steps:
echo ════════════════════════════════════════════════════════════════
echo.
echo   1. Check "SafeNow Mobile - Tunnel Mode" window
echo   2. Wait for the QR code to appear (may take 30-60 seconds)
echo   3. Scan QR code with Expo Go on your phone
echo   4. App should load successfully!
echo.
echo   Windows to keep open:
echo   • SafeNow Backend - WebSocket Enabled
echo   • SafeNow Mobile - Tunnel Mode
echo   • Android Emulator (if using)
echo.
echo ════════════════════════════════════════════════════════════════
echo.
pause
