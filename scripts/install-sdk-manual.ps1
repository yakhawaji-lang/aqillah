# Manual Android SDK Installation
# تثبيت Android SDK يدوياً

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Manual Android SDK Installation" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$sdkPath = "C:\Android\Sdk"

# Create SDK directory structure
Write-Host "[1] Creating SDK directory structure..." -ForegroundColor Yellow
$directories = @(
    "$sdkPath",
    "$sdkPath\cmdline-tools",
    "$sdkPath\platforms",
    "$sdkPath\platform-tools",
    "$sdkPath\build-tools"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  [OK] Created: $dir" -ForegroundColor Green
    } else {
        Write-Host "  [OK] Exists: $dir" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "[2] Downloading Command Line Tools..." -ForegroundColor Yellow
Write-Host "  This may take a few minutes..." -ForegroundColor Gray

$cmdlineToolsUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$cmdlineToolsZip = "$env:TEMP\commandlinetools-win.zip"
$cmdlineToolsDir = "$sdkPath\cmdline-tools"

try {
    # Download using Invoke-WebRequest
    Write-Host "  Downloading from: $cmdlineToolsUrl" -ForegroundColor Gray
    Invoke-WebRequest -Uri $cmdlineToolsUrl -OutFile $cmdlineToolsZip -UseBasicParsing
    
    Write-Host "  [OK] Download complete" -ForegroundColor Green
    
    # Extract
    Write-Host "  Extracting..." -ForegroundColor Gray
    Expand-Archive -Path $cmdlineToolsZip -DestinationPath $cmdlineToolsDir -Force
    
    # Move to latest folder
    $extractedDir = Get-ChildItem -Path $cmdlineToolsDir -Directory | Select-Object -First 1
    if ($extractedDir) {
        $latestDir = Join-Path $cmdlineToolsDir "latest"
        if (Test-Path $latestDir) {
            Remove-Item $latestDir -Recurse -Force
        }
        Move-Item -Path $extractedDir.FullName -Destination $latestDir -Force
        Write-Host "  [OK] Extracted to: $latestDir" -ForegroundColor Green
    }
    
    # Cleanup
    Remove-Item $cmdlineToolsZip -Force -ErrorAction SilentlyContinue
    
} catch {
    Write-Host "  [FAIL] Download failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "  Manual download:" -ForegroundColor Yellow
    Write-Host "  1. Visit: https://developer.android.com/studio#command-tools" -ForegroundColor White
    Write-Host "  2. Download 'Command line tools only' for Windows" -ForegroundColor White
    Write-Host "  3. Extract to: $cmdlineToolsDir\latest" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "[3] Installing SDK components..." -ForegroundColor Yellow

$sdkManager = Join-Path $cmdlineToolsDir "latest\bin\sdkmanager.bat"

if (-not (Test-Path $sdkManager)) {
    Write-Host "  [ERROR] sdkmanager not found!" -ForegroundColor Red
    Write-Host "  Please download Command Line Tools manually" -ForegroundColor Yellow
    exit 1
}

# Accept licenses first
Write-Host "  Accepting licenses..." -ForegroundColor Gray
$env:ANDROID_HOME = $sdkPath
$env:ANDROID_SDK_ROOT = $sdkPath

try {
    # Accept all licenses
    echo "y" | & $sdkManager --licenses 2>&1 | Out-Null
    
    # Install essential components
    Write-Host "  Installing platform-tools..." -ForegroundColor Gray
    & $sdkManager "platform-tools" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  Installing Android SDK Platform 33..." -ForegroundColor Gray
    & $sdkManager "platforms;android-33" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  Installing Build Tools..." -ForegroundColor Gray
    & $sdkManager "build-tools;33.0.0" --sdk_root=$sdkPath 2>&1 | Out-Null
    
    Write-Host "  [OK] SDK components installed" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARN] Some components may not have installed" -ForegroundColor Yellow
    Write-Host "  Error: $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[4] Updating environment variables..." -ForegroundColor Yellow

try {
    [Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkPath, 'User')
    [Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkPath, 'User')
    $env:ANDROID_HOME = $sdkPath
    $env:ANDROID_SDK_ROOT = $sdkPath
    
    # Update PATH
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
    
    Write-Host "  [OK] Environment variables updated" -ForegroundColor Green
    
} catch {
    Write-Host "  [WARN] Failed to update environment variables" -ForegroundColor Yellow
    Write-Host "  Run manually: npm run android:setup-env-user" -ForegroundColor Gray
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
Write-Host "After restarting, verify with:" -ForegroundColor Yellow
Write-Host "  npm run android:check" -ForegroundColor White
Write-Host "  adb version" -ForegroundColor White
Write-Host ""

