@echo off
echo Installing react-native-worklets...
cd /d "c:\Users\avina\OneDrive\Desktop\final\SafeNow\mobile"

call npm install react-native-worklets@0.7.2

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed!
    pause
    exit /b 1
)

echo.
echo Success! Now restarting Expo...
echo.

npx expo start -c --lan
