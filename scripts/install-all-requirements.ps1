# Install All Android Requirements Automatically
# تثبيت تلقائي لجميع متطلبات Android

param(
    [switch]$SkipAdminCheck = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Auto Install Android Requirements" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin -and -not $SkipAdminCheck) {
    Write-Host "[WARN] Administrator privileges required!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Attempting to restart as Administrator..." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
    
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb RunAs -ArgumentList "-ExecutionPolicy Bypass -File `"$scriptPath`" -SkipAdminCheck"
    exit
}

$installed = @()
$failed = @()

# Check for winget
Write-Host "[1] Checking package managers..." -ForegroundColor Yellow
$hasWinget = $false
$hasChoco = $false

try {
    $wingetVersion = winget --version 2>&1
    if ($wingetVersion) {
        $hasWinget = $true
        Write-Host "  [OK] winget available" -ForegroundColor Green
    }
} catch {
    Write-Host "  [SKIP] winget not found" -ForegroundColor Gray
}

try {
    $chocoVersion = choco --version 2>&1
    if ($chocoVersion) {
        $hasChoco = $true
        Write-Host "  [OK] Chocolatey available" -ForegroundColor Green
    }
} catch {
    Write-Host "  [SKIP] Chocolatey not found" -ForegroundColor Gray
}

if (-not $hasWinget -and -not $hasChoco) {
    Write-Host ""
    Write-Host "[ERROR] No package manager found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  1. Install Chocolatey: npm run android:install-choco" -ForegroundColor White
    Write-Host "  2. Install manually: npm run android:download-java" -ForegroundColor White
    Write-Host "  3. winget should be pre-installed on Windows 10/11" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Java JDK 17" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install Java JDK
try {
    if ($hasWinget) {
        Write-Host "Installing via winget..." -ForegroundColor Yellow
        winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-package-agreements --accept-source-agreements --silent
        if ($LASTEXITCODE -eq 0) {
            $installed += "Java JDK 17"
            Write-Host "[OK] Java JDK 17 installed successfully" -ForegroundColor Green
        } else {
            throw "winget installation failed"
        }
    } elseif ($hasChoco) {
        Write-Host "Installing via Chocolatey..." -ForegroundColor Yellow
        choco install temurin17jdk -y --force
        if ($LASTEXITCODE -eq 0) {
            $installed += "Java JDK 17"
            Write-Host "[OK] Java JDK 17 installed successfully" -ForegroundColor Green
        } else {
            throw "Chocolatey installation failed"
        }
    }
} catch {
    $failed += "Java JDK 17"
    Write-Host "[FAIL] Failed to install Java JDK 17" -ForegroundColor Red
    Write-Host "  Try manual: npm run android:download-java" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Android Studio" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Note: Large download (1GB+), may take 10-20 minutes" -ForegroundColor Yellow
Write-Host ""

# Install Android Studio
try {
    if ($hasWinget) {
        Write-Host "Installing via winget..." -ForegroundColor Yellow
        winget install --id Google.AndroidStudio -e --accept-package-agreements --accept-source-agreements --silent
        if ($LASTEXITCODE -eq 0) {
            $installed += "Android Studio"
            Write-Host "[OK] Android Studio installed successfully" -ForegroundColor Green
        } else {
            throw "winget installation failed"
        }
    } elseif ($hasChoco) {
        Write-Host "Installing via Chocolatey..." -ForegroundColor Yellow
        choco install androidstudio -y --force
        if ($LASTEXITCODE -eq 0) {
            $installed += "Android Studio"
            Write-Host "[OK] Android Studio installed successfully" -ForegroundColor Green
        } else {
            throw "Chocolatey installation failed"
        }
    }
} catch {
    $failed += "Android Studio"
    Write-Host "[FAIL] Failed to install Android Studio" -ForegroundColor Red
    Write-Host "  Try manual: npm run android:download-studio" -ForegroundColor Yellow
}

# Wait for installations
if ($installed.Count -gt 0) {
    Write-Host ""
    Write-Host "Waiting 15 seconds for installations to complete..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

# Setup Environment Variables
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Configuring Environment" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    $setupScript = Join-Path $PSScriptRoot "setup-env-variables.ps1"
    if (Test-Path $setupScript) {
        & $setupScript
    } else {
        Write-Host "[WARN] Setup script not found" -ForegroundColor Yellow
        Write-Host "  Run manually: npm run android:setup-env" -ForegroundColor White
    }
} catch {
    Write-Host "[WARN] Failed to configure environment automatically" -ForegroundColor Yellow
    Write-Host "  Run manually: npm run android:setup-env" -ForegroundColor White
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($installed.Count -gt 0) {
    Write-Host "[SUCCESS] Installed:" -ForegroundColor Green
    foreach ($item in $installed) {
        Write-Host "  + $item" -ForegroundColor Green
    }
    Write-Host ""
}

if ($failed.Count -gt 0) {
    Write-Host "[FAILED] Failed:" -ForegroundColor Red
    foreach ($item in $failed) {
        Write-Host "  - $item" -ForegroundColor Red
    }
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Next Steps" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. RESTART PowerShell (important!)" -ForegroundColor Yellow
Write-Host "2. Verify installation:" -ForegroundColor Yellow
Write-Host '   npm run android:check' -ForegroundColor White
Write-Host ""
Write-Host "3. If Android Studio installed, open it once to:" -ForegroundColor Yellow
Write-Host "   - Complete initial setup" -ForegroundColor White
Write-Host "   - Download Android SDK (10-20 min)" -ForegroundColor White
Write-Host ""
Write-Host "4. After Android Studio setup:" -ForegroundColor Yellow
Write-Host '   npm run android:setup-env' -ForegroundColor White
Write-Host ""
Write-Host "5. Then proceed:" -ForegroundColor Yellow
Write-Host '   npm run android:setup' -ForegroundColor White
Write-Host ""

