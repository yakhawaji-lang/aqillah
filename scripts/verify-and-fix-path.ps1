# Verify and Fix Android SDK Path
# التحقق وإصلاح مسار Android SDK

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Verify and Fix Android SDK Path" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sdkPath = "C:\Android\Sdk"
$adbPath = "$sdkPath\platform-tools\adb.exe"

# Check if adb exists
Write-Host "[1] Checking ADB..." -ForegroundColor Yellow
if (Test-Path $adbPath) {
    Write-Host "[OK] ADB found at: $adbPath" -ForegroundColor Green
} else {
    Write-Host "[ERROR] ADB not found!" -ForegroundColor Red
    Write-Host "  Location: $adbPath" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Please run: npm run android:install-sdk-manual" -ForegroundColor Yellow
    exit 1
}

# Check current PATH
Write-Host ""
Write-Host "[2] Checking PATH..." -ForegroundColor Yellow
$currentPath = $env:Path
$platformToolsInPath = $currentPath -like "*$sdkPath\platform-tools*"

if ($platformToolsInPath) {
    Write-Host "[OK] Platform-tools in current session PATH" -ForegroundColor Green
} else {
    Write-Host "[INFO] Adding to current session PATH..." -ForegroundColor Yellow
    $env:Path += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\cmdline-tools\latest\bin"
    Write-Host "[OK] Added to current session" -ForegroundColor Green
}

# Check User PATH
Write-Host ""
Write-Host "[3] Checking User PATH..." -ForegroundColor Yellow
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPathHasAndroid = $userPath -like "*$sdkPath*"

if ($userPathHasAndroid) {
    Write-Host "[OK] Android SDK paths in User PATH" -ForegroundColor Green
    Write-Host "  Paths found:" -ForegroundColor Gray
    ($userPath -split ';') | Where-Object { $_ -like "*Android*" } | ForEach-Object {
        Write-Host "    $_" -ForegroundColor Gray
    }
} else {
    Write-Host "[WARN] Android SDK paths not in User PATH" -ForegroundColor Yellow
    Write-Host "  Adding paths..." -ForegroundColor Yellow
    
    $pathsToAdd = @(
        "$sdkPath\platform-tools",
        "$sdkPath\tools",
        "$sdkPath\cmdline-tools\latest\bin"
    )
    
    foreach ($pathToAdd in $pathsToAdd) {
        if ($userPath -notlike "*$pathToAdd*") {
            if ($userPath) {
                $userPath += ";$pathToAdd"
            } else {
                $userPath = $pathToAdd
            }
        }
    }
    
    try {
        [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
        Write-Host "[OK] User PATH updated" -ForegroundColor Green
        Write-Host "  You need to restart PowerShell for changes to take effect" -ForegroundColor Yellow
    } catch {
        Write-Host "[ERROR] Failed to update User PATH: $_" -ForegroundColor Red
        Write-Host "  Run PowerShell as Administrator and try again" -ForegroundColor Yellow
    }
}

# Test adb
Write-Host ""
Write-Host "[4] Testing ADB..." -ForegroundColor Yellow
try {
    $adbVersion = & "$adbPath" version 2>&1 | Select-Object -First 1
    Write-Host "[OK] ADB is working!" -ForegroundColor Green
    Write-Host "  $adbVersion" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] ADB test failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Update current session environment
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath
$env:Path += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\cmdline-tools\latest\bin"

Write-Host "Current session updated:" -ForegroundColor Yellow
Write-Host "  ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor White
Write-Host "  PATH includes Android SDK paths" -ForegroundColor White
Write-Host ""
Write-Host "Try now:" -ForegroundColor Yellow
Write-Host "  adb version" -ForegroundColor White
Write-Host ""
Write-Host "If it works, restart PowerShell to make it permanent." -ForegroundColor Cyan
Write-Host ""

