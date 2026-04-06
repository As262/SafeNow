@echo off
color 0A
title SafeNow - Quick Start

cls
echo.
echo   ███████╗ █████╗ ███████╗███████╗███╗   ██╗ ██████╗ ██╗    ██╗
echo   ██╔════╝██╔══██╗██╔════╝██╔════╝████╗  ██║██╔═══██╗██║    ██║
echo   ███████╗███████║█████╗  █████╗  ██╔██╗ ██║██║   ██║██║ █╗ ██║
echo   ╚════██║██╔══██║██╔══╝  ██╔══╝  ██║╚██╗██║██║   ██║██║███╗██║
echo   ███████║██║  ██║██║     ███████╗██║ ╚████║╚██████╔╝╚███╔███╔╝
echo   ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝  ╚══╝╚══╝ 
echo.
echo   Your Safety, Our Priority
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   This script will start all SafeNow services:
echo   1. Django Backend Server ^(port 8000^)
echo   2. Android Emulator
echo   3. Expo Mobile App
echo.
echo   ═══════════════════════════════════════════════════════════════
echo.
echo   Press any key to start all services...
echo   ^(or close this window to cancel^)
pause >nul

cls
call "%~dp0start-all.bat"
