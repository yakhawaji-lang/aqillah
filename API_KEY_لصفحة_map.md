# API KEY المستخدم في صفحة `/map`

## 📍 الصفحة
`http://localhost:3000/map`

## 🔑 API KEY المستخدم

صفحة `/map` تستخدم مكون `GoogleTrafficMap` الذي يقرأ API Key من متغيرات البيئة التالية:

### الأولوية:
1. **`NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY`** (الأولوية الأولى)
2. **`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`** (بديل)

## 📝 الكود

في ملف `components/GoogleTrafficMap.tsx` (السطر 80):

```typescript
const apiKey = process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

## ✅ التحقق من API KEY

### الطريقة 1: عبر API Route
```
http://localhost:3000/api/test-maps
```

### الطريقة 2: عبر Console في المتصفح
افتح Console (F12) واكتب:
```javascript
console.log(process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY)
```

## 📋 معلومات API KEY الحالي

من فحص النظام:
- ✅ **API Key موجود**: نعم
- ✅ **الطول**: 39 حرف
- ✅ **البادئة**: `AIzaSyDZgR...`
- ✅ **المتغيرات المحددة**:
  - `NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY`: ✅ موجود
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: ✅ موجود
  - `AQILLAH_MAPS_WEB_KEY`: ✅ موجود

## 🔧 إعداد API KEY

### في ملف `.env`:
```env
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=your_api_key_here
```

### ملاحظات مهمة:
1. **`NEXT_PUBLIC_`** ضروري لأن المكون يعمل في المتصفح (Client-side)
2. يجب إعادة تشغيل Next.js بعد إضافة/تعديل المتغيرات
3. API Key يجب أن يكون مفعّل في Google Cloud Console

## 🎯 الاستخدام

صفحة `/map` تستخدم هذا API Key لـ:
- ✅ تحميل Google Maps JavaScript API
- ✅ عرض الخريطة مع Traffic Layer
- ✅ عرض الـ Markers
- ✅ عرض المسارات (Routes)

## 📚 الملفات ذات الصلة

- `components/GoogleTrafficMap.tsx` - المكون الرئيسي
- `app/map/page.tsx` - صفحة الخريطة
- `config/google-maps.ts` - إعدادات Google Maps
- `app/api/test-maps/route.ts` - API للتحقق من المفتاح

## 🔍 التحقق من المفتاح

لرؤية معلومات المفتاح الحالي:
```powershell
# عبر PowerShell
curl http://localhost:3000/api/test-maps | ConvertFrom-Json
```

أو افتح في المتصفح:
```
http://localhost:3000/api/test-maps
```

