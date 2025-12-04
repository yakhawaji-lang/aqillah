# Final Setup After Installation
# الإعداد النهائي بعد التثبيت

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Final Setup - Android Requirements" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find Java JDK
Write-Host "[1] Finding Java JDK..." -ForegroundColor Yellow
$javaPaths = @(
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk-21*"
)

$javaHome = $null
foreach ($pattern in $javaPaths) {
    $found = Get-ChildItem -Path (Split-Path $pattern -Parent) -Filter (Split-Path $pattern -Leaf) -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) {
        $javaHome = $found.FullName
        Write-Host "[OK] Found Java at: $javaHome" -ForegroundColor Green
        break
    }
}

if (-not $javaHome) {
    Write-Host "[WARN] Java JDK not found automatically" -ForegroundColor Yellow
    Write-Host "Please set JAVA_HOME manually after restart" -ForegroundColor Yellow
}

# Find Android SDK
Write-Host ""
Write-Host "[2] Finding Android SDK..." -ForegroundColor Yellow
$sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
if (Test-Path $sdkPath) {
    Write-Host "[OK] Android SDK path: $sdkPath" -ForegroundColor Green
} else {
    Write-Host "[WARN] Android SDK not found yet" -ForegroundColor Yellow
    Write-Host "  This is normal - Android SDK downloads when you first open Android Studio" -ForegroundColor Gray
    Write-Host "  Please open Android Studio once to complete SDK setup" -ForegroundColor Yellow
}

# Create setup instructions file
Write-Host ""
Write-Host "[3] Creating setup instructions..." -ForegroundColor Yellow

$instructions = @"
# Setup Instructions After Installation
# تعليمات الإعداد بعد التثبيت

## What Was Installed
## ما تم تثبيته

✓ Java JDK 17 (Eclipse Temurin)
✓ Android Studio

## Next Steps
## الخطوات التالية

### 1. RESTART PowerShell (IMPORTANT!)
### 1. أعد تشغيل PowerShell (مهم!)

Close this PowerShell window and open a new one.
أغلق نافذة PowerShell هذه وافتح واحدة جديدة.

### 2. Set Environment Variables (Run as Administrator)
### 2. إعداد متغيرات البيئة (شغّل كمسؤول)

Run PowerShell as Administrator and execute:
شغّل PowerShell كمسؤول ونفّذ:

```powershell
npm run android:setup-env
```

Or manually:
أو يدوياً:

1. Win + R -> sysdm.cpl -> Advanced -> Environment Variables
2. Add JAVA_HOME = $javaHome
3. Add ANDROID_HOME = $sdkPath
4. Add to Path: %JAVA_HOME%\bin, %ANDROID_HOME%\platform-tools

### 3. Open Android Studio Once
### 3. افتح Android Studio مرة واحدة

1. Open Android Studio from Start Menu
2. Choose "Standard" setup
3. Wait for Android SDK to download (10-20 minutes)
4. Click "Finish"

### 4. Verify Installation
### 4. التحقق من التثبيت

After restarting PowerShell:
بعد إعادة تشغيل PowerShell:

```powershell
npm run android:check
```

### 5. Complete Android Setup
### 5. إكمال إعداد Android

```powershell
npm run android:setup
npm run android:build
```

## Java Location
## موقع Java

$javaHome

## Android SDK Location
## موقع Android SDK

$sdkPath

(Will be created when you first open Android Studio)
(سيتم إنشاؤه عند فتح Android Studio لأول مرة)
"@

$instructions | Out-File -FilePath "SETUP_INSTRUCTIONS.md" -Encoding UTF8
Write-Host "[OK] Instructions saved to SETUP_INSTRUCTIONS.md" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Summary" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[SUCCESS] Installed:" -ForegroundColor Green
Write-Host "  + Java JDK 17" -ForegroundColor Green
Write-Host "  + Android Studio" -ForegroundColor Green
Write-Host ""
Write-Host "[NEXT] Required Actions:" -ForegroundColor Yellow
Write-Host "  1. RESTART PowerShell" -ForegroundColor White
Write-Host "  2. Run: npm run android:setup-env (as Administrator)" -ForegroundColor White
Write-Host "  3. Open Android Studio once to download SDK" -ForegroundColor White
Write-Host "  4. Run: npm run android:check" -ForegroundColor White
Write-Host ""
Write-Host "See SETUP_INSTRUCTIONS.md for details" -ForegroundColor Cyan
Write-Host ""

