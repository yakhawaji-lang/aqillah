#!/usr/bin/env node

/**
 * سكريبت بناء تطبيق Android
 * Script to build Android app
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 بدء بناء تطبيق Android...\n');

// التحقق من وجود Capacitor
try {
  execSync('npx cap --version', { stdio: 'ignore' });
} catch (error) {
  console.error('❌ Capacitor غير مثبت!');
  console.log('📦 جاري التثبيت...\n');
  execSync('npm install @capacitor/core @capacitor/cli @capacitor/android', { stdio: 'inherit' });
}

// تعيين متغير البيئة للبناء
process.env.BUILD_FOR_ANDROID = 'true';
process.env.NODE_ENV = 'production';

// بناء المشروع
console.log('📦 بناء المشروع...\n');
try {
  // بناء Next.js مع output: export
  execSync('npm run build:android', { stdio: 'inherit', env: { ...process.env } });
  console.log('\n✅ تم بناء المشروع بنجاح!\n');
} catch (error) {
  console.error('\n❌ فشل بناء المشروع!');
  console.error('تأكد من أن next.config.js يحتوي على output: export عند BUILD_FOR_ANDROID=true');
  process.exit(1);
}

// التحقق من وجود مجلد android
if (!fs.existsSync(path.join(process.cwd(), 'android'))) {
  console.log('📱 إضافة منصة Android...\n');
  try {
    execSync('npx cap add android', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ فشل إضافة منصة Android!');
    process.exit(1);
  }
}

// مزامنة الملفات
console.log('🔄 مزامنة الملفات مع Android...\n');
try {
  execSync('npx cap sync android', { stdio: 'inherit' });
  console.log('\n✅ تمت المزامنة بنجاح!\n');
} catch (error) {
  console.error('\n❌ فشلت المزامنة!');
  process.exit(1);
}

console.log('🎉 اكتمل البناء بنجاح!\n');
console.log('📱 لفتح المشروع في Android Studio:');
console.log('   npx cap open android\n');
console.log('🔨 لبناء APK من Android Studio:');
console.log('   Build → Build Bundle(s) / APK(s) → Build APK(s)\n');

