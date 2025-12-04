# 🗺️ دليل إعداد Google Maps APIs

## 📋 الخطوات الأساسية

### 1. إنشاء مشروع في Google Cloud Console

1. اذهب إلى: https://console.cloud.google.com/
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. سجّل الدخول بحساب Google

---

### 2. تفعيل APIs المطلوبة

في Google Cloud Console، اذهب إلى **APIs & Services** → **Library** وفعّل:

#### APIs الأساسية:
- ✅ **Maps JavaScript API** - للخرائط في الويب
- ✅ **Routes API** - لحساب المسارات
- ✅ **Directions API** - للاتجاهات (Legacy - اختياري)
- ✅ **Geocoding API** - لتحويل العناوين إلى إحداثيات
- ✅ **Places API** - للبحث عن الأماكن
- ✅ **Maps SDK for Android** - لتطبيق Android
- ✅ **Maps SDK for iOS** - لتطبيق iOS (إن لزم)

#### APIs الطقس (إن كانت متاحة):
- ✅ **Weather API** - بيانات الطقس
- ✅ **Environment API** - بيانات بيئية

---

### 3. إنشاء API Keys

1. اذهب إلى **APIs & Services** → **Credentials**
2. اضغط **Create Credentials** → **API Key**
3. انسخ المفتاح فوراً (سيظهر مرة واحدة)

#### إنشاء مفاتيح منفصلة (موصى به):
- **Maps API Key** - للخرائط فقط
- **Routes API Key** - للمسارات فقط
- **Weather API Key** - للطقس فقط

---

### 4. تقييد API Keys (أمان)

لكل مفتاح، اضغط **Edit** وقيّد:

#### تقييد التطبيق:
- **HTTP referrers** (للويب):
  ```
  http://localhost:3000/*
  https://yourdomain.com/*
  ```

- **Android apps** (للتطبيق):
  ```
  Package name: sa.gov.aqillah
  SHA-1 certificate fingerprint: [your SHA-1]
  ```

#### تقييد APIs:
- حدد فقط APIs التي يحتاجها المفتاح

---

### 5. إضافة المفاتيح إلى المشروع

أنشئ ملف `.env` في جذر المشروع:

```env
# Google Maps APIs
GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_ROUTES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_WEATHER_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Optional: Separate keys for different environments
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

---

## 🔧 التكامل في المشروع

### 1. تحديث Google Maps Service

الملف موجود في: `lib/services/google-maps.ts`

يستخدم المفاتيح من `.env` تلقائياً.

### 2. استخدام في المكونات

```typescript
import { googleMapsService } from '@/lib/services/google-maps'

// حساب مسار
const route = await googleMapsService.calculateRoute({
  origin: { lat: 24.7136, lng: 46.6753 },
  destination: { lat: 24.6876, lng: 46.6879 },
  departureTime: 'now',
})

// Geocoding
const geocode = await googleMapsService.geocode({
  address: 'الرياض، المملكة العربية السعودية'
})
```

### 3. استخدام في React Components

```typescript
'use client'

import { useEffect } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

export default function GoogleMapComponent() {
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places', 'routes']
    })

    loader.load().then((google) => {
      const map = new google.maps.Map(document.getElementById('map'), {
        center: { lat: 24.7136, lng: 46.6753 },
        zoom: 12,
      })
    })
  }, [])

  return <div id="map" style={{ width: '100%', height: '400px' }} />
}
```

---

## 📱 استخدام في Android

### 1. إضافة إلى `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="YOUR_ANDROID_API_KEY"/>
</application>
```

### 2. في Capacitor Config:

```json
{
  "plugins": {
    "GoogleMaps": {
      "apiKey": "YOUR_ANDROID_API_KEY"
    }
  }
}
```

---

## 🧪 اختبار APIs

### اختبار Routes API:

```bash
curl "https://routes.googleapis.com/directions/v2:computeRoutes" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-Goog-Api-Key: YOUR_API_KEY" \
  -d '{
    "origin": {
      "location": {
        "latLng": {
          "latitude": 24.7136,
          "longitude": 46.6753
        }
      }
    },
    "destination": {
      "location": {
        "latLng": {
          "latitude": 24.6876,
          "longitude": 46.6879
        }
      }
    },
    "travelMode": "DRIVE",
    "routingPreference": "TRAFFIC_AWARE"
  }'
```

---

## 💰 التكاليف

### Pricing (اعتباراً من 2024):

- **Maps JavaScript API**: 
  - أول 28,000 تحميل/شهر: مجاني
  - بعد ذلك: $7 لكل 1,000 تحميل

- **Routes API**:
  - أول 40,000 طلب/شهر: مجاني
  - بعد ذلك: $5 لكل 1,000 طلب

- **Geocoding API**:
  - أول 40,000 طلب/شهر: مجاني
  - بعد ذلك: $5 لكل 1,000 طلب

### نصائح لتقليل التكاليف:
1. ✅ استخدام Caching
2. ✅ تقليل عدد الطلبات
3. ✅ استخدام Static Maps للخرائط الثابتة
4. ✅ مراقبة الاستخدام في Console

---

## 🔍 مراقبة الاستخدام

1. اذهب إلى **APIs & Services** → **Dashboard**
2. راقب:
   - عدد الطلبات
   - الأخطاء
   - التكاليف
   - APIs الأكثر استخداماً

---

## ⚠️ ملاحظات مهمة

1. **لا تشارك API Keys** في GitHub
2. **قيّد المفاتيح** حسب الحاجة
3. **راقب الاستخدام** بانتظام
4. **استخدم Caching** لتقليل الطلبات
5. **اختبر في Development** قبل Production

---

## 🚀 الخطوات التالية

1. ✅ إنشاء مشروع Google Cloud
2. ✅ تفعيل APIs
3. ✅ إنشاء API Keys
4. ✅ إضافة المفاتيح إلى `.env`
5. ✅ اختبار APIs
6. ✅ نشر المشروع

---

**تم التحديث**: 2024

