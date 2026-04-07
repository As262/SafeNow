@echo off
echo ========================================
echo Starting SafeNow Backend with WebSocket Support
echo ========================================
echo.

cd backend

echo Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://www.python.org/
    pause
    exit /b 1
)

echo.
echo Checking if virtual environment exists...
if exist venv (
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo WARNING: No virtual environment found
    echo Continue with global Python? (Y/N)
    set /p choice=
    if /i not "%choice%"=="Y" exit /b 1
)

echo.
echo Starting Django ASGI server with Daphne (WebSocket support)...
echo Server will be accessible at: http://0.0.0.0:8000
echo API endpoint: http://0.0.0.0:8000/api
echo WebSocket endpoint: ws://0.0.0.0:8000/ws
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Use Daphne for ASGI/WebSocket support
python -m daphne -b 0.0.0.0 -p 8000 safenow_backend.asgi:application

pause
