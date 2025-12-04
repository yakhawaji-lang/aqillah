# سكريبت شامل لجميع أوامر عَقِلْها
# Comprehensive PowerShell Script for Aqillah Commands

function Show-Menu {
    Clear-Host
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   عَقِلْها - قائمة الأوامر" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. تشغيل البيانات الحية (30 دقيقة)" -ForegroundColor Yellow
    Write-Host "2. إنشاء بيانات تاريخية (سنة كاملة)" -ForegroundColor Yellow
    Write-Host "3. إضافة بيانات تجريبية" -ForegroundColor Yellow
    Write-Host "4. تشغيل المشروع (npm run dev)" -ForegroundColor Yellow
    Write-Host "5. إنشاء الجداول (db:push)" -ForegroundColor Yellow
    Write-Host "6. توليد Prisma Client (db:generate)" -ForegroundColor Yellow
    Write-Host "7. فتح Prisma Studio" -ForegroundColor Yellow
    Write-Host "8. بناء المشروع للإنتاج" -ForegroundColor Yellow
    Write-Host "9. فحص الأخطاء (lint)" -ForegroundColor Yellow
    Write-Host "0. خروج" -ForegroundColor Red
    Write-Host ""
}

function Run-LiveData {
    Write-Host ""
    Write-Host "تشغيل البيانات الحية..." -ForegroundColor Green
    npm run db:live
}

function Run-HistoricalData {
    Write-Host ""
    Write-Host "تحذير: هذا قد يستغرق وقتًا طويلاً!" -ForegroundColor Red
    $confirmation = Read-Host "هل تريد المتابعة؟ (y/n)"
    if ($confirmation -eq 'y' -or $confirmation -eq 'Y') {
        npm run db:historical
    }
}

function Run-SeedData {
    Write-Host ""
    Write-Host "إضافة بيانات تجريبية..." -ForegroundColor Green
    npm run db:seed
}

function Run-Dev {
    Write-Host ""
    Write-Host "تشغيل المشروع في وضع التطوير..." -ForegroundColor Green
    Write-Host "افتح المتصفح على: http://localhost:3000" -ForegroundColor Yellow
    npm run dev
}

function Run-DbPush {
    Write-Host ""
    Write-Host "إنشاء الجداول في قاعدة البيانات..." -ForegroundColor Green
    npm run db:push
}

function Run-DbGenerate {
    Write-Host ""
    Write-Host "توليد Prisma Client..." -ForegroundColor Green
    npm run db:generate
}

function Run-DbStudio {
    Write-Host ""
    Write-Host "فتح Prisma Studio..." -ForegroundColor Green
    Write-Host "سيتم فتح المتصفح على: http://localhost:5555" -ForegroundColor Yellow
    Start-Process "npm" -ArgumentList "run", "db:studio"
}

function Run-Build {
    Write-Host ""
    Write-Host "بناء المشروع للإنتاج..." -ForegroundColor Green
    npm run build
    Write-Host ""
    Write-Host "✓ تم البناء بنجاح!" -ForegroundColor Green
    Write-Host "لتشغيل المشروع: npm start" -ForegroundColor Yellow
}

function Run-Lint {
    Write-Host ""
    Write-Host "فحص الأخطاء البرمجية..." -ForegroundColor Green
    npm run lint
}

# التحقق من وجود المشروع
if (-not (Test-Path "package.json")) {
    Write-Host "✗ ملف package.json غير موجود!" -ForegroundColor Red
    Write-Host "تأكد من أنك في مجلد المشروع الصحيح." -ForegroundColor Yellow
    exit 1
}

# الحلقة الرئيسية
do {
    Show-Menu
    $choice = Read-Host "اختر رقم الأمر"
    
    switch ($choice) {
        "1" { Run-LiveData }
        "2" { Run-HistoricalData }
        "3" { Run-SeedData }
        "4" { Run-Dev }
        "5" { Run-DbPush }
        "6" { Run-DbGenerate }
        "7" { Run-DbStudio }
        "8" { Run-Build }
        "9" { Run-Lint }
        "0" { 
            Write-Host ""
            Write-Host "مع السلامة!" -ForegroundColor Green
            break 
        }
        default {
            Write-Host ""
            Write-Host "اختيار غير صحيح!" -ForegroundColor Red
            Start-Sleep -Seconds 2
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        Write-Host "اضغط أي مفتاح للمتابعة..." -ForegroundColor Yellow
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    }
} while ($choice -ne "0")

