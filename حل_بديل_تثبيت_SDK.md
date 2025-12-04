# 🔄 حل بديل: تثبيت Android SDK يدوياً

## ⚠️ المشكلة

Android Studio لا يستطيع تحميل SDK تلقائياً بسبب خطأ "Failed to determine required packages".

---

## ✅ الحل: التثبيت اليدوي

### الطريقة 1: استخدام السكريبت التلقائي (موصى به)

```powershell
npm run android:install-sdk-manual
```

هذا السكريبت سيقوم بـ:
- تحميل Command Line Tools
- تثبيت المكونات الأساسية
- تحديث متغيرات البيئة

---

### الطريقة 2: التثبيت اليدوي الكامل

#### الخطوة 1: تحميل Command Line Tools

1. افتح المتصفح واذهب إلى:
   ```
   https://developer.android.com/studio#command-tools
   ```

2. حمّل **"Command line tools only"** لـ Windows

3. استخرج الملف في:
   ```
   C:\Android\Sdk\cmdline-tools\latest
   ```

#### الخطوة 2: تثبيت المكونات

افتح PowerShell وانتقل إلى:

```powershell
cd C:\Android\Sdk\cmdline-tools\latest\bin
```

ثم شغّل:

```powershell
# قبول التراخيص
.\sdkmanager.bat --licenses

# اضغط Y لكل ترخيص

# تثبيت المكونات الأساسية
.\sdkmanager.bat "platform-tools" --sdk_root=C:\Android\Sdk
.\sdkmanager.bat "platforms;android-33" --sdk_root=C:\Android\Sdk
.\sdkmanager.bat "build-tools;33.0.0" --sdk_root=C:\Android\Sdk
```

#### الخطوة 3: تحديث متغيرات البيئة

```powershell
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', 'C:\Android\Sdk', 'User')

# تحديث PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPath += ";C:\Android\Sdk\platform-tools;C:\Android\Sdk\tools;C:\Android\Sdk\cmdline-tools\latest\bin"
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")
```

#### الخطوة 4: إعادة تشغيل PowerShell

أغلق PowerShell وافتح واحدة جديدة.

#### الخطوة 5: التحقق

```powershell
adb version
npm run android:check
```

---

## 🎯 الحل السريع (نسخ ولصق)

انسخ والصق هذا في PowerShell:

```powershell
# إنشاء المجلدات
New-Item -ItemType Directory -Path "C:\Android\Sdk\cmdline-tools\latest" -Force | Out-Null

# تحميل Command Line Tools
$url = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"
$zip = "$env:TEMP\cmdline-tools.zip"
$extract = "C:\Android\Sdk\cmdline-tools"

Write-Host "Downloading Command Line Tools..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
Expand-Archive -Path $zip -DestinationPath $extract -Force
$dir = Get-ChildItem "$extract\cmdline-tools" -Directory | Select-Object -First 1
Move-Item $dir.FullName "$extract\latest" -Force
Remove-Item $zip -Force

# تثبيت المكونات
$env:ANDROID_HOME = "C:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "C:\Android\Sdk"
cd "C:\Android\Sdk\cmdline-tools\latest\bin"

Write-Host "Accepting licenses..." -ForegroundColor Yellow
echo "y" | .\sdkmanager.bat --licenses | Out-Null

Write-Host "Installing platform-tools..." -ForegroundColor Yellow
.\sdkmanager.bat "platform-tools" --sdk_root=C:\Android\Sdk

Write-Host "Installing Android Platform 33..." -ForegroundColor Yellow
.\sdkmanager.bat "platforms;android-33" --sdk_root=C:\Android\Sdk

Write-Host "Installing Build Tools..." -ForegroundColor Yellow
.\sdkmanager.bat "build-tools;33.0.0" --sdk_root=C:\Android\Sdk

# تحديث متغيرات البيئة
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', 'C:\Android\Sdk', 'User')

Write-Host "Done! Please restart PowerShell." -ForegroundColor Green
```

---

## ✅ بعد التثبيت

بعد إعادة تشغيل PowerShell:

```powershell
# التحقق
npm run android:check

# يجب أن ترى:
# ✓ Node.js
# ✓ npm
# ✓ Java
# ✓ Android SDK
```

---

## 🔧 إذا استمرت المشاكل

### الحل البديل: استخدام Android Studio بدون SDK

1. في Android Studio Setup Wizard:
   - اضغط **Cancel**
   - اختر **"Skip SDK Setup"** أو **"Do not download SDK"**

2. بعد فتح Android Studio:
   - **File** → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
   - اضغط **Edit** بجانب SDK Location
   - حدد `C:\Android\Sdk`
   - اضغط **Apply**

3. ثم استخدم التثبيت اليدوي أعلاه

---

## 📋 ملخص الأوامر

```powershell
# التثبيت التلقائي
npm run android:install-sdk-manual

# أو التثبيت اليدوي (انسخ الكود أعلاه)

# بعد التثبيت
npm run android:check
npm run android:setup
```

---

**تم التحديث**: 2024

