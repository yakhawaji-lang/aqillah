# حل مشكلة وضع المطور في Google Maps

## المشكلة
تظهر الخريطة مع علامة مائية "For development purposes only" مما يعني أن Google Maps API key في وضع التطوير.

## السبب
Google Maps API key المستخدمة هي من نوع **Development** وليست **Production** في Google Cloud Console.

## الحل

### الخطوة 1: فتح Google Cloud Console
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. اختر المشروع الخاص بك
3. اذهب إلى **APIs & Services** > **Credentials**

### الخطوة 2: التحقق من API Key
1. ابحث عن API key المستخدمة في التطبيق (`NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY`)
2. اضغط على اسم الـ API key لفتح الإعدادات

### الخطوة 3: تفعيل APIs المطلوبة
تأكد من تفعيل جميع APIs التالية:

- ✅ **Maps JavaScript API** (مطلوب للخريطة)
- ✅ **Directions API** (مطلوب لحساب المسارات)
- ✅ **Places API** (مطلوب للبحث عن الأماكن)
- ✅ **Geocoding API** (مطلوب لتحويل العناوين إلى إحداثيات)
- ✅ **Routes API** (مطلوب لبيانات المرور)

**لتفعيل API:**
1. اذهب إلى **APIs & Services** > **Library**
2. ابحث عن اسم الـ API
3. اضغط على **Enable**

### الخطوة 4: إعداد قيود API Key

#### أ) Application restrictions (قيود التطبيق)
اختر أحد الخيارات التالية:

**للويب (Web):**
- اختر **HTTP referrers (web sites)**
- أضف النطاقات المسموح بها:
  ```
  http://localhost:3000/*
  https://yourdomain.com/*
  https://*.yourdomain.com/*
  ```

**للتطبيق المحمول (Android/iOS):**
- اختر **Android apps** أو **iOS apps**
- أضف package name و SHA-1 certificate fingerprint

#### ب) API restrictions (قيود API)
- اختر **Restrict key**
- اختر فقط APIs المطلوبة:
  - Maps JavaScript API
  - Directions API
  - Places API
  - Geocoding API
  - Routes API

### الخطوة 5: تفعيل Billing (الدفع)
⚠️ **مهم:** Google Maps API يتطلب تفعيل حساب الدفع حتى في وضع Production:

1. اذهب إلى **Billing** في Google Cloud Console
2. أضف طريقة دفع (بطاقة ائتمان)
3. تأكد من تفعيل Billing للمشروع

> **ملاحظة:** Google Maps API لديها $200 شهرياً مجاناً، وهذا كافٍ لمعظم التطبيقات.

### الخطوة 6: التحقق من API Key في التطبيق
تأكد من أن API key في ملف `.env` صحيحة:

```env
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AQILLAH_MAPS_WEB_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### الخطوة 7: إعادة تشغيل التطبيق
بعد تحديث الإعدادات:

```bash
# إيقاف التطبيق
# Ctrl+C

# إعادة التشغيل
npm run dev
```

### الخطوة 8: التحقق من النتيجة
1. افتح التطبيق في المتصفح
2. افتح Developer Tools (F12)
3. اذهب إلى **Console**
4. ابحث عن رسائل Google Maps
5. تأكد من عدم وجود أخطاء

## استكشاف الأخطاء

### المشكلة: لا تزال العلامة المائية تظهر
**الحل:**
- تأكد من تفعيل Billing
- تأكد من تفعيل جميع APIs المطلوبة
- تأكد من أن API key صحيحة في `.env`
- امسح cache المتصفح (Ctrl+Shift+Delete)

### المشكلة: الخريطة لا تعمل
**الحل:**
- تحقق من Console للأخطاء
- تأكد من أن API key لديها الصلاحيات المطلوبة
- تأكد من أن قيود HTTP referrers صحيحة

### المشكلة: "This page can't load Google Maps correctly"
**الحل:**
- تحقق من أن API key مفعلة
- تحقق من أن Billing مفعل
- تحقق من قيود HTTP referrers

## نصائح إضافية

1. **استخدم API keys منفصلة للبيئات:**
   - Development: API key للاختبار المحلي
   - Production: API key للإنتاج مع قيود صارمة

2. **راقب الاستخدام:**
   - اذهب إلى **APIs & Services** > **Dashboard**
   - راقب عدد الطلبات والتكلفة

3. **أضف قيود IP (اختياري):**
   - للخوادم فقط، يمكنك إضافة قيود IP
   - هذا يحسن الأمان

## المراجع
- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Billing and Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

