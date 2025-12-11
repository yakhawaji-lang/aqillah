/**
 * سكريبت إضافة بيانات وهمية واقعية كاملة للنظام
 * يضيف بيانات محاكاة واقعية للازدحام المروري، التنبؤات، التنبيهات، والإشعارات
 */

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

// أسماء عربية واقعية
const arabicNames = [
  'أحمد محمد', 'فاطمة علي', 'محمد عبدالله', 'سارة أحمد', 'خالد سعيد',
  'نورا حسن', 'عبدالرحمن يوسف', 'مريم إبراهيم', 'عمر خالد', 'ليلى محمود',
  'يوسف حمد', 'هند عبدالعزيز', 'طارق فهد', 'ريم سلطان', 'بدر ناصر',
]

// أرقام هواتف سعودية واقعية
function generateSaudiPhone(): string {
  const prefixes = ['050', '051', '052', '053', '054', '055', '056', '057', '058', '059']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(1000000 + Math.random() * 9000000)
  return `${prefix}${number}`
}

// إنشاء hash للسجلات
function generateLogHash(data: string): string {
  return createHash('sha256').update(data).digest('hex').substring(0, 32)
}

// بيانات الطرق الرئيسية في المدن السعودية - محدثة بإحداثيات واقعية
const majorRoads = {
  الرياض: [
    { name: 'طريق الملك فهد', coords: [[24.7136, 46.6753], [24.7500, 46.7000]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق العليا', coords: [[24.6800, 46.6200], [24.7200, 46.6500]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الدائري الشرقي', coords: [[24.6500, 46.7000], [24.7500, 46.7200]], direction: 'شمال-جنوب', freeFlowSpeed: 90 },
    { name: 'طريق الدائري الغربي', coords: [[24.6000, 46.5500], [24.7000, 46.6000]], direction: 'شمال-جنوب', freeFlowSpeed: 90 },
    { name: 'طريق الملك عبدالعزيز', coords: [[24.7000, 46.6000], [24.7500, 46.6500]], direction: 'شرق-غرب', freeFlowSpeed: 75 },
    { name: 'طريق الأمير سلطان', coords: [[24.6500, 46.6000], [24.7200, 46.6500]], direction: 'شمال-جنوب', freeFlowSpeed: 70 },
    { name: 'طريق الملك خالد', coords: [[24.6800, 46.6500], [24.7300, 46.7000]], direction: 'شرق-غرب', freeFlowSpeed: 75 },
    { name: 'طريق العروبة', coords: [[24.6500, 46.5800], [24.7000, 46.6200]], direction: 'شمال-جنوب', freeFlowSpeed: 65 },
    { name: 'طريق التحلية', coords: [[24.6800, 46.5500], [24.7200, 46.6000]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك سلمان', coords: [[24.6000, 46.6200], [24.6800, 46.7000]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق الدائري الشمالي', coords: [[24.7500, 46.6000], [24.7800, 46.7000]], direction: 'شرق-غرب', freeFlowSpeed: 90 },
    { name: 'طريق الدائري الجنوبي', coords: [[24.6000, 46.5000], [24.7000, 46.5500]], direction: 'شرق-غرب', freeFlowSpeed: 90 },
    { name: 'طريق الأمير محمد بن سلمان', coords: [[24.7000, 46.7000], [24.7500, 46.7500]], direction: 'شمال-جنوب', freeFlowSpeed: 85 },
    { name: 'طريق العليا العام', coords: [[24.6500, 46.6500], [24.7500, 46.6800]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق النرجس', coords: [[24.6800, 46.6300], [24.7200, 46.6400]], direction: 'شمال-جنوب', freeFlowSpeed: 60 },
  ],
  جدة: [
    { name: 'طريق الملك فهد', coords: [[21.4858, 39.1925], [21.5500, 39.2500]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق الكورنيش', coords: [[21.4500, 39.1500], [21.5500, 39.2000]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك عبدالعزيز', coords: [[21.5000, 39.1500], [21.6000, 39.2200]], direction: 'شمال-جنوب', freeFlowSpeed: 75 },
    { name: 'طريق الحرمين', coords: [[21.4000, 39.2000], [21.5000, 39.2500]], direction: 'شرق-غرب', freeFlowSpeed: 90 },
    { name: 'طريق المدينة', coords: [[21.4500, 39.2200], [21.5500, 39.2800]], direction: 'شمال-جنوب', freeFlowSpeed: 85 },
    { name: 'طريق المطار', coords: [[21.5000, 39.2500], [21.6000, 39.3000]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق التحلية', coords: [[21.4500, 39.1800], [21.5500, 39.2000]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق صاري', coords: [[21.4800, 39.2000], [21.5200, 39.2300]], direction: 'شمال-جنوب', freeFlowSpeed: 65 },
  ],
  الدمام: [
    { name: 'طريق الملك فهد', coords: [[26.4207, 50.0888], [26.5000, 50.1500]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق الكورنيش', coords: [[26.4000, 50.0500], [26.5000, 50.1000]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك عبدالعزيز', coords: [[26.4300, 50.0500], [26.5200, 50.1200]], direction: 'شمال-جنوب', freeFlowSpeed: 75 },
    { name: 'طريق الخليج', coords: [[26.4000, 50.0800], [26.5000, 50.1000]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق المطار', coords: [[26.4500, 50.1000], [26.5500, 50.1500]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
  ],
}

// أوقات الذروة (ساعات اليوم)
const rushHours = [7, 8, 9, 17, 18, 19, 20] // صباحاً ومساءً

// مستويات الازدحام حسب الوقت
function getCongestionLevel(hour: number, isWeekend: boolean = false): number {
  if (isWeekend) {
    // عطلة نهاية الأسبوع - ازدحام أقل
    if (rushHours.includes(hour)) return 40 + Math.random() * 20 // 40-60
    return 20 + Math.random() * 20 // 20-40
  }
  
  // أيام الأسبوع
  if (rushHours.includes(hour)) {
    return 60 + Math.random() * 30 // 60-90
  }
  if (hour >= 10 && hour <= 16) {
    return 30 + Math.random() * 20 // 30-50
  }
  return 20 + Math.random() * 15 // 20-35
}

// حساب السرعة المتوسطة بناءً على مؤشر الازدحام
function calculateSpeed(congestionIndex: number, freeFlowSpeed: number): number {
  const speedReduction = (congestionIndex / 100) * freeFlowSpeed * 0.7
  return Math.max(10, freeFlowSpeed - speedReduction)
}

// حساب زمن التأخير
function calculateDelay(congestionIndex: number, length: number, freeFlowSpeed: number): number {
  const normalTime = (length / freeFlowSpeed) * 60 // بالدقائق
  const delayFactor = congestionIndex / 100
  return normalTime * delayFactor
}

// توليد أسباب الازدحام الواقعية
function getCongestionReason(hour: number, isWeekend: boolean, congestionIndex: number, city: string, roadName: string): string {
  const reasons: string[] = []
  
  // أسباب متعلقة بالوقت
  if (hour >= 7 && hour <= 9) {
    reasons.push('وقت الذروة الصباحية')
    reasons.push('ذهاب الموظفين للعمل')
    reasons.push('ذهاب الطلاب للمدارس')
  } else if (hour >= 17 && hour <= 19) {
    reasons.push('وقت الذروة المسائية')
    reasons.push('عودة الموظفين من العمل')
    reasons.push('عودة الطلاب من المدارس')
  } else if (hour >= 12 && hour <= 14) {
    reasons.push('وقت الغداء')
    reasons.push('حركة تجارية نشطة')
  } else if (hour >= 20 && hour <= 22) {
    reasons.push('وقت المساء')
    reasons.push('ذهاب للترفيه والتسوق')
  }
  
  // أسباب متعلقة بالازدحام
  if (congestionIndex >= 80) {
    reasons.push('ازدحام شديد')
    reasons.push('عدد كبير من المركبات')
    reasons.push('بطء في الحركة')
  } else if (congestionIndex >= 60) {
    reasons.push('ازدحام متوسط')
    reasons.push('حركة مرورية كثيفة')
  }
  
  // أسباب عشوائية واقعية
  const randomReasons = [
    'إشارة مرورية بطيئة',
    'أعمال صيانة على الطريق',
    'حادث مروري سابق',
    'انحراف مركبة',
    'حركة شاحنات',
    'مشروع بناء قريب',
    'فعالية قريبة',
    'سوق أو مركز تجاري',
    'مستشفى أو مركز صحي',
    'جامعة أو كلية',
    'مطار أو محطة قطار',
    'جسر أو نفق',
    'تقاطع معقد',
    'منحدر أو صعود',
    'ممر ضيق',
    'أعمال حفر',
    'إغلاق مسار',
    'حركة باصات',
    'موقف حافلات',
    'منطقة تجارية مزدحمة',
  ]
  
  // إضافة سبب عشوائي
  if (Math.random() < 0.6) {
    reasons.push(randomReasons[Math.floor(Math.random() * randomReasons.length)])
  }
  
  // أسباب متعلقة بالطريق
  if (roadName.includes('الدائري')) {
    reasons.push('طريق دائري رئيسي')
    reasons.push('تقاطعات متعددة')
  } else if (roadName.includes('الملك')) {
    reasons.push('طريق رئيسي')
    reasons.push('حركة مرورية عالية')
  }
  
  // أسباب متعلقة بالمدينة
  if (city === 'الرياض') {
    if (Math.random() < 0.3) {
      reasons.push('منطقة دبلوماسية')
    }
  } else if (city === 'جدة') {
    if (Math.random() < 0.3) {
      reasons.push('قرب الكورنيش')
    }
  }
  
  // إرجاع السبب الرئيسي أو مجموعة أسباب
  if (reasons.length === 0) {
    return 'حركة مرورية عادية'
  }
  
  // إرجاع 1-3 أسباب
  const selectedReasons = reasons.slice(0, Math.min(3, reasons.length))
  return selectedReasons.join('، ')
}

// إنشاء بيانات حركة مرورية واقعية
async function generateTrafficData(segmentId: string, city: string, roadName: string, length: number, freeFlowSpeed: number) {
  const now = new Date()
  const trafficData = []
  
  // إنشاء بيانات لآخر 24 ساعة (كل 15 دقيقة)
  for (let i = 0; i < 96; i++) {
    const timestamp = new Date(now.getTime() - (96 - i) * 15 * 60 * 1000)
    const hour = timestamp.getHours()
    const isWeekend = timestamp.getDay() === 5 || timestamp.getDay() === 6 // الجمعة والسبت
    
    const congestionIndex = Math.round(getCongestionLevel(hour, isWeekend))
    const avgSpeed = calculateSpeed(congestionIndex, freeFlowSpeed)
    const delayMinutes = calculateDelay(congestionIndex, length, freeFlowSpeed)
    const deviceCount = Math.floor(30 + congestionIndex * 2 + Math.random() * 50) // 30-180
    const density = deviceCount / length
    
    trafficData.push({
      segmentId,
      timestamp,
      deviceCount,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      density: Math.round(density * 10) / 10,
      congestionIndex,
      delayMinutes: Math.round(delayMinutes * 10) / 10,
      movementDirection: Math.random() * 360,
      kAnonymity: Math.max(30, deviceCount),
      isAnonymized: true,
    })
  }
  
  await prisma.trafficData.createMany({
    data: trafficData,
  })
  
  console.log(`✅ تم إضافة ${trafficData.length} سجل حركة مرورية لـ ${roadName}`)
}

// إنشاء تنبؤات واقعية
async function generatePredictions(segmentId: string, city: string, roadName: string) {
  const now = new Date()
  const predictions = []
  
  // تنبؤات للـ 5، 10، 30، 60 دقيقة القادمة
  const predictionTimes = [5, 10, 30, 60]
  
  for (const minutes of predictionTimes) {
    const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
    const hour = predictedFor.getHours()
    const isWeekend = predictedFor.getDay() === 5 || predictedFor.getDay() === 6
    
    const baseCongestion = getCongestionLevel(hour, isWeekend)
    const predictedIndex = Math.round(baseCongestion + (Math.random() - 0.5) * 10) // ±5
    const predictedDelay = predictedIndex * 0.1 // تقدير بسيط
    const confidence = Math.max(0.7, 1 - (minutes / 120)) // ثقة أقل للتنبؤات البعيدة
    const congestionReason = getCongestionReason(hour, isWeekend, predictedIndex, city, roadName)
    
    predictions.push({
      segmentId,
      predictedAt: now,
      predictedFor,
      predictedIndex: Math.max(0, Math.min(100, predictedIndex)),
      predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      factors: {
        timeOfDay: hour,
        isWeekend,
        historicalAverage: baseCongestion,
        weatherImpact: Math.random() * 10 - 5, // ±5
        eventImpact: Math.random() * 5, // 0-5
        reason: congestionReason, // سبب الازدحام
        causes: congestionReason.split('، '), // أسباب منفصلة
      },
      modelType: minutes <= 10 ? 'temporal' : 'ml',
      seasonalityFactor: Math.round((1 + Math.sin((hour / 24) * Math.PI * 2) * 0.2) * 100) / 100,
    })
  }
  
  await prisma.prediction.createMany({
    data: predictions,
  })
  
  console.log(`✅ تم إضافة ${predictions.length} تنبؤ لـ ${roadName}`)
}

// إنشاء تنبيهات واقعية
async function generateAlerts(segmentId: string, city: string, roadName: string) {
  const now = new Date()
  const alerts = []
  const hour = now.getHours()
  const isWeekend = now.getDay() === 5 || now.getDay() === 6
  
  // جلب آخر بيانات ازدحام للمقطع
  const latestTraffic = await prisma.trafficData.findFirst({
    where: { segmentId },
    orderBy: { timestamp: 'desc' },
  })
  const congestionIndex = latestTraffic?.congestionIndex || 30
  const congestionReason = getCongestionReason(hour, isWeekend, congestionIndex, city, roadName)
  
  // أنواع التنبيهات مع أسباب واقعية
  const alertTypes = [
    { 
      type: 'congestion', 
      severity: congestionIndex >= 80 ? 'critical' : congestionIndex >= 60 ? 'high' : 'medium',
      message: `ازدحام مروري ${congestionIndex >= 80 ? 'شديد' : congestionIndex >= 60 ? 'متوسط' : 'خفيف'} على ${roadName}. السبب: ${congestionReason}`,
      reason: congestionReason,
    },
    { 
      type: 'accident', 
      severity: 'critical', 
      message: `حادث مروري على ${roadName} - استخدم مساراً بديلاً. السبب: حادث مروري`,
      reason: 'حادث مروري',
    },
    { 
      type: 'event', 
      severity: 'medium', 
      message: `فعالية قريبة من ${roadName} - ازدحام متوقع. السبب: فعالية أو حدث قريب`,
      reason: 'فعالية أو حدث قريب',
    },
    { 
      type: 'weather', 
      severity: 'medium', 
      message: `ظروف طقس صعبة على ${roadName} - انتبه للقيادة. السبب: ظروف طقس`,
      reason: 'ظروف طقس',
    },
  ]
  
  // إنشاء تنبيهات عشوائية (30% احتمال لكل مقطع)
  for (const alertType of alertTypes) {
    if (Math.random() < 0.3) {
      const expiresAt = new Date(now.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000) // 2-6 ساعات
      
      const alertData: any = {
        segmentId,
        type: alertType.type,
        severity: alertType.severity,
        message: alertType.message,
        createdAt: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // قبل ساعة
        expiresAt,
        isActive: expiresAt > now,
      }
      
      if (alertType.type === 'accident') {
        alertData.alternativeRoute = {
          distance: 5 + Math.random() * 10,
          duration: 10 + Math.random() * 20,
          waypoints: [
            { lat: 24.7100, lng: 46.6800 },
            { lat: 24.7200, lng: 46.6900 },
          ],
        }
      }
      
      alerts.push(alertData)
    }
  }
  
  if (alerts.length > 0) {
    await prisma.alert.createMany({
      data: alerts,
    })
    console.log(`✅ تم إضافة ${alerts.length} تنبيه لـ ${roadName}`)
  }
}

// إنشاء نقاط ازدحام (Bottlenecks)
async function generateBottlenecks(segmentId: string, city: string, roadName: string, coords: number[][]) {
  const now = new Date()
  const hour = now.getHours()
  const isWeekend = now.getDay() === 5 || now.getDay() === 6
  
  // 20% احتمال لوجود نقطة ازدحام
  if (Math.random() < 0.2) {
    const [startLat, startLng] = coords[0]
    const [endLat, endLng] = coords[1]
    
    const originLat = startLat + (endLat - startLat) * (0.3 + Math.random() * 0.4)
    const originLng = startLng + (endLng - startLng) * (0.3 + Math.random() * 0.4)
    
    const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
    const speedDrop = 20 + Math.random() * 50 // 20-70%
    const backwardExtent = 0.5 + Math.random() * 2 // 0.5-2.5 كم
    
    // حساب مؤشر الازدحام بناءً على الوقت
    const congestionIndex = Math.round(getCongestionLevel(hour, isWeekend))
    const congestionReason = getCongestionReason(hour, isWeekend, congestionIndex, city, roadName)
    
    await prisma.bottleneck.create({
      data: {
        segmentId,
        detectedAt: new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000), // قبل ساعتين
        originLat,
        originLng,
        severity,
        speedDrop: Math.round(speedDrop * 10) / 10,
        backwardExtent: Math.round(backwardExtent * 10) / 10,
        isResolved: Math.random() < 0.3, // 30% محلولة
      },
    })
    
    console.log(`✅ تم إضافة نقطة ازدحام لـ ${roadName} - السبب: ${congestionReason}`)
  }
}

// إنشاء بيانات طقس واقعية
async function generateWeatherData(city: string, coords: number[]) {
  const now = new Date()
  const [lat, lng] = coords
  
  // بيانات طقس واقعية حسب المدينة
  const weatherConditions = {
    الرياض: { temp: 25 + Math.random() * 15, humidity: 20 + Math.random() * 30, condition: 'clear' },
    جدة: { temp: 28 + Math.random() * 8, humidity: 50 + Math.random() * 30, condition: 'clear' },
    الدمام: { temp: 26 + Math.random() * 10, humidity: 40 + Math.random() * 30, condition: 'clear' },
  }
  
  const baseWeather = weatherConditions[city as keyof typeof weatherConditions] || weatherConditions.الرياض
  
  // إضافة تنوع في الطقس
  const conditions = ['clear', 'partly_cloudy', 'cloudy', 'rain', 'fog']
  const condition = Math.random() < 0.8 ? baseWeather.condition : conditions[Math.floor(Math.random() * conditions.length)]
  
  await prisma.weatherData.create({
    data: {
      lat,
      lng,
      timestamp: now,
      temperature: Math.round((baseWeather.temp + (Math.random() - 0.5) * 5) * 10) / 10,
      humidity: Math.round((baseWeather.humidity + (Math.random() - 0.5) * 10) * 10) / 10,
      windSpeed: Math.round((10 + Math.random() * 20) * 10) / 10,
      windDirection: Math.random() * 360,
      visibility: condition === 'fog' ? 500 + Math.random() * 1000 : 5000 + Math.random() * 5000,
      pressure: 1010 + Math.random() * 10,
      precipitation: condition === 'rain' ? Math.random() * 5 : 0,
      rainRate: condition === 'rain' ? Math.random() * 2 : 0,
      snowRate: 0,
      condition,
      cloudCover: condition === 'clear' ? Math.random() * 20 : condition === 'cloudy' ? 70 + Math.random() * 30 : 30 + Math.random() * 40,
      alerts: condition === 'rain' ? [{ type: 'rain', severity: 'medium', message: 'أمطار متوقعة' }] : undefined,
      forecast: {
        hourly: Array.from({ length: 24 }, (_, i) => ({
          time: new Date(now.getTime() + i * 60 * 60 * 1000),
          temp: baseWeather.temp + (Math.random() - 0.5) * 5,
          condition: Math.random() < 0.8 ? condition : conditions[Math.floor(Math.random() * conditions.length)],
        })),
      },
    },
  })
  
  console.log(`✅ تم إضافة بيانات طقس لـ ${city}`)
}

// إنشاء إحصائيات استخدام
async function generateUsageStats() {
  const now = new Date()
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    
    await prisma.usageStats.create({
      data: {
        date,
        totalUsers: Math.floor(1000 + Math.random() * 5000),
        activeAlerts: Math.floor(10 + Math.random() * 50),
        routesSuggested: Math.floor(500 + Math.random() * 2000),
        avgResponseTime: Math.round((0.5 + Math.random() * 1.5) * 100) / 100,
      },
    })
  }
  
  console.log('✅ تم إضافة إحصائيات الاستخدام')
}

// إنشاء مسارات واقعية
async function generateRoutes(segments: any[], users?: any[]) {
  const now = new Date()
  const routes = []
  
  // إنشاء 50-100 مسار واقعي
  const routeCount = Math.floor(50 + Math.random() * 50)
  
  for (let i = 0; i < routeCount; i++) {
    // اختيار مقطعين عشوائيين كنقطة بداية ونهاية
    const originSegment = segments[Math.floor(Math.random() * segments.length)]
    const destSegment = segments[Math.floor(Math.random() * segments.length)]
    
    const origin = {
      lat: originSegment.startLat + (originSegment.endLat - originSegment.startLat) * Math.random(),
      lng: originSegment.startLng + (originSegment.endLng - originSegment.startLng) * Math.random(),
    }
    
    const destination = {
      lat: destSegment.startLat + (destSegment.endLat - destSegment.startLat) * Math.random(),
      lng: destSegment.startLng + (destSegment.endLng - destSegment.startLng) * Math.random(),
    }
    
    // حساب المسافة والوقت
    const distance = Math.sqrt(
      Math.pow((destination.lat - origin.lat) * 111, 2) +
      Math.pow((destination.lng - origin.lng) * 111 * Math.cos(origin.lat * Math.PI / 180), 2)
    )
    
    const avgSpeed = 50 + Math.random() * 30 // 50-80 كم/س
    const duration = (distance / avgSpeed) * 60 // بالدقائق
    const durationInTraffic = duration * (1.2 + Math.random() * 0.5) // زيادة 20-70%
    
    // إنشاء هندسة المسار (نقاط متوسطة)
    const waypoints = []
    const steps = Math.floor(5 + Math.random() * 10)
    for (let j = 0; j < steps; j++) {
      const ratio = j / steps
      waypoints.push([
        origin.lat + (destination.lat - origin.lat) * ratio,
        origin.lng + (destination.lng - origin.lng) * ratio,
      ])
    }
    
    const statuses = ['planned', 'active', 'completed', 'cancelled']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    // ربط بعض المسارات بالمستخدمين (60%)
    const userId = users && users.length > 0 && Math.random() > 0.4
      ? users[Math.floor(Math.random() * users.length)].id
      : undefined
    
    const route: any = {
      userId,
      origin,
      destination,
      waypoints: waypoints.length > 0 ? waypoints : undefined,
      routeGeometry: {
        type: 'LineString',
        coordinates: waypoints,
      },
      distance: Math.round(distance * 10) / 10,
      duration: Math.round(duration * 10) / 10,
      durationInTraffic: Math.round(durationInTraffic * 10) / 10,
      weatherData: {
        condition: ['clear', 'partly_cloudy', 'cloudy'][Math.floor(Math.random() * 3)],
        temperature: 20 + Math.random() * 15,
        visibility: 5000 + Math.random() * 5000,
      },
      riskScores: waypoints.map(() => ({
        score: Math.random() * 100,
        level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      })),
      maxRiskLevel: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      status,
      startedAt: status === 'active' || status === 'completed' ? new Date(now.getTime() - Math.random() * 2 * 60 * 60 * 1000) : undefined,
      completedAt: status === 'completed' ? new Date(now.getTime() - Math.random() * 60 * 60 * 1000) : undefined,
      createdAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    }
    
    routes.push(route)
  }
  
  await prisma.route.createMany({
    data: routes,
  })
  
  console.log(`✅ تم إضافة ${routes.length} مسار واقعي`)
}

// إنشاء قرارات مرورية
async function generateTrafficDecisions(segments: any[]) {
  const now = new Date()
  const decisions = []
  
  // إنشاء 20-40 قرار مروري
  const decisionCount = Math.floor(20 + Math.random() * 20)
  
  for (let i = 0; i < decisionCount; i++) {
    const segment = segments[Math.floor(Math.random() * segments.length)]
    const decisionTypes = ['diversion', 'signal_adjustment', 'intervention']
    const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
    const statuses = ['pending', 'approved', 'implemented', 'rejected']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    
    const decision = {
      segmentId: segment.id,
      decisionType,
      recommendedAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000),
      implementedAt: status === 'implemented' ? new Date(now.getTime() - Math.random() * 12 * 60 * 60 * 1000) : undefined,
      expectedDelayReduction: Math.round((5 + Math.random() * 15) * 10) / 10, // 5-20 دقيقة
      expectedBenefitScore: Math.round((60 + Math.random() * 40) * 10) / 10, // 60-100
      affectedSegments: [segment.id, segments[Math.floor(Math.random() * segments.length)].id],
      details: {
        reason: decisionType === 'diversion' ? 'ازدحام شديد' : decisionType === 'signal_adjustment' ? 'تحسين تدفق المرور' : 'تدخل عاجل',
        priority: ['normal', 'high', 'emergency'][Math.floor(Math.random() * 3)],
      },
      status,
    }
    
    decisions.push(decision)
  }
  
  await prisma.trafficDecision.createMany({
    data: decisions,
  })
  
  console.log(`✅ تم إضافة ${decisions.length} قرار مروري`)
}

// إنشاء توصيات إشارات مرورية
async function generateSignalRecommendations(segments: any[]) {
  const now = new Date()
  const recommendations = []
  
  // فقط للمقاطع التي لديها إشارات مرورية
  const segmentsWithLights = segments.filter(s => s.hasTrafficLight)
  
  for (const segment of segmentsWithLights) {
    if (Math.random() < 0.3) { // 30% احتمال
      const recommendation = {
        segmentId: segment.id,
        signalId: `signal-${segment.id}-${Math.floor(Math.random() * 1000)}`,
        recommendedAt: new Date(now.getTime() - Math.random() * 6 * 60 * 60 * 1000),
        greenTimeSeconds: Math.floor(30 + Math.random() * 60), // 30-90 ثانية
        cycleTimeSeconds: Math.floor(90 + Math.random() * 90), // 90-180 ثانية
        priority: ['normal', 'high', 'emergency'][Math.floor(Math.random() * 3)],
        expectedImpact: {
          delayReduction: Math.round((2 + Math.random() * 8) * 10) / 10,
          throughputIncrease: Math.round((5 + Math.random() * 15) * 10) / 10,
        },
        implemented: Math.random() < 0.4, // 40% تم تنفيذها
        implementedAt: Math.random() < 0.4 ? new Date(now.getTime() - Math.random() * 3 * 60 * 60 * 1000) : undefined,
      }
      
      recommendations.push(recommendation)
    }
  }
  
  if (recommendations.length > 0) {
    await prisma.signalRecommendation.createMany({
      data: recommendations,
    })
    console.log(`✅ تم إضافة ${recommendations.length} توصية إشارة مرورية`)
  }
}

// إنشاء مسارات طوارئ
async function generateEmergencyRoutes() {
  const now = new Date()
  const emergencyRoutes = []
  
  // إنشاء 5-15 مسار طوارئ نشط
  const routeCount = Math.floor(5 + Math.random() * 10)
  
  const cities = [
    { name: 'الرياض', center: [24.7136, 46.6753] },
    { name: 'جدة', center: [21.4858, 39.1925] },
    { name: 'الدمام', center: [26.4207, 50.0888] },
  ]
  
  for (let i = 0; i < routeCount; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const [centerLat, centerLng] = city.center
    
    const originLat = centerLat + (Math.random() - 0.5) * 0.1
    const originLng = centerLng + (Math.random() - 0.5) * 0.1
    const destLat = centerLat + (Math.random() - 0.5) * 0.1
    const destLng = centerLng + (Math.random() - 0.5) * 0.1
    
    const distance = Math.sqrt(
      Math.pow((destLat - originLat) * 111, 2) +
      Math.pow((destLng - originLng) * 111 * Math.cos(originLat * Math.PI / 180), 2)
    )
    
    const estimatedTime = (distance / 80) * 60 // افتراض سرعة 80 كم/س
    
    // إنشاء نقاط المسار
    const routePoints = []
    const steps = Math.floor(10 + Math.random() * 20)
    for (let j = 0; j <= steps; j++) {
      const ratio = j / steps
      routePoints.push([
        originLat + (destLat - originLat) * ratio,
        originLng + (destLng - originLng) * ratio,
      ])
    }
    
    const emergencyRoute = {
      originLat,
      originLng,
      destinationLat: destLat,
      destinationLng: destLng,
      requestedAt: new Date(now.getTime() - Math.random() * 30 * 60 * 1000), // آخر 30 دقيقة
      route: {
        type: 'LineString',
        coordinates: routePoints,
      },
      distance: Math.round(distance * 10) / 10,
      estimatedTime: Math.round(estimatedTime * 10) / 10,
      lastUpdate: new Date(now.getTime() - Math.random() * 5 * 60 * 1000), // آخر 5 دقائق
      updateInterval: 30,
      isActive: true,
      congestionAlongRoute: routePoints.map((point, idx) => ({
        point,
        congestionIndex: Math.floor(20 + Math.random() * 60),
        delay: Math.random() * 5,
      })),
    }
    
    emergencyRoutes.push(emergencyRoute)
  }
  
  await prisma.emergencyRoute.createMany({
    data: emergencyRoutes,
  })
  
  console.log(`✅ تم إضافة ${emergencyRoutes.length} مسار طوارئ`)
}

// إنشاء مؤشرات الأداء KPI
async function generateKPIs() {
  const now = new Date()
  const kpis = []
  
  const kpiTypes = ['daily', 'weekly', 'monthly']
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    const kpiType = kpiTypes[Math.floor(Math.random() * kpiTypes.length)]
    
    const kpi = {
      date,
      kpiType,
      predictionAccuracy: Math.round((75 + Math.random() * 20) * 10) / 10, // 75-95%
      responseTime: Math.round((0.3 + Math.random() * 1.2) * 10) / 10, // 0.3-1.5 ثانية
      decisionEffectiveness: Math.round((70 + Math.random() * 25) * 10) / 10, // 70-95%
      privacyCompliance: Math.round((95 + Math.random() * 5) * 10) / 10, // 95-100%
      systemUptime: Math.round((98 + Math.random() * 2) * 10) / 10, // 98-100%
      details: {
        totalRequests: Math.floor(10000 + Math.random() * 50000),
        successfulRequests: Math.floor(9500 + Math.random() * 45000),
        averageLatency: Math.round((100 + Math.random() * 200) * 10) / 10,
      },
    }
    
    kpis.push(kpi)
  }
  
  await prisma.kPI.createMany({
    data: kpis,
  })
  
  console.log(`✅ تم إضافة ${kpis.length} مؤشر أداء`)
}

// إنشاء مستخدمين واقعيين
async function generateUsers() {
  const users = []
  
  // إنشاء 50-100 مستخدم واقعي
  const userCount = Math.floor(50 + Math.random() * 50)
  
  for (let i = 0; i < userCount; i++) {
    const name = arabicNames[Math.floor(Math.random() * arabicNames.length)]
    const phone = generateSaudiPhone()
    const email = `user${i + 1}@example.com`
    
    const user = {
      email,
      phone,
      name,
      settings: {
        notifications: {
          push: Math.random() > 0.3,
          sms: Math.random() > 0.5,
          email: Math.random() > 0.4,
        },
        language: 'ar',
        theme: ['light', 'dark'][Math.floor(Math.random() * 2)],
      },
      preferences: {
        avoidTolls: Math.random() > 0.6,
        avoidHighways: Math.random() > 0.8,
        preferredRouteType: ['fastest', 'shortest', 'safest'][Math.floor(Math.random() * 3)],
      },
      locationTrackingEnabled: Math.random() > 0.4,
      lastKnownLocation: Math.random() > 0.3 ? {
        lat: 24.7136 + (Math.random() - 0.5) * 0.1,
        lng: 46.6753 + (Math.random() - 0.5) * 0.1,
        timestamp: new Date(),
      } : undefined,
      totalRoutes: Math.floor(Math.random() * 50),
      totalAlertsReceived: Math.floor(Math.random() * 30),
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000), // آخر 90 يوم
      lastActiveAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // آخر 7 أيام
    }
    
    users.push(user)
  }
  
  await prisma.user.createMany({
    data: users,
  })
  
  console.log(`✅ تم إضافة ${users.length} مستخدم واقعي`)
  
  return users
}

// إنشاء مركبات للمستخدمين
async function generateVehicles(users: any[]) {
  const vehicles = []
  const makes = ['تويوتا', 'هوندا', 'نيسان', 'هيونداي', 'شيفروليه', 'فورد', 'مرسيدس', 'بي إم دبليو']
  const models = ['كامري', 'أكورد', 'التيما', 'إلنترا', 'ماليبو', 'فيوجن', 'C-Class', 'Series 3']
  
  for (const user of users) {
    if (Math.random() > 0.3) { // 70% من المستخدمين لديهم مركبات
      const vehicleCount = Math.floor(1 + Math.random() * 2) // 1-2 مركبة
      
      for (let i = 0; i < vehicleCount; i++) {
        const make = makes[Math.floor(Math.random() * makes.length)]
        const model = models[Math.floor(Math.random() * models.length)]
        
        const vehicle = {
          userId: user.id,
          vin: `VIN${Math.floor(Math.random() * 1000000000)}`,
          make,
          model,
          year: Math.floor(2015 + Math.random() * 10), // 2015-2025
          type: ['car', 'suv', 'truck'][Math.floor(Math.random() * 3)],
          lastLocation: {
            lat: 24.7136 + (Math.random() - 0.5) * 0.1,
            lng: 46.6753 + (Math.random() - 0.5) * 0.1,
          },
          lastSpeed: Math.floor(40 + Math.random() * 60), // 40-100 كم/س
          lastHeading: Math.random() * 360,
          lastSeen: new Date(Date.now() - Math.random() * 60 * 60 * 1000), // آخر ساعة
        }
        
        vehicles.push(vehicle)
      }
    }
  }
  
  if (vehicles.length > 0) {
    await prisma.vehicle.createMany({
      data: vehicles,
    })
    console.log(`✅ تم إضافة ${vehicles.length} مركبة`)
  }
}

// إنشاء إشعارات للمستخدمين
async function generateUserNotifications(users: any[], alerts: any[]) {
  const notifications = []
  
  for (const user of users) {
    // كل مستخدم لديه 5-20 إشعار
    const notificationCount = Math.floor(5 + Math.random() * 15)
    
    for (let i = 0; i < notificationCount; i++) {
      const types = ['push', 'sms', 'email', 'in_app']
      const categories = ['alert', 'warning', 'info', 'critical']
      const type = types[Math.floor(Math.random() * types.length)]
      const category = categories[Math.floor(Math.random() * categories.length)]
      
      // ربط بعض الإشعارات بالتنبيهات
      const alert = alerts.length > 0 && Math.random() > 0.5 
        ? alerts[Math.floor(Math.random() * alerts.length)]
        : null
      
      const titles = {
        alert: 'تنبيه ازدحام',
        warning: 'تحذير طقس',
        info: 'معلومات مسار',
        critical: 'حادث مروري',
      }
      
      const messages = {
        alert: 'ازدحام مروري على طريقك - استخدم مساراً بديلاً',
        warning: 'ظروف طقس صعبة - انتبه للقيادة',
        info: 'تم تحديث المسار المقترح',
        critical: 'حادث مروري على طريقك - تجنب المنطقة',
      }
      
      const sent = Math.random() > 0.2 // 80% تم إرسالها
      const delivered = sent && Math.random() > 0.1 // 90% من المرسلة تم تسليمها
      const read = delivered && Math.random() > 0.3 // 70% من المسلمة تم قراءتها
      
      const createdAt = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      
      const notification = {
        userId: user.id,
        type,
        category,
        title: titles[category as keyof typeof titles],
        message: messages[category as keyof typeof messages],
        data: alert ? {
          alertId: alert.id,
          segmentId: alert.segmentId,
          severity: alert.severity,
        } : undefined,
        alertId: alert?.id,
        sent,
        delivered,
        read,
        sentAt: sent ? new Date(createdAt.getTime() + Math.random() * 60 * 1000) : undefined,
        deliveredAt: delivered ? new Date(createdAt.getTime() + Math.random() * 120 * 1000) : undefined,
        readAt: read ? new Date(createdAt.getTime() + Math.random() * 300 * 1000) : undefined,
        createdAt,
      }
      
      notifications.push(notification)
    }
  }
  
  if (notifications.length > 0) {
    await prisma.userNotification.createMany({
      data: notifications,
    })
    console.log(`✅ تم إضافة ${notifications.length} إشعار للمستخدمين`)
  }
}

// إنشاء سجلات الخصوصية والأمان
async function generatePrivacyAudits() {
  const audits = []
  const eventTypes = ['data_received', 'anonymization_applied', 'access_granted', 'data_deleted']
  const sources = ['telecom_provider', 'system', 'user', 'api']
  const anonymizationStatuses = ['success', 'failed', 'partial']
  const encryptionStatuses = ['encrypted', 'not_encrypted', 'pending']
  const accessLevels = ['public', 'restricted', 'private', 'admin']
  
  // إنشاء 100-200 سجل
  const auditCount = Math.floor(100 + Math.random() * 100)
  
  for (let i = 0; i < auditCount; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // آخر 30 يوم
    
    const audit = {
      timestamp,
      eventType,
      source,
      kAnonymity: Math.floor(30 + Math.random() * 70), // 30-100
      dataVolume: Math.floor(1000 + Math.random() * 10000), // 1KB-10KB
      anonymizationStatus: anonymizationStatuses[Math.floor(Math.random() * anonymizationStatuses.length)],
      encryptionStatus: encryptionStatuses[Math.floor(Math.random() * encryptionStatuses.length)],
      accessLevel: accessLevels[Math.floor(Math.random() * accessLevels.length)],
      logHash: generateLogHash(`${eventType}-${source}-${timestamp.toISOString()}`),
    }
    
    audits.push(audit)
  }
  
  await prisma.privacyAudit.createMany({
    data: audits,
  })
  
  console.log(`✅ تم إضافة ${audits.length} سجل خصوصية وأمان`)
}

// إنشاء سجلات الأحداث (Audit Logs)
async function generateAuditLogs(users: any[]) {
  const logs = []
  const eventTypes = ['route_calculated', 'alert_created', 'prediction_made', 'user_login', 'data_accessed']
  const actions = ['create', 'read', 'update', 'delete']
  
  // إنشاء 200-400 سجل
  const logCount = Math.floor(200 + Math.random() * 200)
  
  for (let i = 0; i < logCount; i++) {
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const action = actions[Math.floor(Math.random() * actions.length)]
    const userId = Math.random() > 0.3 && users.length > 0 
      ? users[Math.floor(Math.random() * users.length)].id 
      : undefined
    const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // آخر 7 أيام
    
    const log = {
      timestamp,
      eventType,
      userId,
      action,
      resource: ['route', 'alert', 'prediction', 'user', 'traffic_data'][Math.floor(Math.random() * 5)],
      resourceId: `res-${Math.floor(Math.random() * 10000)}`,
      data: {
        ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        userAgent: ['Chrome', 'Firefox', 'Safari', 'Edge'][Math.floor(Math.random() * 4)],
        duration: Math.round((0.1 + Math.random() * 2) * 100) / 100,
      },
      ipAddress: `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      userAgent: ['Chrome/120.0', 'Firefox/121.0', 'Safari/17.0', 'Edge/120.0'][Math.floor(Math.random() * 4)],
      success: Math.random() > 0.1, // 90% نجاح
      errorMessage: Math.random() > 0.9 ? 'خطأ في الاتصال' : undefined,
    }
    
    logs.push(log)
  }
  
  await prisma.auditLog.createMany({
    data: logs,
  })
  
  console.log(`✅ تم إضافة ${logs.length} سجل أحداث`)
}

// إنشاء قواعد التنبيه
async function generateAlertRules() {
  const rules = []
  
  const ruleTemplates = [
    {
      name: 'تنبيه ازدحام شديد',
      description: 'تنبيه عند ازدحام مروري شديد',
      conditions: [
        { field: 'congestionIndex', operator: '>', value: 70 },
      ],
      actions: {
        type: 'notify',
        channels: ['push', 'in_app'],
        priority: 'high',
      },
      priority: 'high',
    },
    {
      name: 'تنبيه حادث مروري',
      description: 'تنبيه عند وجود حادث مروري',
      conditions: [
        { field: 'alert.type', operator: '==', value: 'accident' },
      ],
      actions: {
        type: 'notify',
        channels: ['push', 'sms'],
        priority: 'critical',
      },
      priority: 'critical',
    },
    {
      name: 'تنبيه طقس صعب',
      description: 'تنبيه عند ظروف طقس صعبة',
      conditions: [
        { field: 'weather.rain_rate', operator: '>', value: 10 },
        { field: 'visibility', operator: '<', value: 1000 },
      ],
      actions: {
        type: 'notify',
        channels: ['push', 'sms', 'email'],
        priority: 'medium',
      },
      priority: 'medium',
    },
  ]
  
  for (const template of ruleTemplates) {
    const rule = {
      name: template.name,
      description: template.description,
      conditions: template.conditions,
      actions: template.actions,
      priority: template.priority,
      enabled: Math.random() > 0.2, // 80% مفعلة
      active: Math.random() > 0.1, // 90% نشطة
      triggerCount: Math.floor(Math.random() * 100),
      lastTriggered: Math.random() > 0.3 
        ? new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        : undefined,
    }
    
    rules.push(rule)
  }
  
  await prisma.alertRule.createMany({
    data: rules,
  })
  
  console.log(`✅ تم إضافة ${rules.length} قاعدة تنبيه`)
}

// الدالة الرئيسية
async function main() {
  console.log('🚀 بدء إضافة البيانات الوهمية الواقعية...\n')
  
  try {
    // حذف البيانات القديمة (اختياري)
    console.log('🗑️  حذف البيانات القديمة...')
    await prisma.userNotification.deleteMany({})
    await prisma.vehicle.deleteMany({})
    await prisma.route.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.trafficData.deleteMany({})
    await prisma.prediction.deleteMany({})
    await prisma.alert.deleteMany({})
    await prisma.bottleneck.deleteMany({})
    await prisma.weatherData.deleteMany({})
    await prisma.usageStats.deleteMany({})
    await prisma.trafficDecision.deleteMany({})
    await prisma.signalRecommendation.deleteMany({})
    await prisma.emergencyRoute.deleteMany({})
    await prisma.kPI.deleteMany({})
    await prisma.privacyAudit.deleteMany({})
    await prisma.auditLog.deleteMany({})
    await prisma.alertRule.deleteMany({})
    
    // حذف المقاطع القديمة وإعادة إنشائها
    await prisma.roadSegment.deleteMany({})
    
    // إنشاء مقاطع الطرق وبياناتها
    for (const [city, roads] of Object.entries(majorRoads)) {
      console.log(`\n📍 معالجة مدينة: ${city}`)
      
      for (const road of roads) {
        const [startCoords, endCoords] = road.coords
        const [startLat, startLng] = startCoords
        const [endLat, endLng] = endCoords
        
        // حساب طول المقطع
        const length = Math.sqrt(
          Math.pow((endLat - startLat) * 111, 2) + 
          Math.pow((endLng - startLng) * 111 * Math.cos(startLat * Math.PI / 180), 2)
        )
        
        // إنشاء مقطع الطريق
        const segment = await prisma.roadSegment.create({
          data: {
            roadName: road.name,
            city,
            direction: road.direction,
            startLat,
            startLng,
            endLat,
            endLng,
            length: Math.round(length * 10) / 10,
            freeFlowSpeed: road.freeFlowSpeed,
            hasTrafficLight: Math.random() < 0.4, // 40% لديهم إشارات مرورية
          },
        })
        
        // إنشاء بيانات حركة مرورية
        await generateTrafficData(segment.id, city, road.name, length, road.freeFlowSpeed)
        
        // إنشاء تنبؤات
        await generatePredictions(segment.id, city, road.name)
        
        // إنشاء تنبيهات
        await generateAlerts(segment.id, city, road.name)
        
        // إنشاء نقاط ازدحام
        await generateBottlenecks(segment.id, city, road.name, road.coords)
      }
      
      // إنشاء بيانات طقس للمدينة
      const cityCenter = roads[0].coords[0]
      await generateWeatherData(city, cityCenter)
    }
    
    // إنشاء إحصائيات الاستخدام
    await generateUsageStats()
    
    // الحصول على جميع المقاطع لاستخدامها في البيانات الأخرى
    const allSegments = await prisma.roadSegment.findMany()
    
    // إنشاء قرارات مرورية
    await generateTrafficDecisions(allSegments)
    
    // إنشاء توصيات إشارات مرورية
    await generateSignalRecommendations(allSegments)
    
    // إنشاء مسارات طوارئ
    await generateEmergencyRoutes()
    
    // إنشاء مؤشرات الأداء
    await generateKPIs()
    
    // إنشاء مستخدمين واقعيين
    const users = await generateUsers()
    
    // إنشاء مركبات للمستخدمين
    await generateVehicles(users)
    
    // إنشاء مسارات واقعية مرتبطة بالمستخدمين
    await generateRoutes(allSegments, users)
    
    // الحصول على جميع التنبيهات لربطها بالإشعارات
    const allAlerts = await prisma.alert.findMany()
    
    // إنشاء إشعارات للمستخدمين
    await generateUserNotifications(users, allAlerts)
    
    // إنشاء سجلات الخصوصية والأمان
    await generatePrivacyAudits()
    
    // إنشاء سجلات الأحداث
    await generateAuditLogs(users)
    
    // إنشاء قواعد التنبيه
    await generateAlertRules()
    
    console.log('\n✅ تم إضافة جميع البيانات الوهمية بنجاح!')
    console.log('\n📊 ملخص البيانات:')
    
    const stats = {
      segments: await prisma.roadSegment.count(),
      trafficData: await prisma.trafficData.count(),
      predictions: await prisma.prediction.count(),
      alerts: await prisma.alert.count(),
      bottlenecks: await prisma.bottleneck.count(),
      weatherData: await prisma.weatherData.count(),
      usageStats: await prisma.usageStats.count(),
      routes: await prisma.route.count(),
      trafficDecisions: await prisma.trafficDecision.count(),
      signalRecommendations: await prisma.signalRecommendation.count(),
      emergencyRoutes: await prisma.emergencyRoute.count(),
      kpis: await prisma.kPI.count(),
      users: await prisma.user.count(),
      vehicles: await prisma.vehicle.count(),
      notifications: await prisma.userNotification.count(),
      privacyAudits: await prisma.privacyAudit.count(),
      auditLogs: await prisma.auditLog.count(),
      alertRules: await prisma.alertRule.count(),
    }
    
    console.log(JSON.stringify(stats, null, 2))
    
  } catch (error) {
    console.error('❌ خطأ في إضافة البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

