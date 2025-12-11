/**
 * سكريبت إضافة بيانات وهمية واقعية كاملة للنظام
 * يضيف بيانات محاكاة واقعية للازدحام المروري، التنبؤات، التنبيهات، والإشعارات
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// بيانات الطرق الرئيسية في المدن السعودية
const majorRoads = {
  الرياض: [
    { name: 'طريق الملك فهد', coords: [[24.7136, 46.6753], [24.7200, 46.6800]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق العليا', coords: [[24.7000, 46.6500], [24.7100, 46.6600]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الدائري الشرقي', coords: [[24.6800, 46.7000], [24.6900, 46.7100]], direction: 'شمال-جنوب', freeFlowSpeed: 90 },
    { name: 'طريق الدائري الغربي', coords: [[24.6500, 46.6000], [24.6600, 46.6100]], direction: 'شمال-جنوب', freeFlowSpeed: 90 },
    { name: 'طريق الملك عبدالعزيز', coords: [[24.7200, 46.6500], [24.7300, 46.6600]], direction: 'شرق-غرب', freeFlowSpeed: 75 },
    { name: 'طريق الأمير سلطان', coords: [[24.6900, 46.6400], [24.7000, 46.6500]], direction: 'شمال-جنوب', freeFlowSpeed: 70 },
    { name: 'طريق الملك خالد', coords: [[24.7100, 46.6800], [24.7200, 46.6900]], direction: 'شرق-غرب', freeFlowSpeed: 75 },
    { name: 'طريق العروبة', coords: [[24.6800, 46.6300], [24.6900, 46.6400]], direction: 'شمال-جنوب', freeFlowSpeed: 65 },
    { name: 'طريق التحلية', coords: [[24.7000, 46.6200], [24.7100, 46.6300]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك سلمان', coords: [[24.6500, 46.6700], [24.6600, 46.6800]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
  ],
  جدة: [
    { name: 'طريق الملك فهد', coords: [[21.4858, 39.1925], [21.4950, 39.2000]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق الكورنيش', coords: [[21.4800, 39.1800], [21.4900, 39.1900]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك عبدالعزيز', coords: [[21.5000, 39.1900], [21.5100, 39.2000]], direction: 'شمال-جنوب', freeFlowSpeed: 75 },
    { name: 'طريق الحرمين', coords: [[21.4700, 39.2000], [21.4800, 39.2100]], direction: 'شرق-غرب', freeFlowSpeed: 90 },
    { name: 'طريق المدينة', coords: [[21.4900, 39.2100], [21.5000, 39.2200]], direction: 'شمال-جنوب', freeFlowSpeed: 85 },
  ],
  الدمام: [
    { name: 'طريق الملك فهد', coords: [[26.4207, 50.0888], [26.4300, 50.1000]], direction: 'شمال-جنوب', freeFlowSpeed: 80 },
    { name: 'طريق الكورنيش', coords: [[26.4100, 50.0800], [26.4200, 50.0900]], direction: 'شرق-غرب', freeFlowSpeed: 70 },
    { name: 'طريق الملك عبدالعزيز', coords: [[26.4300, 50.0900], [26.4400, 50.1000]], direction: 'شمال-جنوب', freeFlowSpeed: 75 },
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
  
  // أنواع التنبيهات
  const alertTypes = [
    { type: 'congestion', severity: 'high', message: `ازدحام مروري شديد على ${roadName}` },
    { type: 'accident', severity: 'critical', message: `حادث مروري على ${roadName} - استخدم مساراً بديلاً` },
    { type: 'event', severity: 'medium', message: `فعالية قريبة من ${roadName} - ازدحام متوقع` },
    { type: 'weather', severity: 'medium', message: `ظروف طقس صعبة على ${roadName} - انتبه للقيادة` },
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
  
  // 20% احتمال لوجود نقطة ازدحام
  if (Math.random() < 0.2) {
    const [startLat, startLng] = coords[0]
    const [endLat, endLng] = coords[1]
    
    const originLat = startLat + (endLat - startLat) * (0.3 + Math.random() * 0.4)
    const originLng = startLng + (endLng - startLng) * (0.3 + Math.random() * 0.4)
    
    const severity = ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
    const speedDrop = 20 + Math.random() * 50 // 20-70%
    const backwardExtent = 0.5 + Math.random() * 2 // 0.5-2.5 كم
    
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
    
    console.log(`✅ تم إضافة نقطة ازدحام لـ ${roadName}`)
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

// الدالة الرئيسية
async function main() {
  console.log('🚀 بدء إضافة البيانات الوهمية الواقعية...\n')
  
  try {
    // حذف البيانات القديمة (اختياري)
    console.log('🗑️  حذف البيانات القديمة...')
    await prisma.trafficData.deleteMany({})
    await prisma.prediction.deleteMany({})
    await prisma.alert.deleteMany({})
    await prisma.bottleneck.deleteMany({})
    await prisma.weatherData.deleteMany({})
    await prisma.usageStats.deleteMany({})
    
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

