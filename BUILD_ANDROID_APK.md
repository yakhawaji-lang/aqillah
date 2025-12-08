# دليل بناء ملف APK لتطبيق عَقِلْها

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت:

1. **Node.js** (18 أو أحدث)
2. **Java JDK** (17 أو أحدث)
3. **Android Studio** (أحدث إصدار)
4. **Android SDK** (يتم تثبيته مع Android Studio)

## الخطوات

### 1. تثبيت الحزم

```bash
npm install
```

### 2. بناء التطبيق كـ Static Export

```bash
npm run build:android
```

هذا سينشئ مجلد `out` يحتوي على الملفات الثابتة.

### 3. إعداد Capacitor (إذا لم يكن موجوداً)

```bash
npx cap init
```

عند السؤال:
- App name: `عَقِلْها` أو `Aqillah`
- App ID: `com.aqillah.app`
- Web dir: `out`

### 4. إضافة منصة Android

```bash
npx cap add android
```

### 5. مزامنة الملفات مع Android

```bash
npm run android:sync
```

أو:
```bash
npx cap sync android
```

### 6. فتح المشروع في Android Studio

```bash
npm run android:open
```

أو:
```bash
npx cap open android
```

### 7. بناء APK في Android Studio

1. افتح Android Studio
2. انتظر حتى يكتمل تحميل المشروع
3. اذهب إلى: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
4. انتظر حتى يكتمل البناء
5. اضغط على **locate** في الإشعار الذي يظهر
6. اذهب إلى: `android/app/build/outputs/apk/release/`
7. انسخ ملف `app-release.apk`
8. أعد تسميته إلى `aqillah.apk`
9. ضعه في `public/downloads/aqillah.apk`

### 8. رفع الملف

```bash
git add public/downloads/aqillah.apk
git commit -m "إضافة ملف APK الحقيقي للتطبيق"
git push origin main
```

## بناء APK من سطر الأوامر (متقدم)

إذا كنت تريد بناء APK مباشرة من سطر الأوامر:

```bash
cd android
./gradlew assembleRelease
```

الملف سيكون في: `android/app/build/outputs/apk/release/app-release.apk`

## ملاحظات مهمة

- تأكد من تحديث `capacitor.config.ts` بإعدادات التطبيق الصحيحة
- قد تحتاج إلى توقيع APK للتوزيع العام
- للنسخة النهائية، استخدم **Build** → **Generate Signed Bundle / APK**

## استكشاف الأخطاء

### خطأ: Android SDK not found
```bash
npm run android:fix-sdk-path
```

### خطأ: Java not found
```bash
npm run android:download-java
```

### خطأ: Gradle build failed
- تأكد من أن Android Studio محدث
- تأكد من أن Android SDK محدث
- جرب: `cd android && ./gradlew clean`



