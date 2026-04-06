@echo off
echo Checking for Android Emulators...
echo.

REM Check if emulator command exists
where emulator >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Android emulator not found in PATH
    echo.
    echo Please open Android Studio and launch emulator manually:
    echo 1. Open Android Studio
    echo 2. Go to Tools -^> Device Manager
    echo 3. Click the play button on any device
    echo.
    pause
    exit /b 1
)

echo Finding available devices...
emulator -list-avds > avds.txt

REM Check if any AVDs exist
for /f %%i in (avds.txt) do set AVD_FOUND=%%i

if not defined AVD_FOUND (
    echo ERROR: No Android Virtual Devices found
    echo.
    echo Please create one in Android Studio:
    echo 1. Open Android Studio
    echo 2. Tools -^> Device Manager
    echo 3. Click + to create a new device
    echo.
    del avds.txt
    pause
    exit /b 1
)

echo.
echo Available Devices:
type avds.txt
echo.

REM Get first AVD
set /p FIRST_AVD=<avds.txt
del avds.txt

echo Launching emulator: %FIRST_AVD%
echo.
echo This will take 30-60 seconds to boot...
echo.

start "Android Emulator" emulator -avd %FIRST_AVD%

echo.
echo Emulator is starting!
echo Wait for the Android home screen to appear.
echo.
echo Then press 'a' in the Expo terminal to open the app.
echo.
pause
