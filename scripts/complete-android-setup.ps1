# Complete Android Setup - All in One
# إعداد Android الكامل - كل شيء في واحد

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Complete Android Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sdkPath = "C:\Android\Sdk"
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Step 1: Ensure SDK directory exists
Write-Host "[1/6] Ensuring SDK directory..." -ForegroundColor Yellow
if (-not (Test-Path $sdkPath)) {
    New-Item -ItemType Directory -Path $sdkPath -Force | Out-Null
}
New-Item -ItemType Directory -Path "$sdkPath\cmdline-tools\latest" -Force | Out-Null
Write-Host "[OK] SDK directory ready" -ForegroundColor Green

# Step 2: Download Command Line Tools if needed
Write-Host ""
Write-Host "[2/6] Checking Command Line Tools..." -ForegroundColor Yellow
$sdkManager = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "  Downloading Command Line Tools..." -ForegroundColor Gray
    $url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
    $zip = "$env:TEMP\cmdline-tools.zip"
    $extract = "$sdkPath\cmdline-tools"
    
    try {
        Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 600
        Expand-Archive -Path $zip -DestinationPath $extract -Force
        $cmdlineDir = Get-ChildItem "$extract\cmdline-tools" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($cmdlineDir) {
            $latestPath = "$extract\latest"
            if (Test-Path $latestPath) { Remove-Item $latestPath -Recurse -Force }
            Move-Item $cmdlineDir.FullName $latestPath -Force
        }
        Remove-Item $zip -Force -ErrorAction SilentlyContinue
        Write-Host "[OK] Command Line Tools installed" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Download failed: $_" -ForegroundColor Red
        Write-Host "  Please check internet connection" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "[OK] Command Line Tools already installed" -ForegroundColor Green
}

# Step 3: Install SDK components
Write-Host ""
Write-Host "[3/6] Installing SDK components..." -ForegroundColor Yellow
Write-Host "  This may take 5-10 minutes..." -ForegroundColor Gray

try {
    # Accept licenses
    Write-Host "  Accepting licenses..." -ForegroundColor Gray
    $yes = "y" * 20
    $yes | & $sdkManager --licenses --sdk_root=$sdkPath 2>&1 | Out-Null
    
    # Install platform-tools
    Write-Host "  Installing platform-tools..." -ForegroundColor Gray
    & $sdkManager "platform-tools" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    # Install platform
    Write-Host "  Installing Android Platform 33..." -ForegroundColor Gray
    & $sdkManager "platforms;android-33" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    # Install build-tools
    Write-Host "  Installing Build Tools..." -ForegroundColor Gray
    & $sdkManager "build-tools;33.0.0" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "[OK] SDK components installed" -ForegroundColor Green
    
} catch {
    Write-Host "[WARN] Some components may have issues: $_" -ForegroundColor Yellow
}

# Step 4: Verify installation
Write-Host ""
Write-Host "[4/6] Verifying installation..." -ForegroundColor Yellow
$adbPath = "$sdkPath\platform-tools\adb.exe"

if (Test-Path $adbPath) {
    Write-Host "[OK] ADB found" -ForegroundColor Green
    try {
        $adbVersion = & $adbPath version 2>&1 | Select-Object -First 1
        Write-Host "  $adbVersion" -ForegroundColor Gray
    } catch {
        Write-Host "[WARN] ADB found but may not work" -ForegroundColor Yellow
    }
} else {
    Write-Host "[ERROR] ADB not found!" -ForegroundColor Red
    Write-Host "  Trying to reinstall platform-tools..." -ForegroundColor Yellow
    & $sdkManager "platform-tools" --sdk_root=$sdkPath --force 2>&1 | Out-Null
}

# Step 5: Update environment variables
Write-Host ""
Write-Host "[5/6] Updating environment variables..." -ForegroundColor Yellow

try {
    [Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    [Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
    
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathsToAdd = @(
        "$sdkPath\platform-tools",
        "$sdkPath\tools",
        "$sdkPath\cmdline-tools\latest\bin"
    )
    
    $pathUpdated = $false
    foreach ($pathToAdd in $pathsToAdd) {
        if ($userPath -notlike "*$pathToAdd*") {
            if ($userPath) {
                $userPath += ";$pathToAdd"
            } else {
                $userPath = $pathToAdd
            }
            $pathUpdated = $true
        }
    }
    
    if ($pathUpdated) {
        [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    }
    
    # Update current session
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath
    $env:Path += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\cmdline-tools\latest\bin"
    
    Write-Host "[OK] Environment variables updated" -ForegroundColor Green
    
} catch {
    Write-Host "[WARN] Failed to update some environment variables: $_" -ForegroundColor Yellow
}

# Step 6: Setup Capacitor
Write-Host ""
Write-Host "[6/6] Setting up Capacitor..." -ForegroundColor Yellow

try {
    # Check if Capacitor is installed
    $capInstalled = Test-Path "node_modules\@capacitor"
    
    if (-not $capInstalled) {
        Write-Host "  Installing Capacitor..." -ForegroundColor Gray
        npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev 2>&1 | Out-Null
    }
    
    # Initialize Capacitor if needed
    if (-not (Test-Path "capacitor.config.json")) {
        Write-Host "  Initializing Capacitor..." -ForegroundColor Gray
        # Will be done manually or via android:setup
    }
    
    # Add Android platform if needed
    if (-not (Test-Path "android")) {
        Write-Host "  Adding Android platform..." -ForegroundColor Gray
        npx cap add android 2>&1 | Out-Null
    }
    
    Write-Host "[OK] Capacitor setup complete" -ForegroundColor Green
    
} catch {
    Write-Host "[WARN] Capacitor setup had issues: $_" -ForegroundColor Yellow
    Write-Host "  You can run: npm run android:setup" -ForegroundColor Gray
}

# Final verification
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Final Verification" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test adb in current session
$env:Path += ";$sdkPath\platform-tools"
try {
    $adbTest = & "$adbPath" version 2>&1 | Select-Object -First 1
    Write-Host "[OK] ADB working: $adbTest" -ForegroundColor Green
} catch {
    Write-Host "[WARN] ADB test failed - restart PowerShell and try: adb version" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SDK Location: $sdkPath" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Restart PowerShell for all changes to take effect!" -ForegroundColor Red
Write-Host ""
Write-Host "After restarting, verify with:" -ForegroundColor Yellow
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npm run android:check" -ForegroundColor White
Write-Host ""
Write-Host "Then proceed with:" -ForegroundColor Yellow
Write-Host "  npm run android:setup" -ForegroundColor White
Write-Host "  npm run android:build" -ForegroundColor White
Write-Host ""

