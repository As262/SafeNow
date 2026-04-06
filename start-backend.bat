@echo off
echo ========================================
echo Starting SafeNow Backend Server
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
echo Starting Django development server...
echo Server will be accessible at: http://localhost:8000
echo API endpoint: http://localhost:8000/api
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

python manage.py runserver 0.0.0.0:8000

pause
