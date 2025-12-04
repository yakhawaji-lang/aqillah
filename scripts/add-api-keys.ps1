# Add API Keys to .env file
# إضافة مفاتيح API إلى ملف .env

Write-Host "========================================" -ForegroundColor Green
Write-Host "Adding API Keys to .env" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

$envFile = ".env"

# Check if .env exists
if (-not (Test-Path $envFile)) {
    Write-Host "[INFO] Creating .env file..." -ForegroundColor Yellow
    New-Item -Path $envFile -ItemType File | Out-Null
}

# Read existing content
$existingContent = Get-Content $envFile -ErrorAction SilentlyContinue

# Check if keys already exist
$hasMapsKey = $existingContent | Select-String -Pattern "AQILLAH_MAPS_WEB_KEY" -Quiet
$hasRoutesKey = $existingContent | Select-String -Pattern "AQILLAH_ROUTES_KEY" -Quiet
$hasPlacesKey = $existingContent | Select-String -Pattern "AQILLAH_PLACES_KEY" -Quiet

if ($hasMapsKey -and $hasRoutesKey -and $hasPlacesKey) {
    Write-Host "[INFO] API Keys already exist in .env" -ForegroundColor Yellow
    Write-Host ""
    $overwrite = Read-Host "Overwrite existing keys? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "[INFO] Skipping..." -ForegroundColor Yellow
        exit 0
    }
    
    # Remove existing keys
    $existingContent = $existingContent | Where-Object {
        $_ -notmatch "AQILLAH_MAPS_WEB_KEY" -and
        $_ -notmatch "AQILLAH_ROUTES_KEY" -and
        $_ -notmatch "AQILLAH_PLACES_KEY" -and
        $_ -notmatch "NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY" -and
        $_ -notmatch "^# Google Maps Platform"
    }
}

# API Keys to add
$keysToAdd = @"
# Google Maps Platform - AQILLAH Keys
AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_ROUTES_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
AQILLAH_PLACES_KEY=AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA

# Public Keys (for client-side)
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ

# Legacy Keys (for backward compatibility)
GOOGLE_MAPS_API_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
GOOGLE_ROUTES_API_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
"@

# Combine existing content with new keys
$newContent = @()
if ($existingContent) {
    $newContent += $existingContent
}
$newContent += ""
$newContent += $keysToAdd -split "`n"

# Write to file
$newContent | Out-File -FilePath $envFile -Encoding utf8

Write-Host "[SUCCESS] API Keys added to .env file!" -ForegroundColor Green
Write-Host ""
Write-Host "Keys added:" -ForegroundColor Cyan
Write-Host "  - AQILLAH_MAPS_WEB_KEY" -ForegroundColor Green
Write-Host "  - AQILLAH_ROUTES_KEY" -ForegroundColor Green
Write-Host "  - AQILLAH_PLACES_KEY" -ForegroundColor Green
Write-Host "  - NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart dev server: npm run dev" -ForegroundColor White
Write-Host "  2. Test APIs: http://localhost:3000/api/test-google-maps?test=all" -ForegroundColor White
