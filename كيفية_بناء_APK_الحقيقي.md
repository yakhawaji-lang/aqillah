# 📱 كيفية بناء ملف APK الحقيقي لتطبيق عَقِلْها

## ✅ الخطوات المكتملة

1. ✅ تم بناء التطبيق كـ Static Export
2. ✅ مجلد `out` جاهز
3. ✅ Capacitor مثبت ومهيأ

## 📋 الخطوات التالية لبناء APK

### الخطوة 1: مزامنة Capacitor

```bash
npm run android:sync
```

أو:
```bash
npx cap sync android
```

### الخطوة 2: فتح المشروع في Android Studio

```bash
npm run android:open
```

أو:
```bash
npx cap open android
```

### الخطوة 3: بناء APK في Android Studio

1. **انتظر** حتى يكتمل تحميل المشروع في Android Studio
2. اذهب إلى: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. انتظر حتى يكتمل البناء (ستظهر رسالة "APK(s) generated successfully")
4. اضغط على **"locate"** في الإشعار
5. اذهب إلى المجلد: `android/app/build/outputs/apk/debug/`
6. انسخ ملف `app-debug.apk`
7. أعد تسميته إلى `aqillah.apk`
8. ضعه في: `public/downloads/aqillah.apk`

### الخطوة 4: رفع الملف

```bash
git add public/downloads/aqillah.apk
git commit -m "إضافة ملف APK الحقيقي للتطبيق"
git push origin main
```

## 🎯 بناء APK من سطر الأوامر (بدون Android Studio)

إذا كان لديك Android SDK مثبت:

```bash
cd android
./gradlew assembleDebug
```

الملف سيكون في: `android/app/build/outputs/apk/debug/app-debug.apk`

## ⚠️ ملاحظات مهمة

1. **API Routes**: بعض API routes لن تعمل في التطبيق المحمول لأنها تحتاج إلى server. ستحتاج إلى:
   - استخدام API server منفصل (مثل Vercel)
   - أو تعديل التطبيق لاستخدام API مباشرة من الخادم

2. **Google Maps API**: تأكد من إضافة API key في `capacitor.config.json`:
   ```json
   {
     "plugins": {
       "GoogleMaps": {
         "apiKey": "YOUR_API_KEY_HERE"
       }
     }
   }
   ```

3. **Permissions**: تأكد من أن جميع الصلاحيات المطلوبة موجودة في `android/app/src/main/AndroidManifest.xml`

## 📍 الموقع النهائي لـ APK

بعد البناء، الملف سيكون في:
```
C:\Aqqilha\android\app\build\outputs\apk\debug\app-debug.apk
```

انسخه إلى:
```
C:\Aqqilha\public\downloads\aqillah.apk
```

## 🚀 البدء الآن

1. شغّل: `npm run android:sync`
2. شغّل: `npm run android:open`
3. اتبع الخطوات في Android Studio

---

**تم البناء بنجاح!** ✅
المجلد `out` جاهز الآن.



