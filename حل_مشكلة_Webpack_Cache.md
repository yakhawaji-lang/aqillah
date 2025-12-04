# حل مشكلة Webpack Cache

## المشكلة
عند تشغيل `npm run dev`، تظهر رسائل تحذيرية:
```
[w] [webpack.cache.PackFileCacheStrategy] Restoring failed...
Error: incorrect header check
```

## الحل

### الطريقة السريعة (Windows PowerShell)
```powershell
npm run clean:win
```

أو يدوياً:
```powershell
# مسح Next.js cache
Remove-Item -Recurse -Force .next

# مسح node_modules cache
Remove-Item -Recurse -Force node_modules\.cache
```

### الطريقة السريعة (Linux/Mac)
```bash
npm run clean
```

أو يدوياً:
```bash
rm -rf .next node_modules/.cache
```

### بعد المسح
أعد تشغيل السيرفر:
```powershell
npm run dev
```

## لماذا تحدث هذه المشكلة؟

1. **Cache تالف**: أحياناً يتلف cache بعد تحديثات أو إيقاف غير طبيعي
2. **تغييرات في الكود**: تغييرات كبيرة قد تجعل cache غير متوافق
3. **مشاكل في القرص**: أحياناً مشاكل في القرص الصلب تسبب تلف cache

## متى يجب مسح Cache؟

- عند ظهور أخطاء `incorrect header check`
- عند تغييرات كبيرة في الكود
- عند مشاكل في التحميل أو البناء
- بعد تحديث Next.js أو dependencies

## ملاحظات

- مسح cache آمن تماماً - سيتم إعادة بناءه تلقائياً
- قد يستغرق البناء الأول بعد المسح وقتاً أطول قليلاً
- لا يؤثر على الكود أو البيانات

