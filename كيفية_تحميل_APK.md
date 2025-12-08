# 📱 كيفية تحميل ملف APK

## ⚠️ ملاحظة مهمة

ملف APK كبير جداً (62+ MB) ولا يمكن رفعه على GitHub مباشرة. 

## 🔧 الحلول المتاحة

### الحل 1: بناء APK محلياً (موصى به)

1. **تأكد من تثبيت المتطلبات:**
   - Node.js 18+
   - Android Studio
   - Java JDK 17+

2. **بناء APK:**
   ```bash
   npm run build:android
   npm run android:sync
   cd android
   ./gradlew.bat assembleDebug
   ```

3. **الملف سيكون في:**
   ```
   android/app/build/outputs/apk/debug/app-debug.apk
   ```

4. **انسخ الملف وسمّه `aqillah.apk`**

### الحل 2: استخدام Git LFS (للمطورين)

إذا كنت تريد رفع الملف على GitHub:

1. **تثبيت Git LFS:**
   ```bash
   git lfs install
   ```

2. **تتبع ملفات APK:**
   ```bash
   git lfs track "*.apk"
   git add .gitattributes
   git add public/downloads/aqillah.apk
   git commit -m "إضافة APK باستخدام Git LFS"
   git push origin main
   ```

### الحل 3: رفع الملف على خدمة تخزين خارجية

يمكنك رفع APK على:
- Google Drive
- Dropbox
- OneDrive
- أو أي خدمة تخزين سحابية أخرى

ثم أضف الرابط في `app/page.tsx` بدلاً من `/api/download/apk`

## 📍 الموقع الحالي لـ APK

بعد البناء، الملف موجود في:
```
C:\Aqqilha\android\app\build\outputs\apk\debug\app-debug.apk
```

انسخه إلى:
```
C:\Aqqilha\public\downloads\aqillah.apk
```

## ✅ بعد نسخ الملف

الملف سيكون متاحاً للتحميل من:
- `https://aqillah.vercel.app/api/download/apk`
- أو مباشرة من `https://aqillah.vercel.app/downloads/aqillah.apk`

---

**ملاحظة:** الملف موجود محلياً في `public/downloads/aqillah.apk` لكنه غير موجود في Git بسبب الحجم الكبير.


