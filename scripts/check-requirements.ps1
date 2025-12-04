# Quick Check Script for Android Requirements
# فحص سريع للمتطلبات

Write-Host "Checking Android requirements..." -ForegroundColor Cyan
Write-Host ""

$allOk = $true

# Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Node.js: Not installed" -ForegroundColor Red
    $allOk = $false
}

# npm
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] npm: Not installed" -ForegroundColor Red
    $allOk = $false
}

# Java
try {
    $javaOutput = java -version 2>&1 | Out-String
    if ($javaOutput -match 'version "(\d+)') {
        Write-Host "[OK] Java: Installed" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Java: Not installed" -ForegroundColor Red
        $allOk = $false
    }
} catch {
    Write-Host "[FAIL] Java: Not installed" -ForegroundColor Red
    $allOk = $false
}

# Android SDK
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path "$sdkPath\platform-tools\adb.exe") {
    Write-Host "[OK] Android SDK: Found" -ForegroundColor Green
} else {
    Write-Host "[WARN] Android SDK: Not found" -ForegroundColor Yellow
}

Write-Host ""
if ($allOk) {
    Write-Host "[SUCCESS] All basic requirements are installed!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Some requirements are missing" -ForegroundColor Red
    Write-Host "  Run: npm run android:install for detailed check" -ForegroundColor Yellow
}
