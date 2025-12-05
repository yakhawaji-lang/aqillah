# خطوات إنشاء مشروع جديد في Vercel 🚀

## 📋 الخطوات الكاملة

### الخطوة 1: إنشاء مشروع جديد

1. **في صفحة Vercel Dashboard، اضغط "Add New..." → "Project"**
2. **أو اضغط على "Import Project" في قسم "Deploy your first project"**

---

### الخطوة 2: اختيار المستودع

1. **ستظهر قائمة المستودعات من GitHub**
2. **ابحث عن `aqillah` أو `yakhawaji-lang/aqillah`**
3. **اضغط "Import" بجانب المستودع**

---

### الخطوة 3: إعداد المشروع

#### Project Name
- **القيمة:** `aqillah`
- **ملاحظة:** تأكد من أن الاسم `aqillah` فقط

#### Framework Preset
- **القيمة:** `Next.js`
- **الحالة:** ✅ سيتم اختياره تلقائياً

#### Root Directory
- **القيمة:** `./`
- **الحالة:** ✅ صحيح

#### Build and Output Settings

**Build Command:**
- **القيمة:** `prisma generate && npm run build`
- **ملاحظة:** يمكنك تركه فارغاً، Vercel سيقوم بقراءته من `vercel.json`

**Output Directory:**
- **القيمة:** `.next` أو `Next.js default`
- **الحالة:** ✅ سيتم اختياره تلقائياً

**Install Command:**
- **القيمة:** `npm install` (يمكن تركه كما هو)
- **ملاحظة:** Vercel سيقوم بقراءة `installCommand` من `vercel.json` تلقائياً

---

### الخطوة 4: إضافة Environment Variables

**⚠️ مهم جداً:** قبل الضغط على "Deploy"، أضف جميع Environment Variables!

#### القيم الصحيحة الكاملة:

**1. Google Maps API Keys:**

```
Key: NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY
Value: AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
```

```
Key: AQILLAH_MAPS_WEB_KEY
Value: AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
```

```
Key: AQILLAH_ROUTES_KEY
Value: AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
```

```
Key: AQILLAH_PLACES_KEY
Value: AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA
```

**2. OpenWeatherMap API:**

```
Key: OPENWEATHER_API_KEY
Value: 10ed05e69a4e4af467aa85eafab6c77b
```

**3. إعدادات التطبيق:**

```
Key: NODE_ENV
Value: production
```

```
Key: NEXT_PUBLIC_APP_URL
Value: https://aqillah.vercel.app
```

---

### الخطوة 5: Deploy

1. **بعد إضافة جميع Environment Variables**
2. **تأكد من أن جميع القيم صحيحة ومكتملة**
3. **اضغط "Deploy"**
4. **انتظر حتى يكتمل البناء (2-5 دقائق)**

---

## ✅ قائمة التحقق

قبل الضغط على "Deploy":

- [ ] Project Name: `aqillah`
- [ ] Framework Preset: `Next.js`
- [ ] Root Directory: `./`
- [ ] Build Command: `prisma generate && npm run build` (أو اتركه فارغاً)
- [ ] Output Directory: `.next` أو `Next.js default`
- [ ] Install Command: `npm install` (أو اتركه كما هو)
- [ ] تم إضافة جميع Environment Variables:
  - [ ] `NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY` = `AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ`
  - [ ] `AQILLAH_MAPS_WEB_KEY` = `AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ`
  - [ ] `AQILLAH_ROUTES_KEY` = `AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI`
  - [ ] `AQILLAH_PLACES_KEY` = `AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA`
  - [ ] `OPENWEATHER_API_KEY` = `10ed05e69a4e4af467aa85eafab6c77b`
  - [ ] `NODE_ENV` = `production`
  - [ ] `NEXT_PUBLIC_APP_URL` = `https://aqillah.vercel.app`

---

## 📝 ملاحظات مهمة

1. **تأكد من أن جميع القيم مكتملة:**
   - تبدأ بـ `AIzaSy` (وليس `AlzaSy`)
   - `NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY` (وليس `NEXT_PUBLIC_AQILLAH_MAPS_WEB_`)

2. **Vercel سيقوم بقراءة `vercel.json` تلقائياً:**
   - `installCommand: "npm install --include=dev"`
   - `buildCommand: "prisma generate && npm run build"`

3. **بعد نجاح الرفع:**
   - الموقع سيكون متاحاً على: `https://aqillah.vercel.app`
   - تأكد من تحديث Google Cloud Console restrictions

---

## 🚀 بعد نجاح الرفع

1. **اختبر الموقع:**
   ```
   https://aqillah.vercel.app
   ```

2. **حدث Google Cloud Console:**
   - اذهب إلى https://console.cloud.google.com
   - APIs & Services → Credentials
   - اضغط على API Key
   - أضف Domain: `https://aqillah.vercel.app/*` و `*.vercel.app/*`

---

**بالتوفيق! 🚀**

