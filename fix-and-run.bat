@echo off
echo Installing missing Expo packages...
cd /d "c:\Users\avina\OneDrive\Desktop\final\SafeNow\mobile"

call npm install expo-asset@~11.0.0 expo-font@~13.0.0

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    pause
    exit /b 1
)

echo.
echo Success! Packages installed.
echo.
echo Now starting Expo with tunnel mode...
echo.

npx expo start -c --tunnel
