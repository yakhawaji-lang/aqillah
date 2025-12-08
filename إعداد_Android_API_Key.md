# 🔑 إعداد Android API Key

## ✅ ما تم إنجازه

تم تحديث الكود لاستخدام API key خاص بـ Android (`AQILLAH_Andriod_KEY`) عند الطلبات من تطبيق Android.

## 📝 المتغيرات المطلوبة

### في Vercel Environment Variables:

أضف المتغير التالي:

```
AQILLAH_Andriod_KEY=AIzaSyBROlHr0XViLmXi9IzHM-MG68pgxufslLU
```

**ملاحظة:** هذا الكي يحتوي على جميع APIs المطلوبة:
- Places API
- Geocoding API
- Maps JavaScript API
- Routes API

## 🔧 كيف يعمل النظام

### 1. اكتشاف Android
- يتم اكتشاف الطلبات من Android عبر:
  - `User-Agent` header يحتوي على "Android" أو "Capacitor"
  - `X-Client-Type` header = "android"

### 2. استخدام API Key المناسب
- **للتطبيق Android:** يستخدم `AQILLAH_Andriod_KEY`
- **للويب:** يستخدم `AQILLAH_PLACES_KEY` أو `AQILLAH_MAPS_WEB_KEY`

### 3. API Routes المحدثة
- `/api/places/autocomplete` - البحث التلقائي
- `/api/places/details` - تفاصيل المكان
- `/api/places/geocode` - Geocoding

## 📱 في LocationPicker

عندما يكون التطبيق يعمل على Android:
- يضيف header `X-Client-Type: android`
- يستخدم URL كامل: `https://aqillah.vercel.app/api/places/...`

## ✅ الخطوات التالية

1. **أضف المتغير في Vercel:**
   - اذهب إلى Vercel Dashboard
   - افتح المشروع
   - Settings → Environment Variables
   - أضف: `AQILLAH_Andriod_KEY` = `AIzaSyBROlHr0XViLmXi9IzHM-MG68pgxufslLU`

2. **أعد نشر التطبيق:**
   - Vercel سيعيد البناء تلقائياً بعد إضافة المتغير

3. **اختبر التطبيق:**
   - افتح تطبيق Android
   - جرب البحث عن موقع
   - يجب أن يعمل الآن!

## 🔍 التحقق من الاستخدام

في Console logs في Vercel، ستجد:
```
🔑 Using API key: { type: 'Android', keyPrefix: 'AIzaSyBROl...' }
```

هذا يؤكد أن النظام يستخدم Android API key.

## ⚠️ ملاحظات مهمة

- **الكي محمي:** الكي موجود في Environment Variables فقط، لا يتم عرضه في الكود
- **الأمان:** الكي يستخدم فقط للطلبات من تطبيق Android
- **الويب:** الطلبات من الويب تستخدم كي مختلف


