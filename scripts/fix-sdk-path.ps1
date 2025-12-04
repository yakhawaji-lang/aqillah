# Fix Android SDK Path (Remove Whitespace Issue)
# إصلاح مسار Android SDK (إزالة مشكلة المسافات)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Fix Android SDK Path" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[WARN] Current SDK path contains whitespace:" -ForegroundColor Yellow
Write-Host "  $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor White
Write-Host ""
Write-Host "This can cause problems with NDK tools." -ForegroundColor Yellow
Write-Host ""

# Suggested new path
$newSdkPath = "C:\Android\Sdk"

Write-Host "[INFO] Suggested new path:" -ForegroundColor Cyan
Write-Host "  $newSdkPath" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to use this path? (Y/N)"
if ($confirm -ne 'Y' -and $confirm -ne 'y') {
    $newSdkPath = Read-Host "Enter new SDK path (without spaces)"
}

Write-Host ""
Write-Host "[1] Creating directory..." -ForegroundColor Yellow
if (-not (Test-Path $newSdkPath)) {
    New-Item -ItemType Directory -Path $newSdkPath -Force | Out-Null
    Write-Host "[OK] Directory created: $newSdkPath" -ForegroundColor Green
} else {
    Write-Host "[OK] Directory already exists: $newSdkPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2] Instructions for Android Studio:" -ForegroundColor Yellow
Write-Host ""
Write-Host "In Android Studio Setup Wizard:" -ForegroundColor Cyan
Write-Host "  1. Change SDK Location to: $newSdkPath" -ForegroundColor White
Write-Host "  2. Click 'Next' to continue" -ForegroundColor White
Write-Host "  3. Wait for SDK download to complete" -ForegroundColor White
Write-Host ""

Write-Host "[3] After SDK is downloaded, update environment:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Run this command:" -ForegroundColor Cyan
Write-Host "  [Environment]::SetEnvironmentVariable('ANDROID_HOME', '$newSdkPath', 'User')" -ForegroundColor White
Write-Host ""
Write-Host "Or run:" -ForegroundColor Cyan
Write-Host "  npm run android:setup-env-user" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "New SDK Path: $newSdkPath" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. In Android Studio, change SDK location to: $newSdkPath" -ForegroundColor White
Write-Host "  2. Complete the setup wizard" -ForegroundColor White
Write-Host "  3. After setup, update ANDROID_HOME environment variable" -ForegroundColor White
Write-Host ""

