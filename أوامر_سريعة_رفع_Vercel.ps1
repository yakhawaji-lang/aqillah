# سكريبت PowerShell لرفع المشروع على Vercel
# استخدم هذا السكريبت لتسهيل عملية الرفع

Write-Host "`n🚀 بدء رفع المشروع على Vercel..." -ForegroundColor Cyan
Write-Host "`n📋 الخطوات:" -ForegroundColor Yellow
Write-Host "1. تأكد من أنك في مجلد المشروع" -ForegroundColor White
Write-Host "2. تأكد من وجود حساب GitHub" -ForegroundColor White
Write-Host "3. تأكد من وجود حساب Vercel" -ForegroundColor White
Write-Host "`n" -ForegroundColor White

# التحقق من وجود Git
Write-Host "🔍 التحقق من Git..." -ForegroundColor Cyan
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "✅ Git مثبت" -ForegroundColor Green
} else {
    Write-Host "❌ Git غير مثبت. يرجى تثبيته من https://git-scm.com" -ForegroundColor Red
    exit
}

# التحقق من وجود مجلد .git
if (Test-Path .git) {
    Write-Host "✅ Git مُهيأ في المشروع" -ForegroundColor Green
} else {
    Write-Host "`n📦 تهيئة Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ تم تهيئة Git" -ForegroundColor Green
}

# التحقق من حالة Git
Write-Host "`n📊 حالة Git:" -ForegroundColor Cyan
git status

# إضافة الملفات
Write-Host "`n📝 إضافة الملفات..." -ForegroundColor Cyan
git add .

# Commit
Write-Host "`n💾 عمل Commit..." -ForegroundColor Cyan
$commitMessage = Read-Host "أدخل رسالة Commit (أو اضغط Enter للرسالة الافتراضية)"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "رفع المشروع الأولي"
}
git commit -m $commitMessage
Write-Host "✅ تم عمل Commit" -ForegroundColor Green

# التحقق من وجود remote
Write-Host "`n🔗 التحقق من GitHub remote..." -ForegroundColor Cyan
$remoteUrl = git remote get-url origin 2>$null
if ($remoteUrl) {
    Write-Host "✅ Remote موجود: $remoteUrl" -ForegroundColor Green
} else {
    Write-Host "⚠️  Remote غير موجود" -ForegroundColor Yellow
    Write-Host "`n📝 يرجى إضافة remote يدوياً:" -ForegroundColor Yellow
    Write-Host "git remote add origin https://github.com/YOUR_USERNAME/aqillah.git" -ForegroundColor Cyan
    Write-Host "git branch -M main" -ForegroundColor Cyan
    Write-Host "git push -u origin main" -ForegroundColor Cyan
    Write-Host "`nأو استخدم GitHub Desktop" -ForegroundColor Yellow
    exit
}

# Push إلى GitHub
Write-Host "`n⬆️  رفع المشروع على GitHub..." -ForegroundColor Cyan
$push = Read-Host "هل تريد رفع المشروع الآن؟ (Y/N)"
if ($push -eq "Y" -or $push -eq "y") {
    git push -u origin main
    Write-Host "✅ تم رفع المشروع على GitHub" -ForegroundColor Green
} else {
    Write-Host "⏭️  تم تخطي الرفع" -ForegroundColor Yellow
}

# التعليمات النهائية
Write-Host "`n✅ تم إعداد Git بنجاح!" -ForegroundColor Green
Write-Host "`n📋 الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. اذهب إلى https://vercel.com" -ForegroundColor White
Write-Host "2. اضغط 'New Project'" -ForegroundColor White
Write-Host "3. اختر المستودع من GitHub" -ForegroundColor White
Write-Host "4. أضف Environment Variables" -ForegroundColor White
Write-Host "5. اضغط 'Deploy'" -ForegroundColor White
Write-Host "`n📖 للتفاصيل الكاملة: راجع 'دليل_رفع_على_Vercel_خطوة_بخطوة.md'" -ForegroundColor Cyan
Write-Host "`n🚀 بالتوفيق!" -ForegroundColor Green

