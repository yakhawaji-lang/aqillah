# ملخص استخدام OpenWeatherMap API Key

## 🔑 المفتاح المستخدم

**اسم المتغير**: `OPENWEATHER_API_KEY`

**القيمة الحالية**: `10ed05e69a4e4af467aa85eafab6c77b`

**الموقع**: موجود في ملف `.env`

## 📍 أماكن الاستخدام

### 1. ملف التكوين (`config/weather.ts`)
```typescript
openWeather: {
  apiKey: process.env.OPENWEATHER_API_KEY || '',
  apiUrl: 'https://api.openweathermap.org/data/2.5',
  enabled: !!process.env.OPENWEATHER_API_KEY,
}
```

### 2. خدمة الطقس (`lib/services/weather.ts`)

#### أ. جلب الطقس الحالي (`getOpenWeatherWeather`)
- **Endpoint**: `https://api.openweathermap.org/data/2.5/weather`
- **الاستخدام**: جلب بيانات الطقس الحالية
- **المعاملات**: `lat`, `lng`, `appid` (API Key)

#### ب. جلب التنبؤات (`getOpenWeatherForecast`)
- **Endpoint**: `https://api.openweathermap.org/data/2.5/forecast/daily`
- **الاستخدام**: جلب تنبؤات الطقس حتى 16 يوم
- **المعاملات**: `lat`, `lng`, `cnt` (عدد الأيام), `appid` (API Key)

## 🔄 آلية العمل

### الأولوية في جلب البيانات:

1. **للتنبؤات (Forecast)**:
   - ✅ **الأولوية الأولى**: OpenWeatherMap Forecast API (حتى 16 يوم)
   - ⬇️ Fallback: Google Weather API
   - ⬇️ Fallback: محاكاة بناءً على الطقس الحالي

2. **للطقس الحالي (Current)**:
   - ✅ **الأولوية الأولى**: Google Weather API
   - ⬇️ Fallback: OpenWeatherMap Current Weather API
   - ⬇️ Fallback: AccuWeather API

## 📊 الاستخدام في النظام

### 1. صفحة الخريطة (`/map`)
- جلب تنبؤات الطقس لـ 25 نقطة في المدينة
- تحليل الطرق الآمنة وغير الآمنة
- عرض العلامات على الخريطة

### 2. API Route (`/api/weather/safe-routes`)
- يستخدم `weatherService.getWeatherForecast()`
- يجلب تنبؤات لـ 16 يوم قادمة
- يحلل المخاطر لكل نقطة

### 3. API Route (`/api/weather/point`)
- يستخدم `weatherService.getCurrentWeather()`
- يجلب بيانات الطقس الحالية لنقطة محددة

## 🔍 مثال على الاستخدام

### في `lib/services/weather.ts`:

```typescript
// جلب التنبؤات
async getOpenWeatherForecast(request: WeatherRequest & { days?: number }, days: number) {
  const apiKey = weatherConfig.openWeather.apiKey
  const url = `${weatherConfig.openWeather.apiUrl}/forecast/daily`
  
  const response = await axios.get(url, {
    params: {
      lat: request.lat,
      lon: request.lng,
      cnt: days,
      appid: apiKey, // هنا يتم استخدام OPENWEATHER_API_KEY
      units: 'metric',
      lang: 'ar',
    },
  })
  
  return this.transformOpenWeatherForecastResponse(response.data, request)
}
```

## 📈 الإحصائيات

### عدد الطلبات:
- **25 نقطة** × **16 يوم** = **400 نقطة بيانات** لكل طلب
- **تحديث كل 15 دقيقة**
- **~96 طلب في اليوم** (لصفحة واحدة)

### حدود API:
- **Free Tier**: 60 طلب/دقيقة
- **Free Tier**: 1,000,000 طلب/شهر
- **حالياً**: ضمن الحدود المجانية ✅

## ⚙️ الإعداد

### 1. إضافة المفتاح إلى `.env`:
```env
OPENWEATHER_API_KEY=10ed05e69a4e4af467aa85eafab6c77b
```

### 2. التحقق من المفتاح:
```powershell
# في PowerShell
Get-Content .env | Select-String "OPENWEATHER"
```

### 3. إعادة تشغيل الخادم:
```powershell
npm run dev
```

## 🔐 الأمان

- ✅ المفتاح موجود في `.env` (غير متاح للعميل)
- ✅ لا يتم إرساله للعميل
- ✅ يتم استخدامه فقط في Server-Side API Routes

## 📝 ملاحظات

1. **التفعيل**: قد يستغرق المفتاح بضع دقائق للتفعيل بعد الإنشاء
2. **الحدود**: Free Tier كافٍ للاستخدام الحالي
3. **البدائل**: النظام يستخدم Fallback APIs عند فشل OpenWeatherMap

## 🔗 روابط مفيدة

- **OpenWeatherMap Dashboard**: https://home.openweathermap.org/api_keys
- **API Documentation**: https://openweathermap.org/api
- **Forecast API**: https://openweathermap.org/forecast16

---

**تاريخ التحديث**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**الحالة**: ✅ مفعّل ويعمل
**المصدر**: OpenWeatherMap API

