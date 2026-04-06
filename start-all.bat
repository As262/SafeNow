@echo off
echo ========================================
echo Starting SafeNow Complete Environment
echo ========================================
echo.

REM Get current directory
set ROOT_DIR=%~dp0
cd /d %ROOT_DIR%

echo [1/3] Starting Django Backend Server...
echo ========================================
start "SafeNow Backend" cmd /k "cd /d %ROOT_DIR%backend && python manage.py runserver 0.0.0.0:8000"
timeout /t 5 /nobreak >nul

echo.
echo [2/3] Starting Android Emulator...
echo ========================================
REM Check if emulator exists
where emulator >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo Listing available Android Virtual Devices...
    emulator -list-avds > avds.tmp
    
    REM Read first AVD name
    set /p AVD_NAME=<avds.tmp
    del avds.tmp
    
    if not "%AVD_NAME%"=="" (
        echo Starting emulator: %AVD_NAME%
        start "Android Emulator" emulator -avd %AVD_NAME%
        echo Waiting for emulator to boot... ^(this may take 30-60 seconds^)
        timeout /t 15 /nobreak >nul
    ) else (
        echo WARNING: No Android Virtual Devices found!
        echo Please create one in Android Studio ^(Tools ^> Device Manager^)
        echo.
        echo Continuing anyway...
    )
) else (
    echo WARNING: Android emulator not found in PATH
    echo Make sure Android SDK is installed and ANDROID_HOME is set
    echo.
    echo Continuing anyway...
)

echo.
echo [3/3] Starting Expo Mobile App...
echo ========================================
start "SafeNow Mobile" cmd /k "cd /d %ROOT_DIR%mobile && npm start"

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
