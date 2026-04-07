@echo off
color 0C
title Fix Port 8081 - Metro Bundler

echo.
echo ========================================
echo  Fixing Port 8081 (Metro Bundler)
echo ========================================
echo.

echo [Step 1/3] Checking what's using port 8081...
echo ========================================
netstat -ano | findstr :8081
echo.

echo [Step 2/3] Killing processes on port 8081...
echo ========================================
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
    echo Killing process ID: %%a
    taskkill /F /PID %%a 2>nul
)
timeout /t 2 /nobreak >nul
echo Done!

echo.
echo [Step 3/3] Verifying port 8081 is free...
echo ========================================
netstat -ano | findstr :8081 >nul
if %ERRORLEVEL% EQU 0 (
    echo [WARNING] Port 8081 still in use. Trying again...
    timeout /t 2 /nobreak >nul
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8081') do (
        taskkill /F /PID %%a 2>nul
    )
) else (
    echo [OK] Port 8081 is now free!
)

echo.
echo ========================================
echo  Port 8081 Cleared!
echo ========================================
echo.
echo Now starting Expo Metro Bundler...
echo.

cd /d "%~dp0mobile"
start "SafeNow Mobile - Fresh Start" cmd /k "npx expo start -c"

echo.
echo ========================================
echo Done! Metro bundler should be starting.
echo ========================================
echo.
pause
