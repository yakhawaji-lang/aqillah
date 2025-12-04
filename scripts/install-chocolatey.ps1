# Install Chocolatey Package Manager
# تثبيت Chocolatey

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Chocolatey" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "[ERROR] This script requires Administrator privileges!" -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator" -ForegroundColor Yellow
    exit 1
}

# Check if already installed
try {
    $chocoVersion = choco --version 2>&1
    if ($chocoVersion) {
        Write-Host "[OK] Chocolatey is already installed: $chocoVersion" -ForegroundColor Green
        exit 0
    }
} catch {
    # Not installed, continue
}

Write-Host "[1] Installing Chocolatey..." -ForegroundColor Yellow
Write-Host ""

try {
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    
    Write-Host ""
    Write-Host "[OK] Chocolatey installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Refreshing environment..." -ForegroundColor Yellow
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    
    Write-Host ""
    Write-Host "You can now use:" -ForegroundColor Yellow
    Write-Host "  npm run android:auto-install" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to install Chocolatey" -ForegroundColor Red
    Write-Host "  Error: $_" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try manual installation:" -ForegroundColor Yellow
    Write-Host "  Visit: https://chocolatey.org/install" -ForegroundColor White
    Write-Host ""
}

