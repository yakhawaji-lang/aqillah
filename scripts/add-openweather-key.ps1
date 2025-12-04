# PowerShell Script لإضافة OpenWeather API Key
# Add OpenWeather API Key to .env file

$envFile = ".env"

# التحقق من وجود ملف .env
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️ ملف .env غير موجود. سيتم إنشاؤه الآن..." -ForegroundColor Yellow
    New-Item -ItemType File -Path $envFile -Force | Out-Null
}

Write-Host "`n🌤️ إضافة OpenWeather API Key" -ForegroundColor Cyan
Write-Host "=" * 50 -ForegroundColor Cyan

# التحقق من وجود API Key مسبقاً
$existingKey = Get-Content $envFile -ErrorAction SilentlyContinue | Select-String -Pattern "OPENWEATHER_API_KEY"
if ($existingKey) {
    Write-Host "`n⚠️ يوجد OpenWeather API Key مسبقاً:" -ForegroundColor Yellow
    Write-Host $existingKey -ForegroundColor Gray
    $replace = Read-Host "هل تريد استبداله؟ (y/n)"
    if ($replace -eq "y" -or $replace -eq "Y") {
        # حذف السطر القديم
        (Get-Content $envFile) | Where-Object { $_ -notmatch "OPENWEATHER_API_KEY" } | Set-Content $envFile
    } else {
        Write-Host "❌ تم الإلغاء" -ForegroundColor Red
        exit
    }
}

# طلب API Key من المستخدم
Write-Host "`n📝 أدخل OpenWeather API Key:" -ForegroundColor Cyan
Write-Host "للحصول على API Key:" -ForegroundColor Yellow
Write-Host "1. اذهب إلى: https://openweathermap.org/api" -ForegroundColor White
Write-Host "2. سجّل حساب جديد (مجاني)" -ForegroundColor White
Write-Host "3. اذهب إلى: https://home.openweathermap.org/api_keys" -ForegroundColor White
Write-Host "4. أنشئ API Key جديد" -ForegroundColor White
Write-Host ""

$apiKey = Read-Host "أدخل OpenWeather API Key"

if ([string]::IsNullOrWhiteSpace($apiKey)) {
    Write-Host "❌ لم يتم إدخال API Key" -ForegroundColor Red
    exit 1
}

# إضافة API Key إلى ملف .env
Add-Content -Path $envFile -Value "OPENWEATHER_API_KEY=$apiKey"

Write-Host "`n✅ تم إضافة OpenWeather API Key بنجاح!" -ForegroundColor Green
Write-Host "`n📋 الخطوات التالية:" -ForegroundColor Cyan
Write-Host "1. أعد تشغيل خادم التطوير (npm run dev)" -ForegroundColor White
Write-Host "2. افتح صفحة /map" -ForegroundColor White
Write-Host "3. فعّل طبقة الطقس للتحقق من عمل API Key" -ForegroundColor White
Write-Host "`n💡 ملاحظة: قد يستغرق API Key بضع دقائق حتى يصبح نشطاً" -ForegroundColor Yellow

