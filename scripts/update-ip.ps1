# EcoWasteGo IP Address Update Script
# This script helps update IP addresses across the project when your network IP changes

param(
    [Parameter(Mandatory=$true)]
    [string]$NewIP
)

Write-Host "🔄 Updating IP addresses to: $NewIP" -ForegroundColor Yellow

# Update constants/api.ts
$apiFile = "constants/api.ts"
if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    $content = $content -replace "return process\.env\.EXPO_PUBLIC_LOCAL_IP \|\| '[^']*';", "return process.env.EXPO_PUBLIC_LOCAL_IP || '$NewIP';"
    Set-Content $apiFile $content
    Write-Host "✅ Updated $apiFile" -ForegroundColor Green
}

# Update backend/server.ts
$serverFile = "backend/server.ts"
if (Test-Path $serverFile) {
    $content = Get-Content $serverFile -Raw
    $content = $content -replace "http://[0-9.]+:[0-9]+", "http://$NewIP`$&"
    $content = $content -replace "http://[0-9.]+:[0-9]+", "http://$NewIP`$&"
    $content = $content -replace "http://[0-9.]+:[0-9]+", "http://$NewIP`$&"
    Set-Content $serverFile $content
    Write-Host "✅ Updated $serverFile" -ForegroundColor Green
}

Write-Host "🎯 IP address updated to: $NewIP" -ForegroundColor Green
Write-Host "📱 Don't forget to restart your backend server!" -ForegroundColor Yellow
Write-Host "💡 You can also set EXPO_PUBLIC_LOCAL_IP=$NewIP in your environment variables" -ForegroundColor Cyan
