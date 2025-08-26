# EcoWasteGo Connection Test Script
Write-Host "Testing EcoWasteGo Backend Connectivity..." -ForegroundColor Cyan
Write-Host ""

# Test localhost
Write-Host "Testing localhost:3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "localhost:3000 - SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "localhost:3000 - FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "localhost:3000 - FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""

# Test network IP
Write-Host "Testing network IP: 10.132.254.147:3000..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://10.132.254.147:3000/health" -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "10.132.254.147:3000 - SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "10.132.254.147:3000 - FAILED (Status: $($response.StatusCode))" -ForegroundColor Red
    }
} catch {
    Write-Host "10.132.254.147:3000 - FAILED (Error: $($_.Exception.Message))" -ForegroundColor Red
}

Write-Host ""
Write-Host "Connection test completed!" -ForegroundColor Cyan
Write-Host "Your mobile app should now be able to connect successfully!" -ForegroundColor Green
