@echo off
echo ========================================
echo Starting SafeNow Complete Environment
echo ========================================
echo.

REM Get current directory
set ROOT_DIR=%~dp0
cd /d %ROOT_DIR%

echo [1/3] Starting Django Backend Server with WebSocket support...
echo ========================================
start "SafeNow Backend" cmd /k "cd /d %ROOT_DIR%backend && python -m daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application"
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Android Emulator...
echo.

REM Preferred AVD name fragment (override with SAFENOW_AVD env var)
set "PREFERRED_AVD=Pixel_9"
if defined SAFENOW_AVD set "PREFERRED_AVD=%SAFENOW_AVD%"
set "PREFERRED_AVD_ALT=%PREFERRED_AVD: =_%"

REM Resolve emulator executable (PATH first, then default SDK location)
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
    set "TARGET_AVD="
    for /f "delims=" %%A in ('"!EMULATOR_EXE!" -list-avds 2^>nul') do (
        if not defined FIRST_AVD set "FIRST_AVD=%%A"
        echo %%A | findstr /I /C:"!PREFERRED_AVD!" /C:"!PREFERRED_AVD_ALT!" >nul && if not defined TARGET_AVD set "TARGET_AVD=%%A"
    )

    if defined TARGET_AVD (
        echo Launching preferred AVD: !TARGET_AVD!
        start "Android Emulator" "!EMULATOR_EXE!" -avd "!TARGET_AVD!" -no-snapshot-load
        timeout /t 10 /nobreak >nul
        echo [✓] Emulator launched: !TARGET_AVD!
    ) else if defined FIRST_AVD (
        echo [!] Preferred AVD "!PREFERRED_AVD!" not found
        echo Launching fallback AVD: !FIRST_AVD!
        start "Android Emulator" "!EMULATOR_EXE!" -avd "!FIRST_AVD!" -no-snapshot-load
        timeout /t 10 /nobreak >nul
        echo [✓] Emulator launched: !FIRST_AVD!
    ) else (
        echo [✗] No Android Virtual Device found
        echo     Please create one in Android Studio ^> Tools ^> Device Manager
    )
) else (
    echo [✗] Emulator executable not found
    echo     Install Android SDK emulator or add to PATH
)

echo.
echo [3/3] Starting Expo Mobile App...
echo ========================================
start "SafeNow Mobile" cmd /k "cd /d %ROOT_DIR%mobile && npx expo start -c --lan"

echo.
echo ========================================
echo All services started!
echo ========================================
echo.
echo Backend:  http://localhost:8000
echo Admin:    http://localhost:8000/admin
echo Mobile:   Follow instructions in Expo window
echo.
echo Press any key to view service status...
pause >nul

echo.
echo Service Status:
echo ========================================
netstat -ano | findstr :8000 >nul && echo [OK] Backend running on port 8000 || echo [ERROR] Backend not running
echo.
echo Keep all windows open for the app to work!
echo Close this window when done.
pause
