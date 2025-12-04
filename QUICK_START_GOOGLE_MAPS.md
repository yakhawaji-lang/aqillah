# 🗺️ البدء السريع مع Google Maps

## ⚡ 3 خطوات فقط!

### 1️⃣ الحصول على API Key

```bash
npm run setup:google-maps
```

أو اذهب يدوياً إلى:
https://console.cloud.google.com/

---

### 2️⃣ إضافة المفتاح إلى .env

أنشئ ملف `.env` في جذر المشروع:

```env
# Google Maps APIs
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_ROUTES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

### 3️⃣ اختبار

```bash
# تشغيل المشروع
npm run dev

# اختبار API
# افتح: http://localhost:3000/api/test-google-maps?test=all

# صفحة الخريطة
# افتح: http://localhost:3000/user/map-google
```

---

## ✅ APIs المطلوبة في Google Cloud Console

فعّل هذه APIs:

1. ✅ **Maps JavaScript API**
2. ✅ **Routes API** 
3. ✅ **Geocoding API**
4. ✅ **Places API**
5. ✅ **Maps SDK for Android** (للتطبيق)

---

## 📱 استخدام في الكود

### في React Component:

```tsx
import GoogleMap from '@/components/GoogleMap'

<GoogleMap
  center={{ lat: 24.7136, lng: 46.6753 }}
  zoom={12}
  markers={[
    { lat: 24.7136, lng: 46.6753, title: 'الرياض' }
  ]}
/>
```

### في API Route:

```typescript
import { googleMapsService } from '@/lib/services/google-maps'

const route = await googleMapsService.calculateRoute({
  origin: { lat: 24.7136, lng: 46.6753 },
  destination: { lat: 24.6876, lng: 46.6879 },
})
```

---

## 🔍 حل المشاكل

### الخريطة لا تظهر؟
- ✅ تأكد من إضافة `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- ✅ أعد تشغيل `npm run dev`
- ✅ تحقق من Console للأخطاء

### خطأ "API key not valid"؟
- ✅ تأكد من صحة المفتاح
- ✅ فعّل APIs في Console
- ✅ تحقق من تقييد المفتاح

---

## 📚 الملفات المرجعية

- `docs/GOOGLE_MAPS_SETUP.md` - دليل شامل
- `دليل_استخدام_Google_Maps.md` - دليل الاستخدام
- `components/GoogleMap.tsx` - مكون الخريطة

---

**جاهز للاستخدام!** 🎉

