# Simple Android SDK Installation
# تثبيت بسيط لـ Android SDK

$ErrorActionPreference = "Continue"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Android SDK" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sdkPath = "C:\Android\Sdk"
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

# Create directories
Write-Host "[1] Creating directories..." -ForegroundColor Yellow
$dirs = @(
    "$sdkPath",
    "$sdkPath\cmdline-tools",
    "$sdkPath\cmdline-tools\latest"
)

foreach ($dir in $dirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  [OK] Created: $dir" -ForegroundColor Green
    }
}

# Download Command Line Tools
Write-Host ""
Write-Host "[2] Downloading Command Line Tools..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

$url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$zip = "$env:TEMP\cmdline-tools.zip"
$extract = "$sdkPath\cmdline-tools"

try {
    Write-Host "  Downloading..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 300
    
    Write-Host "  Extracting..." -ForegroundColor Gray
    Expand-Archive -Path $zip -DestinationPath $extract -Force
    
    # Move to latest folder
    $cmdlineDir = Get-ChildItem "$extract\cmdline-tools" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmdlineDir) {
        $latestPath = "$extract\latest"
        if (Test-Path $latestPath) {
            Remove-Item $latestPath -Recurse -Force
        }
        Move-Item $cmdlineDir.FullName $latestPath -Force
        Write-Host "  [OK] Extracted successfully" -ForegroundColor Green
    }
    
    Remove-Item $zip -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "  [FAIL] Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Please download manually:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://developer.android.com/studio#command-tools" -ForegroundColor White
    Write-Host "  2. Download 'Command line tools only' for Windows" -ForegroundColor White
    Write-Host "  3. Extract to: $extract\latest" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Install SDK components
Write-Host ""
Write-Host "[3] Installing SDK components..." -ForegroundColor Yellow

$sdkManager = "$sdkPath\cmdline-tools\latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "  [ERROR] sdkmanager not found!" -ForegroundColor Red
    Write-Host "  Please extract Command Line Tools to: $extract\latest" -ForegroundColor Yellow
    exit 1
}

try {
    Write-Host "  Accepting licenses..." -ForegroundColor Gray
    $yes = "y" * 10
    $yes | & $sdkManager --licenses --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  Installing platform-tools..." -ForegroundColor Gray
    & $sdkManager "platform-tools" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  Installing Android Platform 33..." -ForegroundColor Gray
    & $sdkManager "platforms;android-33" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  Installing Build Tools..." -ForegroundColor Gray
    & $sdkManager "build-tools;33.0.0" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  [OK] SDK components installed" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARN] Installation may have issues: $_" -ForegroundColor Yellow
}

# Update environment
Write-Host ""
Write-Host "[4] Updating environment variables..." -ForegroundColor Yellow

try {
    [Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    [Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
    
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
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
    
    [Environment]::SetEnvironmentVariable("Path", $userPath, "User")
    
    # Update current session
    $env:Path += ";$sdkPath\platform-tools;$sdkPath\tools;$sdkPath\cmdline-tools\latest\bin"
    
    Write-Host "  [OK] Environment variables updated" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARN] Failed to update environment: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installation Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "SDK Location: $sdkPath" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANT: Restart PowerShell for changes to take effect!" -ForegroundColor Red
Write-Host ""
Write-Host "After restarting, test with:" -ForegroundColor Yellow
Write-Host "  adb version" -ForegroundColor White
Write-Host "  npm run android:check" -ForegroundColor White
Write-Host ""

