# إعداد Google Maps APIs
# Setup Google Maps APIs

Write-Host "========================================" -ForegroundColor Green
Write-Host "إعداد Google Maps APIs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] Creating .env file..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -ErrorAction SilentlyContinue
    if (-not (Test-Path ".env")) {
        New-Item -Path ".env" -ItemType File | Out-Null
    }
}

Write-Host "[INFO] Google Maps API Setup Guide:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://console.cloud.google.com/" -ForegroundColor White
Write-Host "2. Create a new project or select existing" -ForegroundColor White
Write-Host "3. Enable the following APIs:" -ForegroundColor White
Write-Host "   - Maps JavaScript API" -ForegroundColor Yellow
Write-Host "   - Routes API" -ForegroundColor Yellow
Write-Host "   - Geocoding API" -ForegroundColor Yellow
Write-Host "   - Places API" -ForegroundColor Yellow
Write-Host "   - Maps SDK for Android (for mobile app)" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Create API Keys:" -ForegroundColor White
Write-Host "   - Go to APIs & Services > Credentials" -ForegroundColor White
Write-Host "   - Click 'Create Credentials' > 'API Key'" -ForegroundColor White
Write-Host "   - Copy the key(s)" -ForegroundColor White
Write-Host ""
Write-Host "5. Restrict API Keys (Recommended):" -ForegroundColor White
Write-Host "   - HTTP referrers for web: http://localhost:3000/*" -ForegroundColor Yellow
Write-Host "   - Android apps: Package name: sa.gov.aqillah" -ForegroundColor Yellow
Write-Host ""
Write-Host "6. Add keys to .env file:" -ForegroundColor White
Write-Host "   GOOGLE_MAPS_API_KEY=your_key_here" -ForegroundColor Yellow
Write-Host "   GOOGLE_ROUTES_API_KEY=your_key_here" -ForegroundColor Yellow
Write-Host "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here" -ForegroundColor Yellow
Write-Host ""

# Open browser to Google Cloud Console
$openConsole = Read-Host "Open Google Cloud Console? (y/n)"
if ($openConsole -eq "y" -or $openConsole -eq "Y") {
    Start-Process "https://console.cloud.google.com/apis/library"
}

Write-Host ""
Write-Host "[SUCCESS] Setup guide displayed!" -ForegroundColor Green
Write-Host "Add your API keys to .env file and restart the dev server." -ForegroundColor Cyan

