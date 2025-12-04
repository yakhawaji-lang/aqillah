# 🔧 حل مشكلة Capacitor Sync

## ⚠️ المشكلة

```
[error] Could not find the web assets directory: .\out.
```

## ✅ الحل

### الخطوة 1: بناء المشروع أولاً

```powershell
npm run build:android
```

هذا الأمر سيقوم بـ:
- بناء Next.js مع `output: export`
- إنشاء مجلد `out` مع جميع الملفات الثابتة

### الخطوة 2: بعد اكتمال البناء

```powershell
# مزامنة الملفات مع Android
npx cap sync android
```

### الخطوة 3: فتح في Android Studio

```powershell
npx cap open android
```

---

## 📋 الترتيب الصحيح

1. ✅ **بناء المشروع**: `npm run build:android`
2. ✅ **مزامنة**: `npx cap sync android`
3. ✅ **فتح**: `npx cap open android`

---

## ⚠️ ملاحظات مهمة

- **لا تحاول sync قبل البناء**: يجب أن يكون مجلد `out` موجوداً أولاً
- **تحقق من capacitor.config.json**: يجب أن يكون `webDir: "out"`
- **انتظر اكتمال البناء**: قد يستغرق بضع دقائق

---

## 🔍 التحقق من البناء

بعد البناء، تحقق من وجود:

```
out/
  ├── index.html
  ├── _next/
  └── ...
```

---

## ✅ بعد Sync الناجح

سترى:

```
✅ Copying web assets from out to android/app/src/main/assets/public
✅ Copying native bridge
✅ Updating plugins
✅ Syncing Android project
```

---

**تم التحديث**: 2024

