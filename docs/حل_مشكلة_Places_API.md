# حل مشكلة Places API - "فشل الاتصال بخدمة البحث"

## المشكلة
عند البحث عن موقع، تظهر رسالة خطأ:
```
⚠️ خطأ في البحث
فشل الاتصال بخدمة البحث. تأكد من تفعيل Places API في Google Cloud Console.
```

## الأسباب المحتملة

### 1. Places API غير مفعلة
Places API غير مفعلة في Google Cloud Console.

### 2. Billing غير مفعل
Google Maps Platform يتطلب تفعيل Billing حتى في وضع Production.

### 3. API Key غير موجودة أو غير صحيحة
API key غير موجودة في ملف `.env` أو غير صحيحة.

### 4. قيود API Key
API key لديها قيود تمنع الاستخدام من النطاق الحالي.

## الحل خطوة بخطوة

### الخطوة 1: التحقق من API Key في ملف .env

افتح ملف `.env` في جذر المشروع وتأكد من وجود أحد المتغيرات التالية:

```env
# الخيار الأول (موصى به)
AQILLAH_PLACES_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# الخيار الثاني (بديل)
AQILLAH_MAPS_WEB_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# الخيار الثالث (بديل)
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**ملاحظة:** يمكنك استخدام نفس API key لجميع الخدمات، أو استخدام keys منفصلة.

### الخطوة 2: تفعيل Places API في Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. اختر المشروع الخاص بك
3. اذهب إلى **APIs & Services** > **Library**
4. ابحث عن **"Places API"** أو **"Places API (New)"**
5. اضغط على **Enable** لتفعيلها

**رابط مباشر:**
- [Places API](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)
- [Places API (New)](https://console.cloud.google.com/apis/library/places-backend.googleapis.com)

### الخطوة 3: تفعيل Billing

⚠️ **مهم:** Google Maps Platform يتطلب تفعيل Billing حتى في وضع Production.

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. اختر المشروع الخاص بك
3. اذهب إلى **Billing**
4. اضغط على **Link a billing account**
5. أضف طريقة دفع (بطاقة ائتمان)

**رابط مباشر:**
- [تفعيل Billing](https://console.cloud.google.com/project/_/billing/enable)

> **ملاحظة:** Google تعطي $200 مجاناً شهرياً لخدمات Maps Platform. هذا كافٍ لمعظم التطبيقات.

### الخطوة 4: إعداد قيود API Key

1. اذهب إلى **APIs & Services** > **Credentials**
2. اضغط على API key المستخدمة
3. في قسم **Application restrictions**:
   - اختر **HTTP referrers (web sites)**
   - أضف النطاقات المسموح بها:
     ```
     http://localhost:3000/*
     https://yourdomain.com/*
     https://*.yourdomain.com/*
     ```
4. في قسم **API restrictions**:
   - اختر **Restrict key**
   - اختر APIs المطلوبة:
     - ✅ Places API
     - ✅ Places API (New)
     - ✅ Geocoding API
     - ✅ Directions API
     - ✅ Maps JavaScript API

### الخطوة 5: إعادة تشغيل التطبيق

بعد تحديث الإعدادات:

```bash
# إيقاف التطبيق
# Ctrl+C

# إعادة التشغيل
npm run dev
```

### الخطوة 6: التحقق من النتيجة

1. افتح التطبيق في المتصفح
2. جرب البحث عن موقع
3. افتح Developer Tools (F12)
4. اذهب إلى **Console**
5. ابحث عن رسائل Google Maps

## استكشاف الأخطاء

### المشكلة: "API key not configured"
**الحل:**
- تأكد من وجود API key في ملف `.env`
- تأكد من أن اسم المتغير صحيح
- أعد تشغيل التطبيق بعد إضافة API key

### المشكلة: "REQUEST_DENIED"
**الحل:**
- تحقق من تفعيل Places API
- تحقق من تفعيل Billing
- تحقق من قيود HTTP referrers في API key

### المشكلة: "OVER_QUERY_LIMIT"
**الحل:**
- تم تجاوز حد الاستعلامات المجانية
- فعّل Billing لزيادة الحد
- انتظر حتى يتم إعادة تعيين الحد (عادة يومياً)

### المشكلة: "INVALID_REQUEST"
**الحل:**
- تحقق من معاملات البحث
- تأكد من أن النص يحتوي على حرفين على الأقل
- تحقق من صحة الإحداثيات إذا كانت موجودة

## التحقق من الإعدادات

### 1. التحقق من API Key
افتح المتصفح واذهب إلى:
```
http://localhost:3000/api/test-maps
```

يجب أن ترى معلومات عن API keys المكونة.

### 2. التحقق من Places API
افتح Developer Tools (F12) وابحث عن:
- طلبات إلى `maps.googleapis.com/maps/api/place/autocomplete`
- رسائل خطأ في Console

### 3. اختبار مباشر
افتح المتصفح واذهب إلى:
```
http://localhost:3000/api/places/autocomplete?input=الرياض
```

يجب أن ترى نتائج البحث.

## نصائح إضافية

1. **استخدم API keys منفصلة للبيئات:**
   - Development: API key للاختبار المحلي
   - Production: API key للإنتاج مع قيود صارمة

2. **راقب الاستخدام:**
   - اذهب إلى **APIs & Services** > **Dashboard**
   - راقب عدد الطلبات والتكلفة

3. **أضف قيود IP (للخوادم فقط):**
   - للخوادم فقط، يمكنك إضافة قيود IP
   - هذا يحسن الأمان

4. **استخدم Quotas:**
   - حدد حد أقصى للطلبات اليومية
   - هذا يمنع التكاليف غير المتوقعة

## المراجع
- [Google Places API Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [Places API (New) Documentation](https://developers.google.com/maps/documentation/places/web-service)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)
- [Billing and Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)

## الدعم
إذا استمرت المشكلة بعد اتباع جميع الخطوات:
1. تحقق من Console (F12) للأخطاء التفصيلية
2. تحقق من Google Cloud Console > APIs & Services > Dashboard
3. راجع سجلات الأخطاء في Google Cloud Console

