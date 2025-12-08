# 🔧 إصلاح مشكلة البحث عن المواقع في تطبيق Android

## ✅ ما تم إصلاحه

### 1. إضافة Network Security Config
- تم إنشاء ملف `android/app/src/main/res/xml/network_security_config.xml`
- يسمح بالاتصال الآمن مع:
  - `aqillah.vercel.app` (API الخاص بالتطبيق)
  - `maps.googleapis.com` (Google Maps API)
  - `routes.googleapis.com` (Google Routes API)

### 2. تحسين اكتشاف Capacitor
- تم تحسين طريقة اكتشاف إذا كان التطبيق يعمل في Capacitor (Android/iOS)
- الآن يكتشف:
  - `window.Capacitor`
  - `window.Android`
  - `navigator.userAgent` يحتوي على "Capacitor" أو "Android"

### 3. تحسين معالجة الأخطاء
- إضافة timeout (15 ثانية) لجميع طلبات API
- إضافة headers صحيحة
- تحسين معالجة تنسيقات الاستجابة المختلفة

### 4. تحديث AndroidManifest.xml
- إضافة `android:networkSecurityConfig` للإشارة إلى ملف الأمان
- إضافة `android:usesCleartextTraffic="false"` للأمان

## 📝 التغييرات المطلوبة

### 1. إعادة بناء تطبيق Android

```bash
# في مجلد المشروع الرئيسي
npm run build:android
cd android
./gradlew.bat clean
./gradlew.bat assembleDebug
```

### 2. التحقق من Environment Variables في Vercel

تأكد من وجود المتغيرات التالية في Vercel:

```
AQILLAH_PLACES_KEY=your_google_places_api_key
AQILLAH_MAPS_WEB_KEY=your_google_maps_api_key
AQILLAH_ROUTES_KEY=your_google_routes_api_key
```

### 3. تفعيل Google Places API

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. افتح المشروع الخاص بك
3. اذهب إلى **APIs & Services** → **Library**
4. ابحث عن **Places API** وفعّله
5. تأكد من تفعيل **Billing** (Google تعطي $200 مجاناً شهرياً)

## 🧪 اختبار الإصلاح

### في تطبيق Android:

1. **افتح التطبيق**
2. **اذهب إلى صفحة Navigation** (`/user/navigation`)
3. **اكتب في حقل البحث عن الوجهة** (مثلاً: "الرياض")
4. **يجب أن تظهر نتائج البحث**

### التحقق من Console:

افتح **Chrome DevTools** واتصل بالتطبيق:
- `chrome://inspect` → اختر جهازك → **inspect**

في Console، يجب أن ترى:
```
🔍 Fetching autocomplete for: [البحث] location: [lat,lng]
🌐 API URL: https://aqillah.vercel.app/api/places/autocomplete isCapacitor: true
✅ Autocomplete response: {...}
```

## 🐛 استكشاف الأخطاء

### إذا لم يعمل البحث:

1. **تحقق من Console:**
   - افتح Chrome DevTools
   - ابحث عن أخطاء في Console
   - تحقق من Network tab لرؤية طلبات API

2. **تحقق من API Keys:**
   - تأكد من وجود `AQILLAH_PLACES_KEY` في Vercel
   - تأكد من تفعيل Places API في Google Cloud Console

3. **تحقق من Billing:**
   - تأكد من تفعيل Billing في Google Cloud Console
   - Google تعطي $200 مجاناً شهرياً

4. **تحقق من Network:**
   - تأكد من أن الجهاز متصل بالإنترنت
   - جرب إعادة تشغيل التطبيق

## 📱 ملاحظات مهمة

- **الملف موجود محلياً:** الملف `public/downloads/aqillah.apk` موجود محلياً لكنه غير موجود في Git بسبب الحجم الكبير
- **لإعادة البناء:** يجب إعادة بناء APK بعد هذه التغييرات
- **API يعمل:** API routes موجودة وتعمل في `/api/places/autocomplete` و `/api/places/details`

## ✅ النتيجة المتوقعة

بعد إعادة بناء التطبيق، يجب أن يعمل البحث عن المواقع بشكل صحيح في تطبيق Android!

