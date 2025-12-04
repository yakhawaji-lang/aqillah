# ⚠️ حل مشكلة مسار Android SDK

## المشكلة

مسار Android SDK الحالي يحتوي على مسافة في اسم المستخدم:
```
C:\Users\Yahya Khawaji\AppData\Local\Android\Sdk
```

هذا قد يسبب مشاكل مع أدوات NDK.

---

## ✅ الحل: تغيير موقع SDK

### الطريقة 1: استخدام مسار بدون مسافات (موصى به)

#### في Android Studio Setup Wizard:

1. **غير SDK Location** إلى:
   ```
   C:\Android\Sdk
   ```
   أو أي مسار آخر بدون مسافات

2. اضغط **Next**

3. انتظر حتى يكتمل تحميل SDK

4. اضغط **Finish**

#### بعد اكتمال التحميل:

```powershell
# تحديث متغير البيئة
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')

# أو استخدم السكريبت
npm run android:setup-env-user
```

ثم أعد تشغيل PowerShell.

---

### الطريقة 2: استخدام السكريبت التلقائي

```powershell
npm run android:fix-sdk-path
```

سيقوم السكريبت بـ:
- إنشاء مجلد جديد بدون مسافات
- إعطائك تعليمات لتغيير المسار في Android Studio

---

## 📋 خطوات مفصلة

### 1. في Android Studio Setup Wizard

عندما ترى نافذة "SDK Components Setup":

1. **غير SDK Location**:
   - اضغط على أيقونة المجلد بجانب المسار
   - أو اكتب مباشرة: `C:\Android\Sdk`
   - اضغط **OK**

2. **تأكد من أن المسار الجديد لا يحتوي على مسافات**

3. اضغط **Next**

4. انتظر تحميل SDK (10-20 دقيقة)

5. اضغط **Finish**

---

### 2. تحديث متغيرات البيئة

بعد اكتمال التحميل:

```powershell
# تحديث ANDROID_HOME
[Environment]::SetEnvironmentVariable('ANDROID_HOME', 'C:\Android\Sdk', 'User')

# تحديث PATH (إذا لزم الأمر)
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$userPath = $userPath -replace [regex]::Escape("%ANDROID_HOME%\platform-tools"), "%ANDROID_HOME%\platform-tools"
[Environment]::SetEnvironmentVariable("Path", $userPath, "User")
```

أو ببساطة:

```powershell
npm run android:setup-env-user
```

---

### 3. إعادة تشغيل PowerShell

**مهم**: أعد تشغيل PowerShell بعد تحديث متغيرات البيئة.

---

### 4. التحقق

```powershell
npm run android:check
```

يجب أن ترى:
- ✓ Android SDK موجود

---

## 🔍 التحقق من المسار الجديد

```powershell
# التحقق من ANDROID_HOME
echo $env:ANDROID_HOME

# يجب أن يكون: C:\Android\Sdk (بدون مسافات)

# التحقق من ADB
adb version
```

---

## 📝 ملاحظات

1. **المسار الجديد**: `C:\Android\Sdk` (موصى به)
2. **بدائل**: يمكنك استخدام أي مسار بدون مسافات مثل:
   - `C:\AndroidSDK`
   - `D:\Android\Sdk`
   - `C:\Dev\Android\Sdk`

3. **الصلاحيات**: قد تحتاج صلاحيات المسؤول لإنشاء مجلد في `C:\`

---

## ✅ بعد الإصلاح

بعد تغيير المسار وتحديث متغيرات البيئة:

```powershell
# 1. التحقق
npm run android:check

# 2. إعداد Android
npm run android:setup

# 3. بناء المشروع
npm run android:build
```

---

**تم التحديث**: 2024

