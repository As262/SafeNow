@echo off
setlocal
setlocal EnableDelayedExpansion

title SafeNow - Run Backend + Emulator + Mobile
color 0A

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

echo ========================================
echo SafeNow Full Launcher
echo ========================================
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

echo [1/3] Starting Django backend...
start "SafeNow Backend" cmd /k "cd /d "%ROOT_DIR%backend" && python manage.py runserver 0.0.0.0:8000"
timeout /t 4 /nobreak >nul

echo.
echo [2/3] Starting Android emulator...
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
        timeout /t 8 /nobreak >nul
    ) else if defined FIRST_AVD (
        echo WARNING: Preferred AVD "!PREFERRED_AVD!" not found.
        echo Launching fallback AVD: !FIRST_AVD!
        start "Android Emulator" "!EMULATOR_EXE!" -avd "!FIRST_AVD!" -no-snapshot-load
        timeout /t 8 /nobreak >nul
    ) else (
        echo WARNING: No Android Virtual Device found.
        echo Open Android Studio ^> Tools ^> Device Manager and create/start one.
    )
) else (
    echo WARNING: emulator.exe not found.
    echo Install Android SDK emulator tools or add emulator to PATH.
)

echo.
echo [3/3] Starting Expo mobile app...
start "SafeNow Mobile" cmd /k "cd /d "%ROOT_DIR%mobile" && npm start"

echo.
echo ========================================
echo Launch complete
echo ========================================
echo Backend: http://localhost:8000
echo Admin:   http://localhost:8000/admin
echo.
echo If Expo does not auto-open Android, press "a" in the Expo window.
echo Keep all started windows open while developing.
echo.
pause
