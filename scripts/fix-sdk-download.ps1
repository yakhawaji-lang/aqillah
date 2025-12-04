# Fix Android SDK Download Issues
# إصلاح مشاكل تحميل Android SDK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Fix Android SDK Download Issues" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1] Checking SDK directory..." -ForegroundColor Yellow
$sdkPath = "C:\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "[OK] SDK directory exists: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "[INFO] Creating SDK directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $sdkPath -Force | Out-Null
    Write-Host "[OK] Created: $sdkPath" -ForegroundColor Green
}

Write-Host ""
Write-Host "[2] Checking permissions..." -ForegroundColor Yellow
try {
    $acl = Get-Acl $sdkPath
    Write-Host "[OK] Permissions OK" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Permission issue detected" -ForegroundColor Yellow
    Write-Host "  Run PowerShell as Administrator and try:" -ForegroundColor Gray
    Write-Host "  icacls `"$sdkPath`" /grant `"$env:USERNAME:(OI)(CI)F`" /T" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[3] Testing internet connection..." -ForegroundColor Yellow
try {
    $test = Test-NetConnection dl.google.com -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
    if ($test) {
        Write-Host "[OK] Internet connection OK" -ForegroundColor Green
    } else {
        Write-Host "[WARN] Cannot reach Google servers" -ForegroundColor Yellow
        Write-Host "  Check your internet connection or firewall" -ForegroundColor Gray
    }
} catch {
    Write-Host "[WARN] Internet test failed" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[4] Cleaning temporary files..." -ForegroundColor Yellow
$tempPaths = @(
    "$env:LOCALAPPDATA\Google\AndroidStudio*",
    "$env:APPDATA\Google\AndroidStudio*"
)

foreach ($path in $tempPaths) {
    $items = Get-ChildItem -Path (Split-Path $path -Parent) -Filter (Split-Path $path -Leaf) -ErrorAction SilentlyContinue
    if ($items) {
        foreach ($item in $items) {
            try {
                Remove-Item -Path $item.FullName -Recurse -Force -ErrorAction SilentlyContinue
                Write-Host "  [OK] Removed: $($item.Name)" -ForegroundColor Green
            } catch {
                Write-Host "  [SKIP] Could not remove: $($item.Name)" -ForegroundColor Gray
            }
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Next Steps" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Close Android Studio completely" -ForegroundColor Yellow
Write-Host "2. Reopen Android Studio:" -ForegroundColor Yellow
Write-Host '   npm run android:open-studio' -ForegroundColor White
Write-Host ""
Write-Host "3. In Setup Wizard:" -ForegroundColor Yellow
Write-Host "   - Set SDK Location to: C:\Android\Sdk" -ForegroundColor White
Write-Host "   - Choose 'Standard' setup" -ForegroundColor White
Write-Host "   - Click Next" -ForegroundColor White
Write-Host ""
Write-Host "4. If error persists:" -ForegroundColor Yellow
Write-Host "   - Check internet connection" -ForegroundColor White
Write-Host "   - Disable VPN/Proxy if used" -ForegroundColor White
Write-Host "   - Try manual SDK installation (see حل_خطأ_تحميل_SDK.md)" -ForegroundColor White
Write-Host ""

