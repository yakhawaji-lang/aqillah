# حل مشكلة prisma generate في Vercel 🔧

## 🔍 المشكلة

`prisma generate` يحتاج إلى `DATABASE_URL` حتى لو كان فقط لتوليد Client.

## ✅ الحل

### إضافة DATABASE_URL كـ Environment Variable في Vercel

**الخطوات:**

1. **في Vercel Dashboard:**
   - اذهب إلى المشروع `aqillah`
   - اضغط على **Settings** → **Environment Variables**

2. **أضف متغير جديد:**
   ```
   Key: DATABASE_URL
   Value: mysql://user:password@localhost:3306/database
   ```
   
   **أو استخدم قيمة وهمية للبناء فقط:**
   ```
   Key: DATABASE_URL
   Value: mysql://dummy:dummy@localhost:3306/dummy
   ```

3. **اختر Environment:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development

4. **اضغط "Save"**

5. **اضغط "Redeploy"** لتطبيق التغييرات

---

## 📋 Environment Variables المطلوبة الكاملة

### المتغيرات الأساسية:

```
NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_MAPS_WEB_KEY=AIzaSyDZgR_h8J5a4UsqmzRNFBlo28412mT25kQ
AQILLAH_ROUTES_KEY=AIzaSyC9zyma4lZ9YSDPlbDh3ZbVsYJkCXLs5gI
AQILLAH_PLACES_KEY=AIzaSyB4R5NLRQMsQO84Uu1gQWPgmgPR_P9NoXA
OPENWEATHER_API_KEY=10ed05e69a4e4af467aa85eafab6c77b
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://aqillah.vercel.app
```

### المتغير الجديد (مهم للبناء):

```
DATABASE_URL=mysql://dummy:dummy@localhost:3306/dummy
```

**ملاحظة:** هذه القيمة وهمية للبناء فقط. يمكنك إضافة قيمة حقيقية لاحقاً من PlanetScale.

---

## ✅ قائمة التحقق

قبل Redeploy:

- [ ] تم إضافة `DATABASE_URL` في Environment Variables
- [ ] تم إضافة جميع المتغيرات الأخرى
- [ ] جميع القيم صحيحة ومكتملة
- [ ] تم اختيار جميع Environments (Production, Preview, Development)

---

## 🚀 بعد إضافة DATABASE_URL

1. **اضغط "Save"**
2. **اضغط "Redeploy"**
3. **انتظر حتى يكتمل البناء**
4. **الموقع سيكون متاحاً على:** `https://aqillah.vercel.app`

---

## 📝 ملاحظات

1. **DATABASE_URL وهمي للبناء:**
   - `prisma generate` يحتاج فقط إلى وجود المتغير
   - لا يحتاج إلى قاعدة بيانات حقيقية للبناء
   - يمكنك إضافة قيمة حقيقية لاحقاً من PlanetScale

2. **بعد إضافة قاعدة بيانات حقيقية:**
   - استبدل `DATABASE_URL` بقيمة PlanetScale
   - اضغط "Redeploy"

---

**بالتوفيق! 🚀**

