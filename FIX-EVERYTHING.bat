@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

title SafeNow - Complete Fix and Launch
color 0B

cls
echo.
echo   ╔══════════════════════════════════════════════════════════════╗
echo   ║                                                              ║
echo   ║              SafeNow - COMPLETE FIX ^& LAUNCH                 ║
echo   ║     Installs Dependencies + Fixes Everything + Starts All    ║
echo   ║                                                              ║
echo   ╚══════════════════════════════════════════════════════════════╝
echo.
echo   This script will:
echo   ✓ Install Python dependencies (Daphne, Django, etc.)
echo   ✓ Install Node.js dependencies (Expo, React Native, etc.)
echo   ✓ Clean up any running services on ports 8000 and 8081
echo   ✓ Start backend with Daphne (WebSocket support)
echo   ✓ Launch Android emulator
echo   ✓ Start Expo mobile app with cleared cache
echo.
echo   Press any key to start the complete fix...
pause >nul

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

REM ════════════════════════════════════════════════════════════════
REM STEP 1: Check Prerequisites
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [1/7] Checking Prerequisites
echo ════════════════════════════════════════════════════════════════
echo.

echo Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [✗] Python is not installed or not in PATH
    echo     Please install Python 3.8+ from python.org
    echo     Press any key to exit...
    pause >nul
    exit /b 1
)
python --version
echo [✓] Python found

echo.
echo Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [✗] Node.js is not installed or not in PATH
    echo     Please install Node.js from nodejs.org
    echo     Press any key to exit...
    pause >nul
    exit /b 1
)
node --version
echo [✓] Node.js found

echo.
echo Checking npm installation...
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [✗] npm is not installed or not in PATH
    echo     npm should come with Node.js
    echo     Press any key to exit...
    pause >nul
    exit /b 1
)
npm --version
echo [✓] npm found

echo.
echo [✓] All prerequisites met
timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 2: Install Python Dependencies
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [2/7] Installing Python Dependencies
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%ROOT_DIR%backend"

if not exist "requirements.txt" (
    echo [✗] requirements.txt not found in backend folder
    echo     Press any key to exit...
    pause >nul
    exit /b 1
)

echo Installing Python packages from requirements.txt...
echo This may take a few minutes...
echo.
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Some packages may have failed to install
    echo     Attempting to install critical packages manually...
    echo.
    python -m pip install Django djangorestframework django-cors-headers daphne channels channels-redis
)

echo.
echo Verifying Daphne installation...
python -c "import daphne; print('[✓] Daphne version:', daphne.__version__)"
if %ERRORLEVEL% NEQ 0 (
    echo [✗] Daphne installation failed
    echo     Trying one more time...
    python -m pip install daphne --force-reinstall
)

echo.
echo [✓] Python dependencies installed
timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 3: Install Node.js Dependencies
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [3/7] Installing Node.js Dependencies
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%ROOT_DIR%mobile"

if exist "package.json" (
    echo Installing mobile app dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [!] npm install encountered errors
        echo     Trying with --legacy-peer-deps...
        call npm install --legacy-peer-deps
    )
    
    echo.
    echo [✓] Mobile dependencies installed
) else (
    echo [!] package.json not found in mobile folder
    echo     Skipping mobile dependencies...
)

timeout /t 2 /nobreak >nul

cd /d "%ROOT_DIR%frontend"

if exist "package.json" (
    echo.
    echo Installing frontend dependencies...
    echo This may take a few minutes...
    echo.
    call npm install
    
    if %ERRORLEVEL% NEQ 0 (
        echo.
        echo [!] npm install encountered errors
        echo     Trying with --legacy-peer-deps...
        call npm install --legacy-peer-deps
    )
    
    echo.
    echo [✓] Frontend dependencies installed
) else (
    echo [!] package.json not found in frontend folder
    echo     Skipping frontend dependencies...
)

timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 4: Run Django Migrations
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [4/7] Running Django Migrations
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%ROOT_DIR%backend"

echo Running database migrations...
python manage.py makemigrations
python manage.py migrate

echo.
echo [✓] Migrations complete
timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 5: Clean Up Existing Services
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [5/7] Cleanup - Stopping Existing Services
echo ════════════════════════════════════════════════════════════════
echo.

echo Checking for processes on port 8000 (backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Checking for processes on port 8081 (Metro bundler)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081 ^| findstr LISTENING 2^>nul') do (
    echo   Stopping process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo [✓] Cleanup complete
timeout /t 2 /nobreak >nul

REM ════════════════════════════════════════════════════════════════
REM STEP 6: Start Backend with Daphne (WebSocket Support)
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [6/7] Starting Django Backend with Daphne (WebSocket Support)
echo ════════════════════════════════════════════════════════════════
echo.
echo   CRITICAL: Using Daphne ASGI server (not runserver)
echo   This enables WebSocket connections for real-time SOS updates
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
REM STEP 7: Start Android Emulator
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [7/7] Starting Android Emulator
echo ════════════════════════════════════════════════════════════════
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

REM ════════════════════════════════════════════════════════════════
REM STEP 8: Start Expo Mobile App with Cleared Cache
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  [8/7] Starting Expo Mobile App (Cleared Cache)
echo ════════════════════════════════════════════════════════════════
echo.

cd /d "%ROOT_DIR%mobile"

echo   Starting with -c flag to reload updated configuration
echo.

start "SafeNow Mobile - WebSocket Ready" cmd /k "cd /d "%ROOT_DIR%mobile" && echo ═══════════════════════════════════════════════════════ && echo  SafeNow Mobile - WebSocket Configuration Loaded && echo ═══════════════════════════════════════════════════════ && echo. && echo Starting Expo with cleared cache... && echo. && npx expo start -c"

echo Waiting for Metro bundler to initialize...
timeout /t 8 /nobreak >nul

netstat -ano | findstr :8081 | findstr LISTENING >nul
if %ERRORLEVEL% EQU 0 (
    echo [✓] Metro bundler started successfully
) else (
    echo [!] Metro bundler still starting - check the mobile window
)

REM ════════════════════════════════════════════════════════════════
REM FINAL: Verification and Instructions
REM ════════════════════════════════════════════════════════════════
echo.
echo ════════════════════════════════════════════════════════════════
echo  FINAL VERIFICATION ^& STATUS
echo ════════════════════════════════════════════════════════════════
echo.

timeout /t 2 /nobreak >nul

echo Service Status:
echo ----------------
netstat -ano | findstr :8000 | findstr LISTENING >nul && echo [✓] Backend (Daphne):  http://0.0.0.0:8000 || echo [✗] Backend not running
netstat -ano | findstr :8081 | findstr LISTENING >nul && echo [✓] Metro Bundler:     Running on port 8081 || echo [!] Metro still starting

echo.
echo ════════════════════════════════════════════════════════════════
echo  ✅ SETUP COMPLETE
echo ════════════════════════════════════════════════════════════════
echo.
echo   All dependencies installed and services started!
echo.
echo   Keep all 3 windows open:
echo   • SafeNow Backend - WebSocket Enabled
echo   • Android Emulator
echo   • SafeNow Mobile - WebSocket Ready
echo.
echo   Next Steps:
echo   1. Wait for Expo QR code (in "SafeNow Mobile" window)
echo   2. In Android Emulator, tap "SafeNow" or scan QR code
echo   3. Watch for WebSocket connection success
echo.
echo   Troubleshooting:
echo   • If Daphne error: Check backend window for details
echo   • If Metro error: Check mobile window and restart Expo
echo   • If emulator won't start: Open Android Studio first
echo.
echo   Press any key to close this launcher window...
echo.
echo ════════════════════════════════════════════════════════════════
pause >nul
