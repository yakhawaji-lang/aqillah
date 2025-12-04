# إعداد قاعدة البيانات مع XAMPP

## الخطوات

### 1. تشغيل XAMPP
- افتح XAMPP Control Panel
- شغّل **MySQL** و **Apache**

### 2. إنشاء قاعدة البيانات
- افتح phpMyAdmin: http://localhost/phpmyadmin
- أو استخدم MySQL Command Line

#### الطريقة الأولى: عبر phpMyAdmin
1. افتح http://localhost/phpmyadmin
2. اضغط على "New" في القائمة الجانبية
3. أدخل اسم قاعدة البيانات: `aqillah`
4. اختر Collation: `utf8mb4_unicode_ci`
5. اضغط "Create"

#### الطريقة الثانية: عبر Command Line
```bash
mysql -u root -p
CREATE DATABASE aqillah CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. إعداد ملف .env
أنشئ ملف `.env` في المجلد الرئيسي:

```env
DATABASE_URL="mysql://root:@localhost:3306/aqillah"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**ملاحظات**:
- إذا كان MySQL لديه كلمة مرور، استخدم: `mysql://root:password@localhost:3306/aqillah`
- البورت الافتراضي لـ MySQL في XAMPP هو `3306`

### 4. توليد Prisma Client
```bash
npm run db:generate
```

### 5. إنشاء الجداول
```bash
npm run db:push
```

### 6. (اختياري) إضافة بيانات تجريبية
```bash
npm run db:seed
```

### 7. تشغيل المشروع
```bash
npm run dev
```

## التحقق من قاعدة البيانات

يمكنك التحقق من الجداول عبر phpMyAdmin:
1. افتح http://localhost/phpmyadmin
2. اختر قاعدة البيانات `aqillah`
3. ستجد جميع الجداول المنشأة

## استكشاف الأخطاء

### خطأ: Access denied
- تأكد من أن MySQL يعمل في XAMPP
- تحقق من اسم المستخدم وكلمة المرور في `.env`

### خطأ: Database doesn't exist
- تأكد من إنشاء قاعدة البيانات `aqillah` أولاً

### خطأ: Connection refused
- تأكد من أن MySQL يعمل على البورت 3306
- تحقق من إعدادات XAMPP

---

**عَقِلْها** - جاهز للعمل مع XAMPP! 🚀

