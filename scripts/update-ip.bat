@echo off
echo 🔄 EcoWasteGo IP Address Update Script
echo.

if "%1"=="" (
    echo ❌ Please provide the new IP address
    echo Usage: update-ip.bat [NEW_IP_ADDRESS]
    echo Example: update-ip.bat 192.168.1.100
    pause
    exit /b 1
)

echo 🎯 Updating IP addresses to: %1
echo.

powershell -ExecutionPolicy Bypass -File "%~dp0update-ip.ps1" -NewIP "%1"

echo.
echo ✅ IP address update completed!
echo 📱 Remember to restart your backend server
pause
