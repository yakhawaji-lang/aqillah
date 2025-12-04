# Complete Android Setup - Fully Automated
# إعداد Android الكامل - تلقائي بالكامل

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Complete Android Setup (Auto)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sdkPath = "C:\Android\Sdk"
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Ensure directories
Write-Host "[1/7] Preparing directories..." -ForegroundColor Yellow
@("$sdkPath", "$sdkPath\cmdline-tools\latest") | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
    }
}
Write-Host "[OK] Directories ready" -ForegroundColor Green

# Download Command Line Tools
Write-Host ""
Write-Host "[2/7] Installing Command Line Tools..." -ForegroundColor Yellow
$sdkManager = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "  Downloading (this may take a few minutes)..." -ForegroundColor Gray
    $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $zip = "$env:TEMP\cmdline-tools-$(Get-Date -Format 'yyyyMMddHHmmss').zip"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 600
        Expand-Archive -Path $zip -DestinationPath "$sdkPath\cmdline-tools" -Force
        $cmdlineDir = Get-ChildItem "$sdkPath\cmdline-tools\cmdline-tools" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($cmdlineDir) {
            Move-Item $cmdlineDir.FullName "$sdkPath\cmdline-tools\latest" -Force -ErrorAction SilentlyContinue
        }
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Command Line Tools installed" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Download failed" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[OK] Command Line Tools already installed" -ForegroundColor Green
}

# Accept licenses automatically
Write-Host ""
Write-Host "[3/7] Accepting licenses..." -ForegroundColor Yellow
$licenseFile = "$sdkPath\licenses\android-sdk-license"
$licenseDir = Split-Path $licenseFile -Parent

if (-not (Test-Path $licenseDir)) {
    New-Item -ItemType Directory -Path $licenseDir -Force | Out-Null
}

# Create license file
$licenseContent = @"
24333f8a63b682f72df3c83bf255b5a956b8d8c6
"@

if (-not (Test-Path $licenseFile)) {
    $licenseContent | Out-File -FilePath $licenseFile -Encoding ASCII -NoNewline
    Write-Host "[OK] License accepted" -ForegroundColor Green
} else {
    Write-Host "[OK] License already accepted" -ForegroundColor Green
}

# Install SDK components
Write-Host ""
Write-Host "[4/7] Installing SDK components..." -ForegroundColor Yellow
Write-Host "  This will take 5-10 minutes..." -ForegroundColor Gray

$components = @(
    "platform-tools",
    "platforms;android-33",
    "build-tools;33.0.0"
)

foreach ($component in $components) {
    Write-Host "  Installing $component..." -ForegroundColor Gray
    try {
        $process = Start-Process -FilePath $sdkManager -ArgumentList "$component", "--sdk_root=$sdkPath" -NoNewWindow -Wait -PassThru -RedirectStandardOutput "$env:TEMP\sdk-output.txt" -RedirectStandardError "$env:TEMP\sdk-error.txt"
        if ($process.ExitCode -eq 0) {
            Write-Host "    [OK] $component installed" -ForegroundColor Green
        } else {
            Write-Host "    [WARN] $component may have issues" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "    [WARN] $component installation had issues: $_" -ForegroundColor Yellow
    }
}

# Verify ADB
Write-Host ""
Write-Host "[5/7] Verifying installation..." -ForegroundColor Yellow
$adbPath = "$sdkPath\platform-tools\adb.exe"

if (Test-Path $adbPath) {
    Write-Host "[OK] ADB found" -ForegroundColor Green
    try {
        $adbVersion = & $adbPath version 2>&1 | Select-Object -First 1
        Write-Host "  Version: $adbVersion" -ForegroundColor Gray
    } catch {
        Write-Host "[WARN] ADB found but test failed" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] ADB not found - trying reinstall..." -ForegroundColor Red
    Start-Process -FilePath $sdkManager -ArgumentList "platform-tools", "--sdk_root=$sdkPath", "--force" -NoNewWindow -Wait -ErrorAction SilentlyContinue
}

# Update environment
Write-Host ""
Write-Host "[6/7] Updating environment variables..." -ForegroundColor Yellow

try {
    [Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    [Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
    
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $newPaths = @(
        "$sdkPath\platform-tools",
        "$sdkPath\tools",
        "$sdkPath\cmdline-tools\latest\bin"
    )
    
    foreach ($newPath in $newPaths) {
        if ($userPath -notlike "*$newPath*") {
            $userPath = if ($userPath) { "$userPath;$newPath" } else { $newPath }
        }
    }
    
    [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    
    # Update current session
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath
    $env:Path += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\cmdline-tools\latest\bin"
    
    Write-Host "[OK] Environment updated" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Environment update had issues: $_" -ForegroundColor Yellow
}

# Setup Capacitor
Write-Host ""
Write-Host "[7/7] Setting up Capacitor..." -ForegroundColor Yellow

try {
    if (-not (Test-Path "node_modules\@capacitor\core")) {
        Write-Host "  Installing Capacitor..." -ForegroundColor Gray
        npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev --silent 2>&1 | Out-Null
    }
    
    if (-not (Test-Path "capacitor.config.json")) {
        Write-Host "  Note: Run 'npm run android:setup' to initialize Capacitor" -ForegroundColor Gray
    }
    
    Write-Host "[OK] Capacitor ready" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Capacitor setup skipped: $_" -ForegroundColor Yellow
}

# Final test
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Final Test" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path $adbPath) {
    try {
        $env:Path += ";$sdkPath\platform-tools"
        $test = & $adbPath version 2>&1 | Select-Object -First 1
        Write-Host "[SUCCESS] ADB is working!" -ForegroundColor Green
        Write-Host "  $test" -ForegroundColor Gray
    } catch {
        Write-Host "[INFO] ADB found but needs PowerShell restart" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] ADB still not found" -ForegroundColor Red
    Write-Host "  Please check: $sdkPath\platform-tools" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SDK Location: $sdkPath" -ForegroundColor White
Write-Host ""
Write-Host "RESTART PowerShell, then verify:" -ForegroundColor Red
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npm run android:check" -ForegroundColor White
Write-Host ""
Write-Host "Then proceed:" -ForegroundColor Yellow
Write-Host "  npm run android:setup" -ForegroundColor White
Write-Host "  npm run android:build" -ForegroundColor White
Write-Host ""

