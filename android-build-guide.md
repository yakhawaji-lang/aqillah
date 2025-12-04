# 📱 دليل بناء تطبيق Android - عَقِلْها

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:

1. **Node.js** (18+)
2. **Java JDK** (17 أو أحدث)
   - تحميل من: https://www.oracle.com/java/technologies/downloads/
3. **Android Studio**
   - تحميل من: https://developer.android.com/studio
4. **Android SDK** (يأتي مع Android Studio)

---

## 🚀 خطوات الإعداد

### الخطوة 1: تثبيت Capacitor

```powershell
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### الخطوة 2: تهيئة Capacitor

```powershell
npx cap init
```

عند الطلب، أدخل:
- **App name**: عَقِلْها
- **App ID**: sa.gov.aqillah
- **Web dir**: out

### الخطوة 3: تحديث next.config.js

تأكد من أن `next.config.js` يحتوي على:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

module.exports = nextConfig
```

### الخطوة 4: بناء المشروع

```powershell
npm run build
```

### الخطوة 5: إضافة منصة Android

```powershell
npx cap add android
```

### الخطوة 6: مزامنة الملفات

```powershell
npx cap sync
```

### الخطوة 7: فتح المشروع في Android Studio

```powershell
npx cap open android
```

---

## 🔨 بناء APK

### الطريقة 1: من Android Studio (موصى به)

1. افتح المشروع في Android Studio
2. انتقل إلى: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. انتظر حتى يكتمل البناء
4. اضغط على **locate** لفتح مجلد APK
5. المسار: `android/app/build/outputs/apk/debug/app-debug.apk`

### الطريقة 2: من سطر الأوامر

```powershell
cd android
.\gradlew assembleDebug
```

الـ APK سيكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📦 بناء AAB (لنشر على Google Play)

```powershell
cd android
.\gradlew bundleRelease
```

الـ AAB سيكون في: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 🔐 توقيع التطبيق (للإصدار النهائي)

### 1. إنشاء مفتاح التوقيع

```powershell
keytool -genkey -v -keystore aqillah-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aqillah
```

### 2. إضافة معلومات المفتاح إلى capacitor.config.json

```json
{
  "android": {
    "buildOptions": {
      "keystorePath": "aqillah-release-key.jks",
      "keystorePassword": "كلمة_المرور",
      "keystoreAlias": "aqillah",
      "keystoreAliasPassword": "كلمة_المرور"
    }
  }
}
```

### 3. بناء APK الموقع

```powershell
cd android
.\gradlew assembleRelease
```

---

## 📱 تثبيت APK على الجهاز

### الطريقة 1: عبر USB

1. فعّل **Developer Options** على جهاز Android
2. فعّل **USB Debugging**
3. وصّل الجهاز بالكمبيوتر
4. في Android Studio: **Run** → **Run 'app'**

### الطريقة 2: نقل الملف

1. انقل ملف `app-debug.apk` إلى جهاز Android
2. فعّل **تثبيت من مصادر غير معروفة** في إعدادات الأمان
3. افتح الملف واتبع التعليمات

---

## 🛠️ الأوامر السريعة

```powershell
# بناء المشروع
npm run build

# مزامنة مع Android
npx cap sync android

# فتح في Android Studio
npx cap open android

# تحديث بعد التغييرات
npx cap copy android
npx cap sync android
```

---

## 🔧 حل المشاكل الشائعة

### المشكلة 1: خطأ "Gradle sync failed"

**الحل**:
1. افتح Android Studio
2. **File** → **Invalidate Caches / Restart**
3. اختر **Invalidate and Restart**

### المشكلة 2: خطأ "SDK location not found"

**الحل**:
1. افتح `android/local.properties`
2. أضف:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### المشكلة 3: التطبيق لا يعرض الخرائط

**الحل**:
1. احصل على مفتاح Google Maps API
2. أضفه في `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_API_KEY"/>
```

### المشكلة 4: خطأ في بناء APK

**الحل**:
```powershell
cd android
.\gradlew clean
.\gradlew assembleDebug
```

---

## 📋 ملفات مهمة

- `capacitor.config.json` - إعدادات Capacitor
- `android/app/build.gradle` - إعدادات البناء
- `android/app/src/main/AndroidManifest.xml` - صلاحيات التطبيق
- `android/app/src/main/res/values/strings.xml` - اسم التطبيق

---

## 🎯 خطوات سريعة (ملخص)

```powershell
# 1. تثبيت Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# 2. تهيئة
npx cap init

# 3. بناء المشروع
npm run build

# 4. إضافة Android
npx cap add android

# 5. مزامنة
npx cap sync

# 6. فتح في Android Studio
npx cap open android

# 7. بناء APK من Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. تحقق من أن جميع المتطلبات مثبتة
2. تأكد من أن Android SDK محدث
3. راجع ملفات السجلات في Android Studio

---

**تم التحديث**: 2024

