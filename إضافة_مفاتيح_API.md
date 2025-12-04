# 🔑 إضافة مفاتيح API إلى .env

## ⚠️ مهم: أضف هذه المفاتيح إلى ملف `.env`

افتح ملف `.env` في جذر المشروع وأضف:

```env
# Google Maps Platform - AQILLAH Keys
AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_ROUTES_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
AQILLAH_PLACES_KEY=AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA

# Public Keys (for client-side)
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ

# Legacy Keys (for backward compatibility)
GOOGLE_MAPS_API_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
GOOGLE_ROUTES_API_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
```

---

## ✅ ما تم تحديثه

### 1. `config/google-maps.ts`
- ✅ يستخدم `AQILLAH_MAPS_WEB_KEY` للخرائط
- ✅ يستخدم `AQILLAH_ROUTES_KEY` للمسارات
- ✅ يستخدم `AQILLAH_PLACES_KEY` للبحث

### 2. `lib/services/google-maps.ts`
- ✅ يستخدم المفاتيح الجديدة
- ✅ Fallback للمفاتيح القديمة

### 3. `components/GoogleMap.tsx`
- ✅ يستخدم `NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY`

---

## 🧪 اختبار

بعد إضافة المفاتيح:

```bash
# أعد تشغيل dev server
npm run dev

# اختبار APIs
# افتح: http://localhost:3000/api/test-google-maps?test=all
```

---

## 📋 المفاتيح المضافة

| المفتاح | الاستخدام | القيمة |
|---------|-----------|--------|
| `AQILLAH_MAPS_WEB_KEY` | الخرائط | `AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ` |
| `AQILLAH_ROUTES_KEY` | المسارات | `AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI` |
| `AQILLAH_PLACES_KEY` | البحث | `AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA` |

---

**بعد إضافة المفاتيح، أعد تشغيل `npm run dev`**

