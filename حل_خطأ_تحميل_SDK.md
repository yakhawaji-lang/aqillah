# 🔧 حل خطأ "Failed to determine required packages"

## ⚠️ المشكلة

Android Studio يعرض خطأ:
```
Failed to determine required packages
```

---

## ✅ الحلول (جرب بالترتيب)

### الحل 1: إعادة المحاولة (الأسهل)

1. **اضغط Cancel** في نافذة الخطأ
2. **أعد فتح Android Studio**
3. **جرب مرة أخرى**

---

### الحل 2: فحص الاتصال بالإنترنت

1. تأكد من وجود اتصال إنترنت مستقر
2. جرب فتح: https://dl.google.com/android/repository/
3. إذا لم يفتح، قد تكون هناك مشكلة في الوكيل (proxy)

---

### الحل 3: تغيير إعدادات الوكيل (Proxy)

إذا كنت تستخدم VPN أو Proxy:

1. في Android Studio: **File** → **Settings** (أو **Configure** → **Settings**)
2. **Appearance & Behavior** → **System Settings** → **HTTP Proxy**
3. اختر **No proxy** أو **Auto-detect proxy settings**
4. اضغط **OK**
5. أعد المحاولة

---

### الحل 4: حذف ملفات التكوين وإعادة المحاولة

```powershell
# إيقاف Android Studio أولاً

# حذف ملفات التكوين المؤقتة
Remove-Item -Path "$env:LOCALAPPDATA\Google\AndroidStudio*" -Recurse -Force -ErrorAction SilentlyContinue

# إعادة فتح Android Studio
```

---

### الحل 5: تثبيت SDK يدوياً

إذا استمرت المشكلة، يمكن تثبيت SDK يدوياً:

#### أ) تحميل Command Line Tools

1. افتح: https://developer.android.com/studio#command-tools
2. حمّل **Command line tools** لـ Windows
3. استخرج الملف في: `C:\Android\Sdk\cmdline-tools`

#### ب) استخدام sdkmanager

```powershell
cd C:\Android\Sdk\cmdline-tools\latest\bin

# تثبيت المكونات الأساسية
.\sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0"
```

---

### الحل 6: التحقق من صلاحيات المجلد

```powershell
# التأكد من صلاحيات الكتابة على المجلد
$sdkPath = "C:\Android\Sdk"
$acl = Get-Acl $sdkPath
$permission = $acl.Access | Where-Object {$_.IdentityReference -eq $env:USERNAME}
Write-Host "Permissions: $permission"
```

إذا لم تكن لديك صلاحيات كافية:

```powershell
# إعطاء صلاحيات كاملة (كمسؤول)
icacls "C:\Android\Sdk" /grant "$env:USERNAME:(OI)(CI)F" /T
```

---

## 🎯 الحل السريع الموصى به

### الخطوة 1: إغلاق Android Studio

1. اضغط **Cancel** في نافذة الخطأ
2. أغلق Android Studio بالكامل

### الخطوة 2: تنظيف الملفات المؤقتة

```powershell
# حذف ملفات التكوين المؤقتة
Remove-Item -Path "$env:LOCALAPPDATA\Google\AndroidStudio*" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$env:APPDATA\Google\AndroidStudio*" -Recurse -Force -ErrorAction SilentlyContinue
```

### الخطوة 3: إعادة فتح Android Studio

```powershell
npm run android:open-studio
```

### الخطوة 4: إعادة المحاولة

1. اختر **Standard** setup
2. غير SDK Location إلى: `C:\Android\Sdk`
3. اضغط **Next**
4. انتظر التحميل

---

## 🔍 فحص المشاكل الشائعة

### 1. فحص الاتصال

```powershell
# اختبار الاتصال بخوادم Google
Test-NetConnection dl.google.com -Port 443
```

### 2. فحص المسار

```powershell
# التأكد من وجود المجلد
Test-Path "C:\Android\Sdk"

# التأكد من الصلاحيات
Get-Acl "C:\Android\Sdk" | Format-List
```

### 3. فحص إعدادات Windows Firewall

قد يحتاج Android Studio إلى إضافة استثناء في Windows Firewall.

---

## 📋 حل بديل: استخدام Android SDK Manager يدوياً

إذا استمرت المشكلة:

1. **حمّل Android SDK Command Line Tools**:
   - من: https://developer.android.com/studio#command-tools
   - استخرج في: `C:\Android\Sdk\cmdline-tools\latest`

2. **استخدم sdkmanager**:

```powershell
cd C:\Android\Sdk\cmdline-tools\latest\bin

# قبول التراخيص
.\sdkmanager --licenses

# تثبيت المكونات الأساسية
.\sdkmanager "platform-tools" "platforms;android-33" "build-tools;33.0.0" "emulator"
```

---

## ✅ بعد حل المشكلة

بعد نجاح التحميل:

```powershell
# تحديث متغيرات البيئة
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')

# إعادة تشغيل PowerShell

# التحقق
npm run android:check
```

---

## 🆘 إذا استمرت المشكلة

1. **تحقق من السجلات**:
   - Android Studio → **Help** → **Show Log in Explorer**
   - ابحث عن أخطاء في الملفات

2. **جرب إصدار مختلف من Android Studio**

3. **راجع منتديات Android Studio**:
   - https://developer.android.com/studio/intro

---

**تم التحديث**: 2024

