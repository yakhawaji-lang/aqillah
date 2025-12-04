# Android Requirements Installation Script for Aqillah
# سكريبت تثبيت متطلبات Android

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Android Requirements Check" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = @()
$warnings = @()

# 1. Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeMajor = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($nodeMajor -ge 18) {
        Write-Host "[OK] Node.js installed: $nodeVersion" -ForegroundColor Green
    } else {
        $warnings += "Node.js version $nodeVersion is old (recommended 18+)"
        Write-Host "[WARN] Node.js: $nodeVersion (recommended 18+)" -ForegroundColor Yellow
    }
} catch {
    $errors += "Node.js is not installed"
    Write-Host "[FAIL] Node.js is not installed!" -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org/" -ForegroundColor Gray
}

# 2. Check npm
Write-Host "[2/4] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm installed: $npmVersion" -ForegroundColor Green
} catch {
    $errors += "npm is not installed"
    Write-Host "[FAIL] npm is not installed!" -ForegroundColor Red
}

# 3. Check Java JDK
Write-Host "[3/4] Checking Java JDK..." -ForegroundColor Yellow
try {
    $javaOutput = java -version 2>&1 | Out-String
    if ($javaOutput -match 'version "(\d+)') {
        $javaMajor = [int]$matches[1]
        if ($javaMajor -ge 17) {
            Write-Host "[OK] Java JDK installed (version $javaMajor)" -ForegroundColor Green
            
            if ($env:JAVA_HOME) {
                Write-Host "  [OK] JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
            } else {
                $warnings += "JAVA_HOME is not set"
                Write-Host "  [WARN] JAVA_HOME is not set" -ForegroundColor Yellow
                Write-Host "    Add JAVA_HOME to environment variables" -ForegroundColor Gray
            }
        } else {
            $warnings += "Java JDK version $javaMajor is old (recommended 17+)"
            Write-Host "[WARN] Java JDK: version $javaMajor (recommended 17+)" -ForegroundColor Yellow
        }
    }
} catch {
    $errors += "Java JDK is not installed"
    Write-Host "[FAIL] Java JDK is not installed!" -ForegroundColor Red
    Write-Host "  Download from: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Gray
    Write-Host "  Or use: https://adoptium.net/" -ForegroundColor Gray
}

# 4. Check Android SDK
Write-Host "[4/4] Checking Android SDK..." -ForegroundColor Yellow
$androidSdkFound = $false

$commonSdkPaths = @(
    "$env:LOCALAPPDATA\Android\Sdk",
    "$env:USERPROFILE\AppData\Local\Android\Sdk",
    "C:\Android\Sdk"
)

if ($env:ANDROID_HOME) {
    $commonSdkPaths = @($env:ANDROID_HOME) + $commonSdkPaths
}

foreach ($path in $commonSdkPaths) {
    if ($path -and (Test-Path $path)) {
        $platformTools = Join-Path $path "platform-tools\adb.exe"
        if (Test-Path $platformTools) {
            $androidSdkFound = $true
            Write-Host "[OK] Android SDK found: $path" -ForegroundColor Green
            
            if ($env:ANDROID_HOME) {
                Write-Host "  [OK] ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Green
            } else {
                $warnings += "ANDROID_HOME is not set"
                Write-Host "  [WARN] ANDROID_HOME is not set" -ForegroundColor Yellow
                Write-Host "    Add ANDROID_HOME=$path to environment variables" -ForegroundColor Gray
            }
            
            try {
                $adbCheck = & "$platformTools" version 2>&1
                if ($adbCheck) {
                    Write-Host "  [OK] ADB is available" -ForegroundColor Green
                }
            } catch {
                Write-Host "  [WARN] ADB is not available" -ForegroundColor Yellow
            }
            break
        }
    }
}

if (-not $androidSdkFound) {
    $warnings += "Android SDK not found"
    Write-Host "[WARN] Android SDK not found!" -ForegroundColor Yellow
    Write-Host "  Download Android Studio from: https://developer.android.com/studio" -ForegroundColor Gray
    Write-Host "  Android SDK comes with Android Studio automatically" -ForegroundColor Gray
}

# Check Android Studio
Write-Host ""
Write-Host "[Extra] Checking Android Studio..." -ForegroundColor Yellow
$studioPaths = @(
    "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
    "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
    "$env:LOCALAPPDATA\Programs\Android\Android Studio\bin\studio64.exe"
)

$studioFound = $false
foreach ($path in $studioPaths) {
    if (Test-Path $path) {
        $studioFound = $true
        Write-Host "[OK] Android Studio found: $path" -ForegroundColor Green
        break
    }
}

if (-not $studioFound) {
    $warnings += "Android Studio is not installed"
    Write-Host "[WARN] Android Studio is not installed!" -ForegroundColor Yellow
    Write-Host "  Download from: https://developer.android.com/studio" -ForegroundColor Gray
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($errors.Count -eq 0 -and $warnings.Count -eq 0) {
    Write-Host "[SUCCESS] All requirements are installed and configured correctly!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now proceed to:" -ForegroundColor Yellow
    Write-Host "  npm run android:setup" -ForegroundColor White
} elseif ($errors.Count -eq 0) {
    Write-Host "[WARN] Some requirements need configuration:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "  - $warning" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "You can proceed, but it's recommended to fix the warnings above" -ForegroundColor Gray
} else {
    Write-Host "[ERROR] Some requirements are not installed:" -ForegroundColor Red
    foreach ($err in $errors) {
        Write-Host "  - $err" -ForegroundColor Red
    }
    if ($warnings.Count -gt 0) {
        Write-Host ""
        Write-Host "[WARN] Additional warnings:" -ForegroundColor Yellow
        foreach ($warning in $warnings) {
            Write-Host "  - $warning" -ForegroundColor Yellow
        }
    }
    Write-Host ""
    Write-Host "Please install the missing requirements first" -ForegroundColor Red
    Write-Host "See android-requirements.md for details" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Show environment variables setup instructions
if ($warnings -match "JAVA_HOME|ANDROID_HOME") {
    Write-Host ""
    Write-Host "Environment Variables Setup Instructions:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Open System Properties:" -ForegroundColor Yellow
    Write-Host "   Win + R -> sysdm.cpl -> Advanced -> Environment Variables" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Add new variables:" -ForegroundColor Yellow
    if ($warnings -match "JAVA_HOME") {
        Write-Host "   JAVA_HOME = C:\Program Files\Java\jdk-17" -ForegroundColor Gray
    }
    if ($warnings -match "ANDROID_HOME") {
        Write-Host "   ANDROID_HOME = $env:LOCALAPPDATA\Android\Sdk" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "3. Add to Path:" -ForegroundColor Yellow
    Write-Host "   %JAVA_HOME%\bin" -ForegroundColor Gray
    Write-Host "   %ANDROID_HOME%\platform-tools" -ForegroundColor Gray
    Write-Host "   %ANDROID_HOME%\tools" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Restart PowerShell after modification" -ForegroundColor Yellow
}
