# Auto Install All Android Requirements
# تثبيت تلقائي لجميع متطلبات Android

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Auto Install Android Requirements" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Right-click PowerShell -> Run as Administrator" -ForegroundColor Yellow
    exit 1
}

$installed = @()
$failed = @()

# Check for winget
Write-Host "[1] Checking for winget..." -ForegroundColor Yellow
$hasWinget = $false
try {
    $wingetVersion = winget --version 2>&1
    if ($wingetVersion) {
        $hasWinget = $true
        Write-Host "[OK] winget is available" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] winget not found" -ForegroundColor Yellow
}

# Check for Chocolatey
Write-Host "[2] Checking for Chocolatey..." -ForegroundColor Yellow
$hasChoco = $false
try {
    $chocoVersion = choco --version 2>&1
    if ($chocoVersion) {
        $hasChoco = $true
        Write-Host "[OK] Chocolatey is available" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Chocolatey not found" -ForegroundColor Yellow
}

if (-not $hasWinget -and -not $hasChoco) {
    Write-Host ""
    Write-Host "[ERROR] No package manager found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install one of the following:" -ForegroundColor Yellow
    Write-Host "  1. winget (Windows Package Manager) - Usually pre-installed on Windows 10/11" -ForegroundColor White
    Write-Host "  2. Chocolatey - Install from: https://chocolatey.org/install" -ForegroundColor White
    Write-Host ""
    Write-Host "Or install manually:" -ForegroundColor Yellow
    Write-Host "  npm run android:download-java" -ForegroundColor White
    Write-Host "  npm run android:download-studio" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Requirements" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install Java JDK
Write-Host "[3] Installing Java JDK 17..." -ForegroundColor Yellow
try {
    if ($hasWinget) {
        Write-Host "  Using winget..." -ForegroundColor Gray
        winget install --id EclipseAdoptium.Temurin.17.JDK -e --accept-package-agreements --accept-source-agreements
        $installed += "Java JDK 17"
        Write-Host "[OK] Java JDK 17 installed" -ForegroundColor Green
    } elseif ($hasChoco) {
        Write-Host "  Using Chocolatey..." -ForegroundColor Gray
        choco install temurin17jdk -y
        $installed += "Java JDK 17"
        Write-Host "[OK] Java JDK 17 installed" -ForegroundColor Green
    }
} catch {
    $failed += "Java JDK 17"
    Write-Host "[FAIL] Failed to install Java JDK 17" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    Write-Host "  Try manual installation: npm run android:download-java" -ForegroundColor Yellow
}

# Install Android Studio
Write-Host ""
Write-Host "[4] Installing Android Studio..." -ForegroundColor Yellow
Write-Host "  Note: This is a large download (1GB+) and may take 10-20 minutes" -ForegroundColor Gray
try {
    if ($hasWinget) {
        Write-Host "  Using winget..." -ForegroundColor Gray
        winget install --id Google.AndroidStudio -e --accept-package-agreements --accept-source-agreements
        $installed += "Android Studio"
        Write-Host "[OK] Android Studio installed" -ForegroundColor Green
    } elseif ($hasChoco) {
        Write-Host "  Using Chocolatey..." -ForegroundColor Gray
        choco install androidstudio -y
        $installed += "Android Studio"
        Write-Host "[OK] Android Studio installed" -ForegroundColor Green
    }
} catch {
    $failed += "Android Studio"
    Write-Host "[FAIL] Failed to install Android Studio" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    Write-Host "  Try manual installation: npm run android:download-studio" -ForegroundColor Yellow
}

# Wait a bit for installations to complete
if ($installed.Count -gt 0) {
    Write-Host ""
    Write-Host "Waiting 10 seconds for installations to complete..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
}

# Setup Environment Variables
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setting Up Environment Variables" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "[5] Configuring environment variables..." -ForegroundColor Yellow
    & "$PSScriptRoot\setup-env-variables.ps1"
    Write-Host "[OK] Environment variables configured" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Failed to configure environment variables automatically" -ForegroundColor Yellow
    Write-Host "  Run manually: npm run android:setup-env" -ForegroundColor White
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installation Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($installed.Count -gt 0) {
    Write-Host "[SUCCESS] Installed:" -ForegroundColor Green
    foreach ($item in $installed) {
        Write-Host "  ✓ $item" -ForegroundColor Green
    }
}

if ($failed.Count -gt 0) {
    Write-Host ""
    Write-Host "[FAILED] Failed to install:" -ForegroundColor Red
    foreach ($item in $failed) {
        Write-Host "  ✗ $item" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please install manually:" -ForegroundColor Yellow
    Write-Host "  npm run android:download-java" -ForegroundColor White
    Write-Host "  npm run android:download-studio" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Next Steps" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Restart PowerShell (important!)" -ForegroundColor Yellow
Write-Host "2. Verify installation:" -ForegroundColor Yellow
Write-Host "   npm run android:check" -ForegroundColor White
Write-Host ""
Write-Host "3. If Android Studio was installed, open it once to:" -ForegroundColor Yellow
Write-Host "   - Complete initial setup" -ForegroundColor White
Write-Host "   - Download Android SDK components" -ForegroundColor White
Write-Host ""
Write-Host "4. After Android Studio setup, configure environment:" -ForegroundColor Yellow
Write-Host "   npm run android:setup-env" -ForegroundColor White
Write-Host ""
Write-Host "5. Then proceed with Android setup:" -ForegroundColor Yellow
Write-Host '   npm run android:setup' -ForegroundColor White
Write-Host ""

