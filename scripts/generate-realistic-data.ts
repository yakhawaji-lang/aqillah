/**
 * سكريبت شامل لإضافة بيانات واقعية للنظام
 * يحاكي البرنامج بشكل كامل مع التوجهات والتحرك والخرائط والتنبيهات
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// الطرق الرئيسية في المدن السعودية
const majorRoads = {
  'الرياض': [
    { name: 'طريق الملك فهد', directions: ['شمال', 'جنوب'], coords: [[24.7136, 46.6753], [24.8000, 46.7000]] },
    { name: 'طريق الدائري الشرقي', directions: ['شرق', 'غرب'], coords: [[24.6500, 46.8000], [24.7500, 46.8000]] },
    { name: 'طريق الدائري الغربي', directions: ['شرق', 'غرب'], coords: [[24.6500, 46.5500], [24.7500, 46.5500]] },
    { name: 'طريق الدائري الشمالي', directions: ['شمال', 'جنوب'], coords: [[24.8000, 46.6000], [24.8000, 46.7000]] },
    { name: 'طريق الدائري الجنوبي', directions: ['شمال', 'جنوب'], coords: [[24.6000, 46.6000], [24.6000, 46.7000]] },
    { name: 'طريق الملك عبدالعزيز', directions: ['شرق', 'غرب'], coords: [[24.7000, 46.6000], [24.7000, 46.8000]] },
    { name: 'طريق الأمير سلطان', directions: ['شمال', 'جنوب'], coords: [[24.7200, 46.6500], [24.7200, 46.7500]] },
    { name: 'طريق العليا', directions: ['شرق', 'غرب'], coords: [[24.6800, 46.6500], [24.6800, 46.7500]] },
    { name: 'طريق العروبة', directions: ['شمال', 'جنوب'], coords: [[24.6900, 46.6400], [24.6900, 46.7400]] },
    { name: 'طريق الخليج', directions: ['شرق', 'غرب'], coords: [[24.7100, 46.6200], [24.7100, 46.7200]] },
  ],
  'جدة': [
    { name: 'طريق الملك فهد', directions: ['شمال', 'جنوب'], coords: [[21.4858, 39.1925], [21.5500, 39.2000]] },
    { name: 'طريق الكورنيش', directions: ['شرق', 'غرب'], coords: [[21.4800, 39.1500], [21.4800, 39.2500]] },
    { name: 'طريق الحرمين', directions: ['شمال', 'جنوب'], coords: [[21.5000, 39.1800], [21.5000, 39.2200]] },
    { name: 'طريق الملك عبدالله', directions: ['شرق', 'غرب'], coords: [[21.5200, 39.1700], [21.5200, 39.2300]] },
    { name: 'طريق التحلية', directions: ['شمال', 'جنوب'], coords: [[21.4900, 39.1900], [21.4900, 39.2100]] },
  ],
  'الدمام': [
    { name: 'طريق الملك فهد', directions: ['شمال', 'جنوب'], coords: [[26.4207, 50.0888], [26.4800, 50.1000]] },
    { name: 'طريق الكورنيش', directions: ['شرق', 'غرب'], coords: [[26.4100, 50.0500], [26.4100, 50.1500]] },
    { name: 'طريق الخليج', directions: ['شمال', 'جنوب'], coords: [[26.4300, 50.0700], [26.4300, 50.1100]] },
  ],
}

// أنماط الازدحام حسب الوقت
const congestionPatterns = {
  morning: { min: 40, max: 85, peak: [7, 8, 9] }, // 7-9 صباحاً
  midday: { min: 20, max: 50, peak: [] },
  afternoon: { min: 30, max: 70, peak: [12, 13, 14] }, // 12-2 ظهراً
  evening: { min: 50, max: 95, peak: [17, 18, 19, 20] }, // 5-8 مساءً
  night: { min: 10, max: 30, peak: [] },
}

// أنواع التنبيهات
const alertTypes = [
  { type: 'congestion', severity: 'high', messages: ['ازدحام شديد على الطريق', 'حركة مرور بطيئة', 'تأخير متوقع'] },
  { type: 'accident', severity: 'critical', messages: ['حادث مروري', 'إغلاق جزئي للطريق', 'انحراف المركبات'] },
  { type: 'event', severity: 'medium', messages: ['فعالية قريبة', 'تجمع مروري', 'زيادة في حركة المرور'] },
  { type: 'weather', severity: 'high', messages: ['أمطار غزيرة', 'رؤية منخفضة', 'رياح قوية'] },
  { type: 'construction', severity: 'medium', messages: ['أعمال صيانة', 'إغلاق حارة', 'انحراف مؤقت'] },
]

// حالات الطقس
const weatherConditions = [
  { condition: 'clear', temp: { min: 25, max: 35 }, humidity: { min: 30, max: 50 }, windSpeed: { min: 5, max: 15 } },
  { condition: 'partly_cloudy', temp: { min: 22, max: 32 }, humidity: { min: 40, max: 60 }, windSpeed: { min: 10, max: 20 } },
  { condition: 'cloudy', temp: { min: 20, max: 30 }, humidity: { min: 50, max: 70 }, windSpeed: { min: 15, max: 25 } },
  { condition: 'rain', temp: { min: 18, max: 28 }, humidity: { min: 70, max: 90 }, windSpeed: { min: 20, max: 35 }, precipitation: { min: 2, max: 15 } },
  { condition: 'heavy_rain', temp: { min: 15, max: 25 }, humidity: { min: 80, max: 95 }, windSpeed: { min: 25, max: 45 }, precipitation: { min: 15, max: 50 } },
  { condition: 'fog', temp: { min: 18, max: 25 }, humidity: { min: 85, max: 100 }, windSpeed: { min: 2, max: 10 }, visibility: { min: 100, max: 500 } },
]

// توليد رقم عشوائي بين قيمتين
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// توليد عدد صحيح عشوائي
function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max))
}

// الحصول على نمط الازدحام حسب الوقت
function getCongestionPattern(hour: number): typeof congestionPatterns.morning {
  if (hour >= 6 && hour < 10) return congestionPatterns.morning
  if (hour >= 10 && hour < 14) return congestionPatterns.midday
  if (hour >= 14 && hour < 17) return congestionPatterns.afternoon
  if (hour >= 17 && hour < 21) return congestionPatterns.evening
  return congestionPatterns.night
}

// حساب مؤشر الازدحام بناءً على الوقت
function calculateCongestionIndex(hour: number, baseIndex: number = 30): number {
  const pattern = getCongestionPattern(hour)
  const isPeak = pattern.peak.includes(hour)
  const multiplier = isPeak ? 1.5 : 1.0
  const congestion = baseIndex * multiplier + randomBetween(pattern.min, pattern.max)
  return Math.min(100, Math.max(0, Math.round(congestion)))
}

// إنشاء مقاطع الطرق
async function createRoadSegments() {
  console.log('🚧 إنشاء مقاطع الطرق...')
  const segments = []

  for (const [city, roads] of Object.entries(majorRoads)) {
    for (const road of roads) {
      for (const direction of road.directions) {
        const [startLat, startLng] = road.coords[0]
        const [endLat, endLng] = road.coords[1]
        
        // حساب المسافة التقريبية
        const distance = Math.sqrt(
          Math.pow((endLat - startLat) * 111, 2) + 
          Math.pow((endLng - startLng) * 111, 2)
        )

        const segment = await prisma.roadSegment.create({
          data: {
            roadName: road.name,
            city,
            direction,
            startLat,
            startLng,
            endLat,
            endLng,
            length: Math.round(distance * 10) / 10,
            freeFlowSpeed: randomInt(60, 80),
            hasTrafficLight: Math.random() > 0.5,
          },
        })

        segments.push(segment)
      }
    }
  }

  console.log(`✅ تم إنشاء ${segments.length} مقطع طريق`)
  return segments
}

// إنشاء بيانات ازدحام واقعية
async function createTrafficData(segments: any[], days: number = 7) {
  console.log(`📊 إنشاء بيانات ازدحام لآخر ${days} أيام...`)
  const now = new Date()
  const trafficData = []

  for (let day = 0; day < days; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)

    for (const segment of segments) {
      // إنشاء بيانات كل ساعة
      for (let hour = 0; hour < 24; hour++) {
        const timestamp = new Date(date)
        timestamp.setHours(hour, randomInt(0, 59), randomInt(0, 59))

        const congestionIndex = calculateCongestionIndex(hour)
        const avgSpeed = segment.freeFlowSpeed * (1 - congestionIndex / 100)
        const density = congestionIndex * 2 + randomInt(10, 50)
        const deviceCount = Math.max(30, Math.round(density * segment.length))
        const delayMinutes = (congestionIndex / 100) * (segment.length / avgSpeed) * 60

        const data = await prisma.trafficData.create({
          data: {
            segmentId: segment.id,
            timestamp,
            deviceCount,
            avgSpeed: Math.round(avgSpeed * 10) / 10,
            density: Math.round(density * 10) / 10,
            congestionIndex,
            delayMinutes: Math.round(delayMinutes * 10) / 10,
            movementDirection: randomInt(0, 360),
            kAnonymity: randomInt(30, 100),
            isAnonymized: true,
          },
        })

        trafficData.push(data)
      }
    }
  }

  console.log(`✅ تم إنشاء ${trafficData.length} سجل ازدحام`)
  return trafficData
}

// إنشاء تنبؤات
async function createPredictions(segments: any[]) {
  console.log('🔮 إنشاء تنبؤات...')
  const now = new Date()
  const predictions = []

  for (const segment of segments) {
    // تنبؤات للـ 5، 10، 30، 60 دقيقة القادمة
    const intervals = [5, 10, 30, 60]
    
    for (const minutes of intervals) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const futureHour = predictedFor.getHours()
      
      const predictedIndex = calculateCongestionIndex(futureHour)
      const predictedDelay = (predictedIndex / 100) * (segment.length / segment.freeFlowSpeed) * 60
      const confidence = 1 - (minutes / 120) // تقل الثقة مع الوقت

      const prediction = await prisma.prediction.create({
        data: {
          segmentId: segment.id,
          predictedAt: now,
          predictedFor,
          predictedIndex,
          predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
          confidence: Math.round(confidence * 100) / 100,
          factors: {
            timeOfDay: futureHour,
            historicalAverage: predictedIndex,
            weatherImpact: randomInt(-5, 5),
            events: [],
          },
          modelType: 'temporal',
          seasonalityFactor: 1.0,
        },
      })

      predictions.push(prediction)
    }
  }

  console.log(`✅ تم إنشاء ${predictions.length} تنبؤ`)
  return predictions
}

// إنشاء تنبيهات
async function createAlerts(segments: any[]) {
  console.log('⚠️ إنشاء تنبيهات...')
  const alerts = []
  const now = new Date()

  // إنشاء تنبيهات نشطة
  const activeAlertsCount = randomInt(5, 15)
  const selectedSegments = segments.sort(() => 0.5 - Math.random()).slice(0, activeAlertsCount)

  for (const segment of selectedSegments) {
    const alertType = alertTypes[randomInt(0, alertTypes.length)]
    const message = alertType.messages[randomInt(0, alertType.messages.length)]
    
    const expiresAt = new Date(now)
    expiresAt.setHours(expiresAt.getHours() + randomInt(1, 6))

    const alert = await prisma.alert.create({
      data: {
        segmentId: segment.id,
        type: alertType.type,
        severity: alertType.severity,
        message: `${message} على ${segment.roadName}`,
        alternativeRoute: {
          distance: segment.length * 1.2,
          duration: segment.length * 1.3,
          waypoints: [],
        },
        createdAt: new Date(now.getTime() - randomInt(0, 120) * 60 * 1000),
        expiresAt,
        isActive: true,
      },
    })

    alerts.push(alert)
  }

  console.log(`✅ تم إنشاء ${alerts.length} تنبيه نشط`)
  return alerts
}

// إنشاء بيانات طقس
async function createWeatherData() {
  console.log('🌤️ إنشاء بيانات الطقس...')
  const cities = [
    { name: 'الرياض', coords: [24.7136, 46.6753] },
    { name: 'جدة', coords: [21.4858, 39.1925] },
    { name: 'الدمام', coords: [26.4207, 50.0888] },
  ]

  const weatherRecords = []
  const now = new Date()

  for (const city of cities) {
    const condition = weatherConditions[randomInt(0, weatherConditions.length)]
    const weather = condition

    const weatherData = await prisma.weatherData.create({
      data: {
        lat: city.coords[0],
        lng: city.coords[1],
        timestamp: now,
        temperature: randomInt(weather.temp.min, weather.temp.max),
        humidity: randomInt(weather.humidity.min, weather.humidity.max),
        windSpeed: randomInt(weather.windSpeed.min, weather.windSpeed.max),
        windDirection: randomInt(0, 360),
        visibility: weather.visibility 
          ? randomInt(weather.visibility.min, weather.visibility.max)
          : randomInt(5000, 10000),
        pressure: randomInt(1000, 1020),
        precipitation: weather.precipitation 
          ? randomBetween(weather.precipitation.min, weather.precipitation.max)
          : 0,
        rainRate: weather.precipitation 
          ? randomBetween(weather.precipitation.min, weather.precipitation.max) / 10
          : 0,
        snowRate: 0,
        condition: weather.condition,
        cloudCover: randomInt(0, 100),
        alerts: [],
        forecast: {
          hourly: Array.from({ length: 24 }, (_, i) => ({
            time: new Date(now.getTime() + i * 60 * 60 * 1000),
            temp: randomInt(weather.temp.min, weather.temp.max),
            condition: weather.condition,
            precipitation: weather.precipitation ? randomBetween(0, weather.precipitation.max) : 0,
          })),
        },
      },
    })

    weatherRecords.push(weatherData)
  }

  console.log(`✅ تم إنشاء ${weatherRecords.length} سجل طقس`)
  return weatherRecords
}

// إنشاء نقاط ازدحام (Bottlenecks)
async function createBottlenecks(segments: any[]) {
  console.log('🚧 إنشاء نقاط ازدحام...')
  const bottlenecks = []
  const now = new Date()

  // اختيار مقاطع عشوائية لإنشاء نقاط ازدحام
  const bottleneckSegments = segments
    .filter(s => s.congestionIndex > 60)
    .sort(() => 0.5 - Math.random())
    .slice(0, randomInt(3, 8))

  // الحصول على مقاطع مع ازدحام عالي
  const highCongestionSegments = await prisma.trafficData.findMany({
    where: {
      congestionIndex: { gte: 60 },
      timestamp: { gte: new Date(now.getTime() - 60 * 60 * 1000) },
    },
    include: { segment: true },
    take: 10,
  })

  const uniqueSegments = Array.from(
    new Map(highCongestionSegments.map(d => [d.segmentId, d.segment])).values()
  )

  for (const segment of uniqueSegments.slice(0, randomInt(3, 8))) {
    const bottleneck = await prisma.bottleneck.create({
      data: {
        segmentId: segment.id,
        detectedAt: new Date(now.getTime() - randomInt(0, 60) * 60 * 1000),
        originLat: (segment.startLat + segment.endLat) / 2,
        originLng: (segment.startLng + segment.endLng) / 2,
        severity: ['low', 'medium', 'high', 'critical'][randomInt(0, 4)],
        speedDrop: randomInt(30, 70),
        backwardExtent: randomBetween(0.5, 3.0),
        isResolved: Math.random() > 0.3,
        resolvedAt: Math.random() > 0.3 
          ? new Date(now.getTime() - randomInt(0, 30) * 60 * 1000)
          : null,
      },
    })

    bottlenecks.push(bottleneck)
  }

  console.log(`✅ تم إنشاء ${bottlenecks.length} نقطة ازدحام`)
  return bottlenecks
}

// إنشاء قرارات مرورية
async function createTrafficDecisions(segments: any[]) {
  console.log('🎯 إنشاء قرارات مرورية...')
  const decisions = []
  const now = new Date()

  const decisionTypes = ['diversion', 'signal_adjustment', 'intervention']
  const selectedSegments = segments.sort(() => 0.5 - Math.random()).slice(0, randomInt(2, 5))

  for (const segment of selectedSegments) {
    const decision = await prisma.trafficDecision.create({
      data: {
        segmentId: segment.id,
        decisionType: decisionTypes[randomInt(0, decisionTypes.length)],
        recommendedAt: new Date(now.getTime() - randomInt(0, 60) * 60 * 1000),
        implementedAt: Math.random() > 0.5 
          ? new Date(now.getTime() - randomInt(0, 30) * 60 * 1000)
          : null,
        expectedDelayReduction: randomBetween(5, 20),
        expectedBenefitScore: randomInt(60, 95),
        affectedSegments: [segment.id],
        details: {
          description: `قرار ${decisionTypes[randomInt(0, decisionTypes.length)]} للمقطع ${segment.roadName}`,
          impact: 'positive',
        },
        status: ['pending', 'approved', 'implemented'][randomInt(0, 3)],
      },
    })

    decisions.push(decision)
  }

  console.log(`✅ تم إنشاء ${decisions.length} قرار مروري`)
  return decisions
}

// إنشاء إحصائيات الاستخدام
async function createUsageStats() {
  console.log('📈 إنشاء إحصائيات الاستخدام...')
  const stats = []
  const now = new Date()

  for (let day = 0; day < 30; day++) {
    const date = new Date(now)
    date.setDate(date.getDate() - day)
    date.setHours(0, 0, 0, 0)

    const stat = await prisma.usageStats.create({
      data: {
        date,
        totalUsers: randomInt(1000, 5000),
        activeAlerts: randomInt(10, 50),
        routesSuggested: randomInt(500, 2000),
        avgResponseTime: randomBetween(0.5, 2.0),
      },
    })

    stats.push(stat)
  }

  console.log(`✅ تم إنشاء ${stats.length} سجل إحصائيات`)
  return stats
}

// الدالة الرئيسية
async function main() {
  try {
    console.log('🚀 بدء إنشاء البيانات الواقعية...\n')

    // إنشاء مقاطع الطرق
    const segments = await createRoadSegments()
    
    // إنشاء بيانات الازدحام
    await createTrafficData(segments, 7)
    
    // إنشاء التنبؤات
    await createPredictions(segments)
    
    // إنشاء التنبيهات
    await createAlerts(segments)
    
    // إنشاء بيانات الطقس
    await createWeatherData()
    
    // إنشاء نقاط الازدحام
    await createBottlenecks(segments)
    
    // إنشاء القرارات المرورية
    await createTrafficDecisions(segments)
    
    // إنشاء إحصائيات الاستخدام
    await createUsageStats()

    console.log('\n✅ تم إنشاء جميع البيانات بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل السكريبت
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

export default main

