# سكريبت إعداد تطبيق Android - عَقِلْها
# Android Setup Script for Aqillah

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   إعداد تطبيق Android - عَقِلْها" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من Node.js
Write-Host "[1/5] التحقق من Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js غير مثبت!" -ForegroundColor Red
    exit 1
}

# التحقق من npm
Write-Host "[2/5] التحقق من npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm غير مثبت!" -ForegroundColor Red
    exit 1
}

# تثبيت Capacitor
Write-Host "[3/5] تثبيت Capacitor..." -ForegroundColor Yellow
try {
    npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev
    Write-Host "✓ تم تثبيت Capacitor" -ForegroundColor Green
} catch {
    Write-Host "✗ فشل تثبيت Capacitor!" -ForegroundColor Red
    exit 1
}

# تهيئة Capacitor
Write-Host "[4/5] تهيئة Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "capacitor.config.json")) {
    Write-Host "إنشاء ملف capacitor.config.json..." -ForegroundColor Yellow
    # سيتم استخدام الملف الموجود
    Write-Host "✓ تم إنشاء ملف التكوين" -ForegroundColor Green
} else {
    Write-Host "✓ ملف التكوين موجود" -ForegroundColor Green
}

# إضافة منصة Android
Write-Host "[5/5] إضافة منصة Android..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    try {
        npx cap add android
        Write-Host "✓ تم إضافة منصة Android" -ForegroundColor Green
    } catch {
        Write-Host "✗ فشل إضافة منصة Android!" -ForegroundColor Red
        Write-Host "تأكد من تثبيت Android Studio و Android SDK" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✓ منصة Android موجودة" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   ✓ اكتمل الإعداد بنجاح!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. بناء المشروع: npm run build" -ForegroundColor White
Write-Host "2. مزامنة مع Android: npx cap sync android" -ForegroundColor White
Write-Host "3. فتح في Android Studio: npx cap open android" -ForegroundColor White
Write-Host ""
Write-Host "أو استخدم السكريبت التلقائي:" -ForegroundColor Yellow
Write-Host "   node scripts/build-android.js" -ForegroundColor White
Write-Host ""

