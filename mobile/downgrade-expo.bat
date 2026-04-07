@echo off
echo ========================================
echo Downgrading Expo SDK 55 to SDK 51
echo ========================================
echo.

cd /d "%~dp0"

echo Step 1: Removing node_modules and package-lock.json...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo.
echo Step 2: Installing Expo SDK 51...
call npm install expo@~51.0.0 --save

echo.
echo Step 3: Installing compatible Expo packages...
call npx expo install --fix

echo.
echo Step 4: Clearing Metro cache...
call npx expo start -c

pause
