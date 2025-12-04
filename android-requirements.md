# 📋 متطلبات بناء تطبيق Android - عَقِلْها

## المتطلبات الأساسية

### 1. Node.js (18+)
- **التحميل**: https://nodejs.org/
- **التحقق**: `node --version`

### 2. Java JDK (17 أو أحدث)
- **التحميل**: https://www.oracle.com/java/technologies/downloads/
- **التحقق**: `java -version`
- **ملاحظة**: تأكد من إعداد متغير البيئة `JAVA_HOME`

### 3. Android Studio
- **التحميل**: https://developer.android.com/studio
- **يتضمن**: Android SDK, Android Emulator, Gradle

### 4. Android SDK
- يأتي مع Android Studio تلقائيًا
- **الحد الأدنى**: API Level 21 (Android 5.0)
- **الموصى به**: API Level 33+ (Android 13+)

---

## إعداد متغيرات البيئة

### Windows

1. افتح **System Properties** → **Environment Variables**

2. أضف متغيرات جديدة:

```
JAVA_HOME=C:\Program Files\Java\jdk-17
ANDROID_HOME=C:\Users\YourUsername\AppData\Local\Android\Sdk
```

3. أضف إلى `Path`:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
```

### التحقق من الإعداد

```powershell
java -version
adb version
```

---

## تثبيت Android SDK Components

من Android Studio:

1. افتح **Tools** → **SDK Manager**
2. تأكد من تثبيت:
   - ✅ Android SDK Platform-Tools
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Platform (API 33)
   - ✅ Google Play services

---

## الحد الأدنى للمواصفات

### الكمبيوتر
- **RAM**: 8 GB (16 GB موصى به)
- **مساحة القرص**: 10 GB على الأقل
- **المعالج**: أي معالج حديث

### جهاز Android للاختبار
- **الإصدار**: Android 5.0 (API 21) أو أحدث
- **RAM**: 2 GB على الأقل

---

## التحقق من التثبيت

### 1. Node.js و npm
```powershell
node --version
npm --version
```

### 2. Java
```powershell
java -version
javac -version
```

### 3. Android SDK
```powershell
adb version
```

### 4. Gradle (يأتي مع Android Studio)
```powershell
cd android
.\gradlew --version
```

---

## حل المشاكل الشائعة

### المشكلة: "JAVA_HOME is not set"

**الحل**:
```powershell
# Windows PowerShell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

أو أضفه إلى متغيرات البيئة بشكل دائم.

### المشكلة: "SDK location not found"

**الحل**:
1. افتح Android Studio
2. **File** → **Project Structure** → **SDK Location**
3. انسخ المسار
4. أضفه إلى `android/local.properties`:
```properties
sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
```

### المشكلة: "Gradle sync failed"

**الحل**:
1. افتح Android Studio
2. **File** → **Invalidate Caches / Restart**
3. اختر **Invalidate and Restart**

---

## روابط مفيدة

- **Android Developer Guide**: https://developer.android.com/guide
- **Capacitor Documentation**: https://capacitorjs.com/docs
- **Next.js Static Export**: https://nextjs.org/docs/app/building-your-application/deploying/static-exports

---

**تم التحديث**: 2024

