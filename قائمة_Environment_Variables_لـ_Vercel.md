# 📋 قائمة Environment Variables المطلوبة في Vercel

## 🔑 Google Maps API Keys

### Android API Key (مطلوب):
```
AQILLAH_Andriod_KEY=AIzaSyBROlHr0XViLmXi9IzHM-MG68pgxufslLU
```

### Web API Keys (اختياري - للويب):
```
AQILLAH_PLACES_KEY=your_places_api_key
AQILLAH_MAPS_WEB_KEY=your_maps_web_key
AQILLAH_ROUTES_KEY=your_routes_key
```

## 🗄️ Database

```
DATABASE_URL=your_database_connection_string
```

**مثال:**
```
DATABASE_URL=mysql://user:password@host:3306/aqillah
```

## 🌐 App Configuration

```
NEXT_PUBLIC_APP_URL=https://aqillah.vercel.app
```

## 🌤️ Weather API (إن كان مستخدماً)

```
OPENWEATHER_API_KEY=your_openweather_api_key
```

## 📝 كيفية الإضافة في Vercel

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. افتح مشروع `aqillah`
3. اضغط على **Settings**
4. اضغط على **Environment Variables**
5. أضف كل متغير:
   - **Name:** اسم المتغير
   - **Value:** القيمة
   - **Environment:** اختر Production, Preview, Development (أو جميعها)
6. اضغط **Save**

## ⚠️ ملاحظات مهمة

- **AQILLAH_Andriod_KEY** مطلوب للتطبيق Android
- **DATABASE_URL** مطلوب إذا كنت تستخدم قاعدة بيانات
- بعد إضافة المتغيرات، سيتم إعادة البناء تلقائياً
- تأكد من أن جميع القيم صحيحة

## ✅ التحقق

بعد إضافة المتغيرات:
1. انتظر اكتمال البناء
2. افتح الموقع: https://aqillah.vercel.app
3. جرب البحث عن المواقع
4. تحقق من Console Logs في Vercel

