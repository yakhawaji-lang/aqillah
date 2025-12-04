# Open Android Studio
# فتح Android Studio

Write-Host "Opening Android Studio..." -ForegroundColor Cyan
Write-Host ""

$studioPaths = @(
    "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
    "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe",
    "$env:ProgramFiles\Google\Android Studio\bin\studio64.exe"
)

$studioFound = $false
foreach ($path in $studioPaths) {
    if (Test-Path $path) {
        Write-Host "[OK] Found Android Studio at: $path" -ForegroundColor Green
        Write-Host ""
        Write-Host "Opening Android Studio..." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Instructions:" -ForegroundColor Cyan
        Write-Host "  1. Choose 'Standard' setup" -ForegroundColor White
        Write-Host "  2. Wait for Android SDK to download (10-20 minutes)" -ForegroundColor White
        Write-Host "  3. Click 'Finish' when done" -ForegroundColor White
        Write-Host ""
        Start-Process $path
        $studioFound = $true
        break
    }
}

if (-not $studioFound) {
    Write-Host "[ERROR] Android Studio not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Android Studio first:" -ForegroundColor Yellow
    Write-Host "  npm run android:download-studio" -ForegroundColor White
    Write-Host ""
    Write-Host "Or open it manually from Start Menu" -ForegroundColor Yellow
    exit 1
}

