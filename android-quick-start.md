# ⚡ بدء سريع - تطبيق Android

## الخطوات السريعة (10 دقائق)

### 1️⃣ تثبيت المتطلبات
- ✅ Node.js 18+
- ✅ Java JDK 17+
- ✅ Android Studio

### 2️⃣ إعداد المشروع
```powershell
# تثبيت Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android --save-dev

# إعداد Android (سكريبت تلقائي)
npm run android:setup
```

### 3️⃣ بناء المشروع
```powershell
# بناء للمشروع
npm run build:android

# أو استخدام السكريبت التلقائي
npm run android:build
```

### 4️⃣ فتح في Android Studio
```powershell
npm run android:open
```

### 5️⃣ بناء APK
في Android Studio:
- **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
- انتظر حتى يكتمل البناء
- اضغط **locate** لفتح مجلد APK

---

## 📱 تثبيت على الجهاز

### الطريقة 1: عبر USB
1. فعّل **Developer Options** على Android
2. فعّل **USB Debugging**
3. وصّل الجهاز
4. في Android Studio: **Run** → **Run 'app'**

### الطريقة 2: نقل APK
1. انقل `app-debug.apk` إلى الجهاز
2. فعّل **تثبيت من مصادر غير معروفة**
3. افتح الملف وثبّت

---

## 🔄 تحديث التطبيق بعد التغييرات

```powershell
# 1. بناء المشروع
npm run build:android

# 2. مزامنة مع Android
npm run android:sync

# 3. إعادة البناء في Android Studio
```

---

## 📋 الأوامر السريعة

```powershell
# إعداد Android
npm run android:setup

# بناء المشروع
npm run android:build

# مزامنة
npm run android:sync

# فتح في Android Studio
npm run android:open
```

---

## 🎯 المسار الكامل

```powershell
# 1. الانتقال لمجلد المشروع
cd C:\Aqqilha

# 2. إعداد Android
npm run android:setup

# 3. بناء المشروع
npm run android:build

# 4. فتح في Android Studio
npm run android:open

# 5. بناء APK من Android Studio
# Build → Build Bundle(s) / APK(s) → Build APK(s)
```

---

## 📖 للتفاصيل الكاملة
راجع ملف `android-build-guide.md`

