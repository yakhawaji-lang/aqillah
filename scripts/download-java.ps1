# Open Java JDK Download Page
# فتح صفحة تحميل Java JDK

Write-Host "Opening Java JDK download page..." -ForegroundColor Cyan
Write-Host ""

# Open Eclipse Temurin (Recommended)
Write-Host "[1] Opening Eclipse Temurin (Recommended)..." -ForegroundColor Yellow
Start-Process "https://adoptium.net/temurin/releases/?version=17"

Start-Sleep -Seconds 2

# Open Oracle JDK (Alternative)
Write-Host "[2] Opening Oracle JDK (Alternative)..." -ForegroundColor Yellow
Start-Process "https://www.oracle.com/java/technologies/downloads/#java17"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Download Instructions" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "For Eclipse Temurin (Recommended):" -ForegroundColor Yellow
Write-Host "  1. Select: JDK 17" -ForegroundColor White
Write-Host "  2. Select: Windows x64" -ForegroundColor White
Write-Host "  3. Select: .msi Installer" -ForegroundColor White
Write-Host "  4. Click Download" -ForegroundColor White
Write-Host ""
Write-Host "After installation, run:" -ForegroundColor Yellow
Write-Host "  npm run android:setup-env" -ForegroundColor White
Write-Host ""

