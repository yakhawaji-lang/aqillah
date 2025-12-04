# 📱 تطبيق Android - عَقِلْها

دليل شامل لبناء وتشغيل تطبيق Android لنظام عَقِلْها.

---

## 🚀 البدء السريع

### الخطوات الأساسية

```powershell
# 1. تثبيت المتطلبات (راجع android-requirements.md)

# 2. إعداد Android
npm run android:setup

# 3. بناء المشروع
npm run android:build

# 4. فتح في Android Studio
npm run android:open

# 5. بناء APK من Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

---

## 📋 المتطلبات

- ✅ Node.js 18+
- ✅ Java JDK 17+
- ✅ Android Studio
- ✅ Android SDK (API 21+)

للتفاصيل الكاملة: راجع `android-requirements.md`

---

## 🛠️ الأوامر المتاحة

### إعداد
```powershell
npm run android:setup
```
يثبت Capacitor ويضيف منصة Android.

### بناء
```powershell
npm run android:build
```
يبني المشروع ويمزجه مع Android.

### مزامنة
```powershell
npm run android:sync
```
يمزج التغييرات مع Android.

### فتح في Android Studio
```powershell
npm run android:open
```
يفتح المشروع في Android Studio.

---

## 📦 بناء APK

### من Android Studio (موصى به)

1. افتح المشروع: `npm run android:open`
2. **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. انتظر حتى يكتمل البناء
4. اضغط **locate** لفتح مجلد APK

**الموقع**: `android/app/build/outputs/apk/debug/app-debug.apk`

### من سطر الأوامر

```powershell
cd android
.\gradlew assembleDebug
```

---

## 🔐 بناء APK موقع (للإصدار)

### 1. إنشاء مفتاح التوقيع

```powershell
keytool -genkey -v -keystore aqillah-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aqillah
```

### 2. تحديث capacitor.config.json

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

## 📱 تثبيت على الجهاز

### الطريقة 1: عبر USB (موصى به)

1. فعّل **Developer Options** على Android:
   - اذهب إلى **Settings** → **About Phone**
   - اضغط على **Build Number** 7 مرات

2. فعّل **USB Debugging**:
   - **Settings** → **Developer Options** → **USB Debugging**

3. وصّل الجهاز بالكمبيوتر

4. في Android Studio: **Run** → **Run 'app'**

### الطريقة 2: نقل APK

1. انقل ملف `app-debug.apk` إلى جهاز Android
2. فعّل **تثبيت من مصادر غير معروفة**:
   - **Settings** → **Security** → **Unknown Sources**
3. افتح الملف واتبع التعليمات

---

## 🔄 تحديث التطبيق

بعد إجراء تغييرات على الكود:

```powershell
# 1. بناء المشروع
npm run build:android

# 2. مزامنة مع Android
npm run android:sync

# 3. إعادة البناء في Android Studio
# Build → Rebuild Project
```

---

## 🐛 حل المشاكل

### المشكلة: "Gradle sync failed"

**الحل**:
1. افتح Android Studio
2. **File** → **Invalidate Caches / Restart**
3. اختر **Invalidate and Restart**

### المشكلة: "SDK location not found"

**الحل**:
أنشئ ملف `android/local.properties`:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### المشكلة: التطبيق لا يعرض الخرائط

**الحل**:
1. احصل على مفتاح Google Maps API
2. أضفه في `android/app/src/main/AndroidManifest.xml`

### المشكلة: "BUILD_FOR_ANDROID is not defined"

**الحل**:
استخدم الأمر:
```powershell
npm run android:build
```
بدلاً من `npm run build`

---

## 📂 هيكل المشروع

```
Aqqilha/
├── android/                 # مشروع Android
│   ├── app/
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/    # ملفات APK هنا
│   └── build.gradle
├── capacitor.config.json    # إعدادات Capacitor
├── scripts/
│   ├── build-android.js     # سكريبت البناء
│   └── setup-android.ps1    # سكريبت الإعداد
└── out/                     # ملفات Next.js المبنية
```

---

## 📚 الملفات المرجعية

- `android-build-guide.md` - دليل شامل للبناء
- `android-requirements.md` - المتطلبات التفصيلية
- `android-quick-start.md` - بدء سريع
- `capacitor.config.json` - إعدادات Capacitor

---

## 🎯 الخطوات الكاملة (ملخص)

```powershell
# 1. تثبيت المتطلبات
# - Node.js, Java JDK, Android Studio

# 2. إعداد المشروع
npm run android:setup

# 3. بناء المشروع
npm run android:build

# 4. فتح في Android Studio
npm run android:open

# 5. بناء APK
# Build → Build Bundle(s) / APK(s) → Build APK(s)

# 6. تثبيت على الجهاز
# Run → Run 'app'
```

---

## 📞 الدعم

إذا واجهت أي مشكلة:
1. راجع `android-build-guide.md` للتفاصيل
2. تحقق من `android-requirements.md` للمتطلبات
3. راجع قسم "حل المشاكل" أعلاه

---

**تم التحديث**: 2024
**الإصدار**: 1.0.0

