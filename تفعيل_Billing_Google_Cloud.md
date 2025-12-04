# تفعيل Billing في Google Cloud

## المشكلة
```
REQUEST_DENIED - You must enable Billing on the Google Cloud Project
```

## الحل

### الخطوة 1: تفعيل Billing
1. اذهب إلى: https://console.cloud.google.com/project/_/billing/enable
2. أو اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
3. اختر المشروع الخاص بك
4. اذهب إلى **Billing** من القائمة الجانبية
5. اضغط **Link a billing account**
6. أدخل معلومات بطاقة الائتمان (مطلوبة للتحقق)

### الخطوة 2: فهم الائتمان المجاني
- Google تعطي **$200 مجاناً شهرياً** لجميع خدمات Google Maps Platform
- Places API Autocomplete يكلف:
  - **$2.83 لكل 1000 طلب** (Session-based)
  - أو **$17 لكل 1000 طلب** (Per-session)
- مع الائتمان المجاني $200، يمكنك عمل **~70,000 طلب مجاناً شهرياً**

### الخطوة 3: التحقق من التفعيل
بعد تفعيل Billing:
1. انتظر دقيقة أو دقيقتين
2. جرب البحث مرة أخرى
3. يجب أن يعمل الآن

## بدائل (إذا لم تريد تفعيل Billing)

### البديل 1: استخدام Geocoding API (مجاني جزئياً)
Geocoding API له حد مجاني أعلى (40,000 طلب/شهر) لكنه لا يدعم Autocomplete.

### البديل 2: استخدام Places API (New) مع Billing
Places API (New) يتطلب Billing لكنه أكثر دقة.

### البديل 3: استخدام خدمة خارجية
- Mapbox Geocoding API
- HERE Geocoding API
- OpenStreetMap Nominatim (مجاني تماماً لكن محدود)

## ملاحظات مهمة

⚠️ **تحذير**: 
- Billing مطلوب لـ Places API
- لكن Google تعطي $200 مجاناً شهرياً
- يمكنك وضع حد أقصى للإنفاق (Budget Alerts)

✅ **نصائح**:
- ضع حد أقصى للإنفاق في Google Cloud Console
- راقب الاستخدام من Dashboard
- استخدم Caching لتقليل الطلبات

## روابط مفيدة

- تفعيل Billing: https://console.cloud.google.com/project/_/billing/enable
- Places API Pricing: https://developers.google.com/maps/billing-and-pricing/pricing#places
- Free Tier: https://developers.google.com/maps/billing-and-pricing/pricing#maps-static-api


