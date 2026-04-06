@echo off
echo Checking Android Emulator Setup...
echo ========================================
echo.

REM Check if emulator is in PATH
where emulator >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo [OK] Emulator found in PATH
    echo Location:
    where emulator
    echo.
) else (
    echo [ERROR] Emulator NOT found in PATH
    echo.
    echo Android SDK not configured properly.
    echo.
    goto :no_emulator
)

echo Listing Available Android Virtual Devices:
echo ----------------------------------------
emulator -list-avds

echo.
echo ========================================
echo.
set /p AVD_NAME=Enter AVD name to launch (or press Enter to skip): 

if "%AVD_NAME%"=="" goto :manual

echo.
echo Starting emulator: %AVD_NAME%
start emulator -avd %AVD_NAME%
echo.
echo Emulator launching... Please wait 30-60 seconds.
goto :end

:no_emulator
echo.
echo SOLUTION OPTIONS:
echo ========================================
echo.
echo Option 1: Install Android Studio
echo   - Download from: https://developer.android.com/studio
echo   - Install and run it at least once
echo   - Create a virtual device in Tools ^> Device Manager
echo.
echo Option 2: Find Android SDK manually
echo   Common locations:
echo   - C:\Users\%USERNAME%\AppData\Local\Android\Sdk
echo   - C:\Program Files\Android\Android Studio
echo.
echo   Then add to PATH:
echo   - [SDK_PATH]\emulator
echo   - [SDK_PATH]\platform-tools
echo.
echo Option 3: Use Android Studio GUI
echo   - Open Android Studio
echo   - Go to Tools ^> Device Manager
echo   - Click the play button next to any device
echo.
goto :end

:manual
echo.
echo To launch manually:
echo   1. Open Android Studio
echo   2. Go to Tools ^> Device Manager
echo   3. Click the play ▶ button next to any device
echo.

:end
echo.
pause
