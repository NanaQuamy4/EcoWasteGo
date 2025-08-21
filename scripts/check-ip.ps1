# Quick script to check current IP address
Write-Host "Checking current IP addresses..." -ForegroundColor Cyan

$wifiIP = (Get-NetIPAddress -InterfaceAlias "Wi-Fi" -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
$ethernetIP = (Get-NetIPAddress -InterfaceAlias "Ethernet" -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress

Write-Host ""
Write-Host "Network Interfaces:" -ForegroundColor Yellow
Write-Host "Wi-Fi IP:     $wifiIP" -ForegroundColor Green
Write-Host "Ethernet IP:  $ethernetIP" -ForegroundColor Green

Write-Host ""
Write-Host "Current API Configuration:" -ForegroundColor Yellow
$envIP = $env:EXPO_PUBLIC_LOCAL_IP
if ($envIP) {
    Write-Host "Environment IP: $envIP" -ForegroundColor Green
} else {
    Write-Host "Environment IP: Not set - using default 10.132.254.147" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "To update IP address:" -ForegroundColor Cyan
Write-Host "1. Update .env.local file with: EXPO_PUBLIC_LOCAL_IP=<your-new-ip>" -ForegroundColor White
Write-Host "2. Or directly edit constants/api.ts" -ForegroundColor White

Write-Host ""
Write-Host "Test backend connection:" -ForegroundColor Cyan
Write-Host "curl http://$wifiIP`:3000/health" -ForegroundColor White
