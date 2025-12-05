# الإعدادات الصحيحة لـ Vercel ✅

## 📋 قائمة الإعدادات المطلوبة

### 1. Vercel Team
- **القيمة:** اختر فريقك (Yahya's projects)
- **الخطة:** Hobby (مجاني)

---

### 2. Project Name
- **القيمة:** `aqillah`
- **ملاحظة:** لا تستخدم `aqillah-dgjs`، استخدم `aqillah` فقط

---

### 3. Framework Preset
- **القيمة:** `Next.js`
- **الحالة:** ✅ صحيح (سيتم اختياره تلقائياً)

---

### 4. Root Directory
- **القيمة:** `./`
- **الحالة:** ✅ صحيح

---

### 5. Build and Output Settings

#### Build Command
- **القيمة:** `prisma generate && npm run build`
- **الحالة:** ✅ صحيح

#### Output Directory
- **القيمة:** `.next` أو `Next.js default`
- **الحالة:** ✅ صحيح (سيتم اختياره تلقائياً)

#### Install Command
- **القيمة:** `npm install --include=dev`
- **⚠️ مهم:** يجب أن يكون `npm install --include=dev` وليس `npm install` فقط
- **السبب:** لضمان تثبيت جميع الحزم بما فيها devDependencies

---

### 6. Environment Variables

أضف هذه المتغيرات:

```
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_ROUTES_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
AQILLAH_PLACES_KEY=AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA
OPENWEATHER_API_KEY=10ed05e69a4e4af467aa85eafab6c77b
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aqillah.vercel.app
```

---

## ✅ قائمة التحقق

قبل الضغط على "Deploy":

- [ ] Project Name: `aqillah` (وليس aqillah-dgjs)
- [ ] Framework Preset: `Next.js`
- [ ] Root Directory: `./`
- [ ] Build Command: `prisma generate && npm run build`
- [ ] Output Directory: `.next` أو `Next.js default`
- [ ] Install Command: `npm install --include=dev` ⚠️ مهم جداً!
- [ ] تم إضافة جميع Environment Variables
- [ ] جميع API Keys صحيحة ومكتملة

---

## 🔧 كيفية تعديل Install Command

1. في قسم "Build and Output Settings"
2. اضغط على أيقونة القلم ✏️ بجانب "Install Command"
3. غيّر من `npm install` إلى `npm install --include=dev`
4. اضغط "Save" أو "Apply"

---

## 📝 ملاحظات مهمة

1. **Project Name:** استخدم `aqillah` فقط، لا تضيف أرقام أو أحرف إضافية
2. **Install Command:** يجب أن يكون `npm install --include=dev` لضمان تثبيت tailwindcss
3. **Build Command:** يجب أن يبدأ بـ `prisma generate` ثم `npm run build`
4. **Environment Variables:** تأكد من أن جميع القيم مكتملة (تبدأ بـ `AIzaSy`)

---

## 🚀 بعد التأكد من جميع الإعدادات

1. اضغط "Deploy"
2. انتظر حتى يكتمل البناء (2-5 دقائق)
3. الموقع سيكون متاحاً على: `https://aqillah.vercel.app`

---

**بالتوفيق! 🚀**

