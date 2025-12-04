# 🗺️ دليل استخدام Google Maps APIs

## 🚀 البدء السريع

### 1. الحصول على API Key

```bash
# تشغيل سكريبت الإعداد
npm run setup:google-maps
# أو
powershell -ExecutionPolicy Bypass -File scripts/setup-google-maps.ps1
```

### 2. إضافة المفاتيح إلى .env

```env
# Google Maps APIs
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_ROUTES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### 3. اختبار APIs

```bash
# اختبار Geocoding
curl "http://localhost:3000/api/test-google-maps?test=geocode"

# اختبار Route
curl "http://localhost:3000/api/test-google-maps?test=route"

# اختبار الكل
curl "http://localhost:3000/api/test-google-maps?test=all"
```

---

## 📱 استخدام في الويب

### مكون GoogleMap:

```tsx
import GoogleMap from '@/components/GoogleMap'

<GoogleMap
  center={{ lat: 24.7136, lng: 46.6753 }}
  zoom={12}
  markers={[
    { lat: 24.7136, lng: 46.6753, title: 'الرياض' }
  ]}
  route={{
    origin: { lat: 24.7136, lng: 46.6753 },
    destination: { lat: 24.6876, lng: 46.6879 }
  }}
  onMapClick={(location) => console.log(location)}
/>
```

### صفحة الخريطة الكاملة:

```
http://localhost:3000/user/map-google
```

---

## 🔧 استخدام في APIs

### حساب مسار:

```typescript
import { googleMapsService } from '@/lib/services/google-maps'

const route = await googleMapsService.calculateRoute({
  origin: { lat: 24.7136, lng: 46.6753 },
  destination: { lat: 24.6876, lng: 46.6879 },
  departureTime: 'now',
  avoid: ['tolls'],
  alternatives: true,
})
```

### Geocoding:

```typescript
// تحويل عنوان إلى إحداثيات
const geocode = await googleMapsService.geocode({
  address: 'الرياض، المملكة العربية السعودية'
})

// تحويل إحداثيات إلى عنوان
const reverse = await googleMapsService.geocode({
  latlng: { lat: 24.7136, lng: 46.6753 }
})
```

---

## 📋 APIs المتاحة

### 1. Routes API
- حساب مسار مع مراعاة المرور
- مسارات بديلة
- تجنب الرسوم/الطرق السريعة

### 2. Geocoding API
- تحويل العناوين ↔ إحداثيات
- Reverse Geocoding

### 3. Places API
- البحث عن الأماكن
- تفاصيل المكان

### 4. Maps JavaScript API
- عرض الخرائط التفاعلية
- Markers
- Routes
- Layers

---

## 🔍 اختبار APIs

### صفحة الاختبار:

```
http://localhost:3000/api/test-google-maps?test=all
```

### في المتصفح:

افتح Developer Console وراجع:
- Network tab للطلبات
- Console للأخطاء

---

## ⚠️ حل المشاكل

### خطأ: "API key not valid"
- ✅ تأكد من صحة المفتاح
- ✅ تحقق من تفعيل APIs في Console
- ✅ تأكد من تقييد المفتاح (إن كان مقيداً)

### خطأ: "This API project is not authorized"
- ✅ فعّل API في Google Cloud Console
- ✅ انتظر بضع دقائق بعد التفعيل

### الخريطة لا تظهر:
- ✅ تأكد من إضافة `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ✅ أعد تشغيل dev server بعد إضافة المفتاح
- ✅ تحقق من Console للأخطاء

---

## 💡 نصائح

1. **استخدم Caching** لتقليل الطلبات
2. **قيّد المفاتيح** حسب الحاجة
3. **راقب الاستخدام** في Console
4. **اختبر في Development** أولاً

---

## 📚 المراجع

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [Routes API Guide](https://developers.google.com/maps/documentation/routes)
- [Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)

---

**تم التحديث**: 2024

