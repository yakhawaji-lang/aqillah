# Setup Environment Variables for Current User (No Admin Required)
# إعداد متغيرات البيئة للمستخدم الحالي (بدون صلاحيات المسؤول)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Environment Variables Setup (User)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find Java JDK
Write-Host "[1] Looking for Java JDK..." -ForegroundColor Yellow

$javaSearchPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-*",
    "C:\Program Files\Java\jdk-*",
    "C:\Program Files (x86)\Java\jdk-*"
)

$javaHome = $null

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

if (-not $javaHome) {
    Write-Host "[WARN] Java JDK not found automatically" -ForegroundColor Yellow
    $javaHome = Read-Host "Enter Java JDK path"
    if (-not (Test-Path $javaHome)) {
        Write-Host "[ERROR] Path does not exist!" -ForegroundColor Red
        exit 1
    }
}

# Find Android SDK
Write-Host ""
Write-Host "[2] Looking for Android SDK..." -ForegroundColor Yellow
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "[OK] Android SDK path: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "[WARN] Android SDK not found yet" -ForegroundColor Yellow
    Write-Host "  This is normal - Android SDK downloads when you first open Android Studio" -ForegroundColor Gray
    $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
    Write-Host "  Will set to: $sdkPath" -ForegroundColor Gray
}

# Set Environment Variables for Current User
Write-Host ""
Write-Host "[3] Setting environment variables (User scope)..." -ForegroundColor Yellow

try {
    # Set JAVA_HOME
    [Environment]::SetEnvironmentVariable("JAVA_HOME", $javaHome, "User")
    Write-Host "[OK] JAVA_HOME set to: $javaHome" -ForegroundColor Green
    
    # Set ANDROID_HOME
    [Environment]::SetEnvironmentVariable("ANDROID_HOME", $sdkPath, "User")
    Write-Host "[OK] ANDROID_HOME set to: $sdkPath" -ForegroundColor Green
    
    # Update current session
    $env:JAVA_HOME = $javaHome
    $env:ANDROID_HOME = $sdkPath
    
    # Add to Path (User scope)
    $userPath = [Environment]::GetEnvironmentVariable("Path", "User")
    $pathsToAdd = @(
        "%JAVA_HOME%\bin",
        "%ANDROID_HOME%\platform-tools",
        "%ANDROID_HOME%\tools",
        "%ANDROID_HOME%\tools\bin"
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
        Write-Host "[OK] Added paths to PATH variable" -ForegroundColor Green
    } else {
        Write-Host "[INFO] Paths already exist in PATH" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Setup Complete!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Environment variables have been set (User scope):" -ForegroundColor Yellow
    Write-Host "  JAVA_HOME = $javaHome" -ForegroundColor White
    Write-Host "  ANDROID_HOME = $sdkPath" -ForegroundColor White
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
    Write-Host "  2. Under 'User variables', add:" -ForegroundColor White
    Write-Host "     JAVA_HOME = $javaHome" -ForegroundColor White
    Write-Host "     ANDROID_HOME = $sdkPath" -ForegroundColor White
    Write-Host "  3. Add to User Path: %JAVA_HOME%\bin, %ANDROID_HOME%\platform-tools" -ForegroundColor White
}

