# التحقق من إعداد Google Maps API
# Check Google Maps API Setup

Write-Host "========================================" -ForegroundColor Green
Write-Host "التحقق من إعداد Google Maps API" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check .env file
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] ملف .env غير موجود!" -ForegroundColor Red
    Write-Host ""
    Write-Host "قم بإنشاء ملف .env وأضف:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ" -ForegroundColor White
    exit 1
}

# Read .env
$envContent = Get-Content $envFile -ErrorAction SilentlyContinue

# Check for API key
$hasPublicKey = $envContent | Select-String -Pattern "NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY" -Quiet
$hasLegacyKey = $envContent | Select-String -Pattern "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" -Quiet

if (-not $hasPublicKey -and -not $hasLegacyKey) {
    Write-Host "[ERROR] مفتاح API غير موجود في .env!" -ForegroundColor Red
    Write-Host ""
    Write-Host "أضف هذا السطر إلى .env:" -ForegroundColor Yellow
    Write-Host "NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ" -ForegroundColor White
    Write-Host ""
    Write-Host "أو شغّل:" -ForegroundColor Yellow
    Write-Host "npm run add-api-keys" -ForegroundColor White
    exit 1
}

Write-Host "[SUCCESS] مفتاح API موجود في .env" -ForegroundColor Green

# Extract API key
$apiKeyLine = $envContent | Select-String -Pattern "NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY|NEXT_PUBLIC_GOOGLE_MAPS_API_KEY" | Select-Object -First 1
if ($apiKeyLine) {
    $apiKey = ($apiKeyLine -split "=")[1].Trim()
    Write-Host "[INFO] المفتاح: $($apiKey.Substring(0, 10))..." -ForegroundColor Cyan
    Write-Host "[INFO] طول المفتاح: $($apiKey.Length) حرف" -ForegroundColor Cyan
    
    if ($apiKey.Length -lt 30) {
        Write-Host "[WARNING] المفتاح يبدو قصيراً. تأكد من أنه صحيح." -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. تأكد من أن dev server يعمل: npm run dev" -ForegroundColor White
Write-Host "2. افتح: http://localhost:3000/api/test-maps" -ForegroundColor White
Write-Host "3. افتح: http://localhost:3000/user" -ForegroundColor White
Write-Host "4. افتح Developer Tools (F12) واذهب إلى Console" -ForegroundColor White
Write-Host "5. ابحث عن رسائل 'Loading Google Maps' أو أخطاء" -ForegroundColor White
Write-Host ""
Write-Host "إذا استمرت المشكلة:" -ForegroundColor Yellow
Write-Host "- تحقق من Google Cloud Console" -ForegroundColor White
Write-Host "- تأكد من تفعيل Maps JavaScript API" -ForegroundColor White
Write-Host "- تأكد من إضافة localhost:3000/* في Website restrictions" -ForegroundColor White

