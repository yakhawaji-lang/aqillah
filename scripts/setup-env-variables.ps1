# Setup Environment Variables for Android Development
# إعداد متغيرات البيئة لتطوير Android

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Environment Variables Setup" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[WARN] This script needs Administrator privileges" -ForegroundColor Yellow
    Write-Host "Please run PowerShell as Administrator and try again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Or follow manual steps:" -ForegroundColor Cyan
    Write-Host "  1. Win + R -> sysdm.cpl -> Advanced -> Environment Variables" -ForegroundColor White
    Write-Host "  2. Add JAVA_HOME and ANDROID_HOME" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Find Java JDK
Write-Host "[1] Looking for Java JDK..." -ForegroundColor Yellow

# Search patterns for Java installations
$javaSearchPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files (x86)\Java\jdk-*"
)

$javaHome = $null

# Try to find Java by searching directories
foreach ($pattern in $javaSearchPaths) {
    $parentDir = Split-Path $pattern -Parent
    $filter = Split-Path $pattern -Leaf
    
    if (Test-Path $parentDir) {
        $foundDirs = Get-ChildItem -Path $parentDir -Filter $filter -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        foreach ($dir in $foundDirs) {
            $javaExe = Join-Path $dir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                $javaHome = $dir.FullName
                Write-Host "[OK] Found Java at: $javaHome" -ForegroundColor Green
                break
            }
        }
        if ($javaHome) { break }
    }
}

# If still not found, try checking JAVA_HOME environment variable
if (-not $javaHome -and $env:JAVA_HOME) {
    if (Test-Path $env:JAVA_HOME) {
        $javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
        if (Test-Path $javaExe) {
            $javaHome = $env:JAVA_HOME
            Write-Host "[OK] Found Java from JAVA_HOME: $javaHome" -ForegroundColor Green
        }
    }
}

# If still not found, try common Eclipse Adoptium path
if (-not $javaHome) {
    $adoptiumPath = "C:\Program Files\Eclipse Adoptium"
    if (Test-Path $adoptiumPath) {
        $jdkDirs = Get-ChildItem -Path $adoptiumPath -Filter "jdk-*" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
        foreach ($dir in $jdkDirs) {
            $javaExe = Join-Path $dir.FullName "bin\java.exe"
            if (Test-Path $javaExe) {
                $javaHome = $dir.FullName
                Write-Host "[OK] Found Java at: $javaHome" -ForegroundColor Green
                break
            }
        }
    }
}

if (-not $javaHome) {
    Write-Host "[WARN] Java JDK not found automatically" -ForegroundColor Yellow
    Write-Host "Searching in: C:\Program Files\Eclipse Adoptium\" -ForegroundColor Gray
    $javaHome = Read-Host "Enter Java JDK path (e.g., C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot)"
    if (-not (Test-Path $javaHome)) {
        Write-Host "[ERROR] Path does not exist!" -ForegroundColor Red
        Write-Host "Please check the path and try again" -ForegroundColor Yellow
        exit 1
    }
    $javaExe = Join-Path $javaHome "bin\java.exe"
    if (-not (Test-Path $javaExe)) {
        Write-Host "[ERROR] java.exe not found in that path!" -ForegroundColor Red
        exit 1
    }
}

# Find Android SDK
Write-Host ""
Write-Host "[2] Looking for Android SDK..." -ForegroundColor Yellow
$sdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

$androidHome = $null
foreach ($path in $sdkPaths) {
    if (Test-Path $path) {
        $adbExe = Join-Path $path "platform-tools\adb.exe"
        if (Test-Path $adbExe) {
            $androidHome = $path
            Write-Host "[OK] Found Android SDK at: $androidHome" -ForegroundColor Green
            break
        }
    }
}

if (-not $androidHome) {
    Write-Host "[WARN] Android SDK not found in common locations" -ForegroundColor Yellow
    $androidHome = Read-Host "Enter Android SDK path (e.g., C:\Users\$env:USERNAME\AppData\Local\Android\Sdk)"
    if (-not (Test-Path $androidHome)) {
        Write-Host "[ERROR] Path does not exist!" -ForegroundColor Red
        Write-Host "Make sure Android Studio is installed and SDK is downloaded" -ForegroundColor Yellow
        exit 1
    }
}

# Set Environment Variables
Write-Host ""
Write-Host "[3] Setting environment variables..." -ForegroundColor Yellow

try {
    # Set JAVA_HOME
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "Machine")
    Write-Host "[OK] JAVA_HOME set to: $javaHome" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $androidHome, "Machine")
    Write-Host "[OK] ANDROID_HOME set to: $androidHome" -ForegroundColor Green
    
    # Update current session
    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $androidHome
    
    # Add to Path
    $path = [Environment]::GetEnvironmentVariable("Path", "Machine")
    $pathsToAdd = @(
        "%JAVA_HOME%\bin",
        "%ANDROID_HOME%\platform-tools",
        "%ANDROID_HOME%\tools",
        "%ANDROID_HOME%\tools\bin"
    )
    
    $pathUpdated = $false
    foreach ($pathToAdd in $pathsToAdd) {
        if ($path -notlike "*$pathToAdd*") {
            $path += ";$pathToAdd"
            $pathUpdated = $true
        }
    }
    
    if ($pathUpdated) {
        [Environment]::SetEnvironmentVariable("Path", $path, "Machine")
        Write-Host "[OK] Added paths to PATH variable" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Environment variables have been set:" -ForegroundColor Yellow
    Write-Host "  JAVA_HOME = $javaHome" -ForegroundColor White
    Write-Host "  ANDROID_HOME = $androidHome" -ForegroundColor White
    Write-Host ""
    Write-Host "IMPORTANT: Please restart PowerShell for changes to take effect!" -ForegroundColor Red
    Write-Host ""
    Write-Host "After restarting, verify with:" -ForegroundColor Yellow
    Write-Host "  npm run android:check" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to set environment variables: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please set them manually:" -ForegroundColor Yellow
    Write-Host "  1. Win + R -> sysdm.cpl -> Advanced -> Environment Variables" -ForegroundColor White
    Write-Host "  2. Add JAVA_HOME = $javaHome" -ForegroundColor White
    Write-Host "  3. Add ANDROID_HOME = $androidHome" -ForegroundColor White
    Write-Host "  4. Add to Path: %JAVA_HOME%\bin, %ANDROID_HOME%\platform-tools" -ForegroundColor White
}

