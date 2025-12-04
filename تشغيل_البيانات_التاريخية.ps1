# سكريبت تشغيل البيانات التاريخية - عَقِلْها
# PowerShell Script to Generate Historical Data (1 Year)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   عَقِلْها - بيانات تاريخية (سنة كاملة)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود Node.js
Write-Host "[1/3] التحقق من Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js مثبت: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js غير مثبت! يرجى تثبيته من https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# التحقق من وجود npm
Write-Host "[2/3] التحقق من npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm مثبت: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm غير مثبت!" -ForegroundColor Red
    exit 1
}

# التحقق من وجود ملف package.json
Write-Host "[3/3] التحقق من المشروع..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    Write-Host "✓ المشروع موجود" -ForegroundColor Green
} else {
    Write-Host "✗ ملف package.json غير موجود! تأكد من أنك في مجلد المشروع الصحيح." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   تحذير: هذا قد يستغرق وقتًا طويلاً!" -ForegroundColor Red
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "سيتم إنشاء بيانات تاريخية لسنة كاملة" -ForegroundColor Yellow
Write-Host "قد يستغرق هذا عدة دقائق..." -ForegroundColor Yellow
Write-Host ""

# طلب التأكيد
$confirmation = Read-Host "هل تريد المتابعة؟ (y/n)"
if ($confirmation -ne 'y' -and $confirmation -ne 'Y') {
    Write-Host "تم الإلغاء." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "بدء إنشاء البيانات..." -ForegroundColor Green
Write-Host ""

# تشغيل سكريبت البيانات التاريخية
try {
    npm run db:historical
    Write-Host ""
    Write-Host "✓ تم إنشاء البيانات التاريخية بنجاح!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "✗ حدث خطأ أثناء تشغيل السكريبت!" -ForegroundColor Red
    Write-Host "تأكد من:" -ForegroundColor Yellow
    Write-Host "  1. أن MySQL يعمل في XAMPP" -ForegroundColor Yellow
    Write-Host "  2. أن قاعدة البيانات 'aqillah' موجودة" -ForegroundColor Yellow
    Write-Host "  3. أن الجداول تم إنشاؤها (npm run db:push)" -ForegroundColor Yellow
    exit 1
}

