# Open Android Studio Download Page
# فتح صفحة تحميل Android Studio

Write-Host "Opening Android Studio download page..." -ForegroundColor Cyan
Write-Host ""

Start-Process "https://developer.android.com/studio"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Download Instructions" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Click 'Download Android Studio'" -ForegroundColor Yellow
Write-Host "2. Accept terms and download" -ForegroundColor Yellow
Write-Host "3. Run the installer" -ForegroundColor Yellow
Write-Host "4. Choose 'Standard' installation" -ForegroundColor Yellow
Write-Host "5. Wait for Android SDK to download (10-20 minutes)" -ForegroundColor Yellow
Write-Host ""
Write-Host "After installation, run:" -ForegroundColor Yellow
Write-Host "  npm run android:setup-env" -ForegroundColor White
Write-Host ""

