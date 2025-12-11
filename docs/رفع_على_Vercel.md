# رفع التطبيق على Vercel

## الخطوات

### 1. التأكد من رفع التغييرات على GitHub

جميع التغييرات موجودة على GitHub:
- ✅ `scripts/generate-realistic-data.ts`
- ✅ `app/api/data/update/route.ts`
- ✅ `docs/إضافة_البيانات_الواقعية.md`
- ✅ تحديثات `package.json`

**المستودع:** https://github.com/yakhawaji-lang/aqillah.git
**آخر commit:** `0fa1958` - إضافة نظام شامل لإضافة بيانات واقعية

### 2. ربط المشروع مع Vercel

#### أ) عبر Vercel Dashboard:

1. اذهب إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط على **"Add New Project"**
3. اختر المستودع `yakhawaji-lang/aqillah`
4. Vercel سيكتشف تلقائياً أنه مشروع Next.js

#### ب) عبر Vercel CLI:

```bash
# تثبيت Vercel CLI
npm i -g vercel

# تسجيل الدخول
vercel login

# ربط المشروع
vercel

# رفع التغييرات
vercel --prod
```

### 3. إعداد Environment Variables في Vercel

اذهب إلى **Project Settings** > **Environment Variables** وأضف:

#### متغيرات قاعدة البيانات:
```
DATABASE_URL=your_mysql_connection_string
```

#### متغيرات Google Maps:
```
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=your_google_maps_api_key
AQILLAH_MAPS_WEB_KEY=your_google_maps_api_key
AQILLAH_PLACES_KEY=your_places_api_key
AQILLAH_ROUTES_KEY=your_routes_api_key
```

#### متغيرات OpenWeatherMap:
```
OPENWEATHER_API_KEY=your_openweather_api_key
```

### 4. إعدادات البناء

في Vercel، تأكد من:
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (افتراضي)
- **Install Command:** `npm install`

### 5. Deploy

بعد ربط المشروع وإعداد Environment Variables:
- Vercel سيقوم بالبناء تلقائياً عند كل push إلى `main`
- أو يمكنك الضغط على **"Deploy"** يدوياً

### 6. التحقق من النشر

بعد النشر، ستجد رابط التطبيق في:
- **Vercel Dashboard** > **Deployments**
- مثال: `https://aqillah.vercel.app`

### 7. إعداد تحديث البيانات التلقائي

بعد النشر على Vercel، يمكنك إعداد cron job لتحديث البيانات:

#### استخدام Vercel Cron Jobs:

أنشئ ملف `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/data/update",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

هذا سيقوم بتحديث البيانات كل 5 دقائق تلقائياً.

#### أو استخدام خدمة خارجية:

- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)

قم بإعداد cron job لاستدعاء:
```
https://your-app.vercel.app/api/data/update
كل 5 دقائق
```

## ملاحظات مهمة

### قاعدة البيانات:
- تأكد من أن قاعدة البيانات متاحة من Vercel
- استخدم قاعدة بيانات سحابية (PlanetScale, Supabase, Railway)
- أو استخدم Vercel Postgres

### API Keys:
- تأكد من تفعيل Billing في Google Cloud Console
- أضف نطاق Vercel في قيود API key:
  ```
  https://*.vercel.app/*
  https://your-domain.com/*
  ```

### تحديث البيانات:
- بعد النشر، قم بتشغيل `npm run db:seed:realistic` مرة واحدة
- أو استخدم API endpoint: `POST /api/data/update`

## استكشاف الأخطاء

### المشكلة: فشل البناء
**الحل:**
- تحقق من Environment Variables
- تأكد من أن جميع المتغيرات المطلوبة موجودة
- راجع Build Logs في Vercel Dashboard

### المشكلة: قاعدة البيانات غير متاحة
**الحل:**
- استخدم قاعدة بيانات سحابية
- تأكد من أن DATABASE_URL صحيح
- تحقق من إعدادات Firewall

### المشكلة: API keys لا تعمل
**الحل:**
- تحقق من قيود HTTP referrers في Google Cloud Console
- أضف نطاق Vercel إلى القائمة المسموح بها
- تأكد من تفعيل Billing

## روابط مفيدة

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Cron Jobs](https://vercel.com/docs/cron-jobs)

