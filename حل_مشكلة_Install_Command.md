# حل مشكلة Install Command غير قابل للتعديل 🔧

## ✅ الحل: Vercel يقرأ vercel.json تلقائياً!

إذا كان حقل "Install Command" غير قابل للتعديل في واجهة Vercel، لا تقلق! 

**Vercel يقرأ الإعدادات من ملف `vercel.json` تلقائياً.**

---

## ✅ ما تم إعداده بالفعل

تم إعداد ملف `vercel.json` في المشروع وهو موجود على GitHub:

```json
{
  "buildCommand": "prisma generate && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install --include=dev",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Vercel سيقوم بـ:**
1. قراءة `vercel.json` تلقائياً
2. استخدام `npm install --include=dev` كـ Install Command
3. استخدام `prisma generate && npm run build` كـ Build Command

---

## 📋 الإعدادات المطلوبة في Vercel

### 1. Project Name
- **القيمة:** `aqillah`

### 2. Framework Preset
- **القيمة:** `Next.js` (سيتم اختياره تلقائياً)

### 3. Root Directory
- **القيمة:** `./`

### 4. Build Command
- **القيمة:** يمكنك تركه فارغاً أو `prisma generate && npm run build`
- **ملاحظة:** Vercel سيقوم بقراءة `buildCommand` من `vercel.json` تلقائياً

### 5. Output Directory
- **القيمة:** `.next` أو `Next.js default` (سيتم اختياره تلقائياً)

### 6. Install Command
- **القيمة:** يمكنك تركه كما هو (`npm install`)
- **ملاحظة:** Vercel سيقوم بقراءة `installCommand` من `vercel.json` تلقائياً وسيستخدم `npm install --include=dev`

### 7. Environment Variables
- أضف جميع المتغيرات المطلوبة

---

## ✅ قائمة التحقق

قبل الضغط على "Deploy":

- [ ] Project Name: `aqillah`
- [ ] Framework Preset: `Next.js`
- [ ] Root Directory: `./`
- [ ] Build Command: يمكن تركه فارغاً (سيتم قراءته من vercel.json)
- [ ] Output Directory: `.next` أو `Next.js default`
- [ ] Install Command: يمكن تركه كما هو (سيتم قراءته من vercel.json)
- [ ] تم إضافة جميع Environment Variables
- [ ] جميع API Keys صحيحة ومكتملة

---

## 🔍 كيف تتأكد أن Vercel قرأ vercel.json؟

بعد الضغط على "Deploy"، في Build Logs ستجد:

```
Running "install" command: `npm install --include=dev`...
```

إذا رأيت هذا، يعني أن Vercel قرأ `vercel.json` بنجاح! ✅

---

## 🚀 الخطوات النهائية

1. **اترك Install Command كما هو** (`npm install`)
2. **اترك Build Command فارغاً أو كما هو** (Vercel سيقوم بقراءته من vercel.json)
3. **أضف جميع Environment Variables**
4. **اضغط "Deploy"**
5. **راقب Build Logs** للتأكد من أن Vercel يستخدم الأوامر الصحيحة

---

## 📝 ملاحظات مهمة

1. **vercel.json موجود على GitHub:** ✅
2. **Vercel يقرأه تلقائياً:** ✅
3. **لا حاجة لتعديل الحقول يدوياً:** ✅

---

## 🆘 إذا استمرت المشكلة

إذا استمرت المشكلة بعد الرفع:

1. تحقق من Build Logs في Vercel
2. تأكد من أن `vercel.json` موجود في المشروع على GitHub
3. تأكد من أن جميع Environment Variables صحيحة

---

**بالتوفيق! 🚀**

**Vercel سيقوم بقراءة vercel.json تلقائياً، لا تقلق!**

