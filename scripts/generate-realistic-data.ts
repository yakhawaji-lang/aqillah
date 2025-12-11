/**
 * سكريبت إنشاء بيانات وهمية واقعية للنظام
 * يولد بيانات محاكاة كاملة تغطي جميع أقسام النظام
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// طرق حقيقية في المدن السعودية مع إحداثيات دقيقة
const realRoads = {
  الرياض: [
    {
      roadName: 'طريق الملك فهد',
      direction: 'شمال',
      startLat: 24.7136,
      startLng: 46.6753,
      endLat: 24.8500,
      endLng: 46.6753,
      length: 15.2,
      freeFlowSpeed: 80,
      hasTrafficLight: true,
    },
    {
      roadName: 'طريق الملك فهد',
      direction: 'جنوب',
      startLat: 24.7136,
      startLng: 46.6753,
      endLat: 24.5800,
      endLng: 46.6753,
      length: 13.5,
      freeFlowSpeed: 80,
      hasTrafficLight: true,
    },
    {
      roadName: 'الدائري الشرقي',
      direction: 'شرق',
      startLat: 24.7136,
      startLng: 46.6753,
      endLat: 24.7136,
      endLng: 46.8000,
      length: 12.8,
      freeFlowSpeed: 100,
      hasTrafficLight: false,
    },
    {
      roadName: 'الدائري الشرقي',
      direction: 'غرب',
      startLat: 24.7136,
      startLng: 46.6753,
      endLat: 24.7136,
      endLng: 46.5500,
      length: 12.5,
      freeFlowSpeed: 100,
      hasTrafficLight: false,
    },
    {
      roadName: 'طريق الملك عبدالعزيز',
      direction: 'شمال',
      startLat: 24.6500,
      startLng: 46.7000,
      endLat: 24.7500,
      endLng: 46.7000,
      length: 11.1,
      freeFlowSpeed: 70,
      hasTrafficLight: true,
    },
    {
      roadName: 'طريق العليا',
      direction: 'شرق',
      startLat: 24.7200,
      startLng: 46.6200,
      endLat: 24.7200,
      endLng: 46.7500,
      length: 13.0,
      freeFlowSpeed: 60,
      hasTrafficLight: true,
    },
    {
      roadName: 'طريق الخليج',
      direction: 'غرب',
      startLat: 24.7000,
      startLng: 46.6500,
      endLat: 24.7000,
      endLng: 46.5000,
      length: 15.0,
      freeFlowSpeed: 60,
      hasTrafficLight: true,
    },
    {
      roadName: 'طريق الأمير محمد بن سلمان',
      direction: 'شمال',
      startLat: 24.6800,
      startLng: 46.6800,
      endLat: 24.8000,
      endLng: 46.6800,
      length: 13.3,
      freeFlowSpeed: 80,
      hasTrafficLight: true,
    },
  ],
  جدة: [
    {
      roadName: 'طريق الملك فهد',
      direction: 'شمال',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.6000,
      endLng: 39.1925,
      length: 12.7,
      freeFlowSpeed: 80,
      hasTrafficLight: true,
    },
    {
      roadName: 'الكورنيش الشمالي',
      direction: 'غرب',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.4858,
      endLng: 39.1000,
      length: 9.2,
      freeFlowSpeed: 60,
      hasTrafficLight: false,
    },
    {
      roadName: 'طريق المدينة',
      direction: 'شرق',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.4858,
      endLng: 39.3000,
      length: 10.7,
      freeFlowSpeed: 70,
      hasTrafficLight: true,
    },
    {
      roadName: 'طريق الحرمين',
      direction: 'جنوب',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.3500,
      endLng: 39.1925,
      length: 13.6,
      freeFlowSpeed: 100,
      hasTrafficLight: false,
    },
  ],
  الدمام: [
    {
      roadName: 'الكورنيش',
      direction: 'شرق',
      startLat: 26.4207,
      startLng: 50.0888,
      endLat: 26.4207,
      endLng: 50.2000,
      length: 11.1,
      freeFlowSpeed: 60,
      hasTrafficLight: false,
    },
    {
      roadName: 'طريق الملك فهد',
      direction: 'شمال',
      startLat: 26.4207,
      startLng: 50.0888,
      endLat: 26.5500,
      endLng: 50.0888,
      length: 14.4,
      freeFlowSpeed: 80,
      hasTrafficLight: true,
    },
  ],
}

// أنواع التنبيهات الواقعية
const alertTypes = [
  { type: 'congestion', severity: 'high', message: 'ازدحام مروري شديد على الطريق' },
  { type: 'accident', severity: 'critical', message: 'حادث مروري - تجنب الطريق' },
  { type: 'event', severity: 'medium', message: 'فعالية قريبة - ازدحام متوقع' },
  { type: 'weather', severity: 'medium', message: 'ظروف جوية صعبة - انتبه للقيادة' },
  { type: 'construction', severity: 'low', message: 'أعمال صيانة على الطريق' },
]

// حالات الطقس الواقعية
const weatherConditions = [
  { condition: 'clear', temperature: 35, humidity: 30, windSpeed: 15, visibility: 10000 },
  { condition: 'clear', temperature: 38, humidity: 25, windSpeed: 20, visibility: 10000 },
  { condition: 'partly_cloudy', temperature: 32, humidity: 40, windSpeed: 18, visibility: 8000 },
  { condition: 'rain', temperature: 25, humidity: 70, windSpeed: 25, visibility: 5000, precipitation: 5 },
  { condition: 'fog', temperature: 20, humidity: 85, windSpeed: 10, visibility: 2000 },
  { condition: 'dust', temperature: 30, humidity: 20, windSpeed: 30, visibility: 3000 },
]

// دالة لتوليد رقم عشوائي بين قيمتين
function random(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

// دالة لتوليد رقم صحيح عشوائي
function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max + 1))
}

// دالة لحساب مؤشر الازدحام بناءً على الوقت
function getCongestionIndexByTime(hour: number): number {
  // ساعات الذروة: 7-9 صباحاً و 5-7 مساءً
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return randomInt(60, 95) // ازدحام شديد
  }
  // ساعات متوسطة: 10-12 و 2-4
  if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16)) {
    return randomInt(30, 60) // ازدحام متوسط
  }
  // ساعات هادئة: ليلاً وصباحاً مبكراً
  return randomInt(10, 40) // ازدحام خفيف
}

// دالة لحساب السرعة بناءً على مؤشر الازدحام
function getSpeedByCongestion(congestionIndex: number, freeFlowSpeed: number): number {
  if (congestionIndex >= 80) {
    return random(10, 25) // ازدحام شديد جداً
  }
  if (congestionIndex >= 60) {
    return random(25, 40) // ازدحام شديد
  }
  if (congestionIndex >= 40) {
    return random(40, 55) // ازدحام متوسط
  }
  return random(freeFlowSpeed * 0.7, freeFlowSpeed) // ازدحام خفيف
}

async function generateRoadSegments() {
  console.log('🚧 إنشاء مقاطع الطرق...')
  const segments = []

  for (const [city, roads] of Object.entries(realRoads)) {
    for (const road of roads) {
      const segment = await prisma.roadSegment.create({
        data: {
          roadName: road.roadName,
          city,
          direction: road.direction,
          startLat: road.startLat,
          startLng: road.startLng,
          endLat: road.endLat,
          endLng: road.endLng,
          length: road.length,
          freeFlowSpeed: road.freeFlowSpeed,
          hasTrafficLight: road.hasTrafficLight,
        },
      })
      segments.push(segment)
      console.log(`✅ تم إنشاء مقطع: ${road.roadName} - ${city} - ${road.direction}`)
    }
  }

  return segments
}

async function generateTrafficData(segments: any[]) {
  console.log('🚗 إنشاء بيانات المرور...')
  const now = new Date()
  const trafficData = []

  // إنشاء بيانات للـ 24 ساعة الماضية (كل 15 دقيقة)
  for (let hoursAgo = 0; hoursAgo < 24; hoursAgo++) {
    for (let minutesOffset = 0; minutesOffset < 60; minutesOffset += 15) {
      const timestamp = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000 - minutesOffset * 60 * 1000)
      const hour = timestamp.getHours()

      for (const segment of segments) {
        const congestionIndex = getCongestionIndexByTime(hour)
        const avgSpeed = getSpeedByCongestion(congestionIndex, segment.freeFlowSpeed)
        const deviceCount = randomInt(30, 200) // k-anonymity ≥ 30
        const density = deviceCount / segment.length
        const delayMinutes = congestionIndex >= 60 ? random(5, 30) : random(0, 5)
        const movementDirection = random(0, 360)

        const data = await prisma.trafficData.create({
          data: {
            segmentId: segment.id,
            timestamp,
            deviceCount,
            avgSpeed,
            density,
            congestionIndex,
            delayMinutes,
            movementDirection,
            kAnonymity: deviceCount,
            isAnonymized: true,
          },
        })
        trafficData.push(data)
      }
    }
  }

  console.log(`✅ تم إنشاء ${trafficData.length} سجل بيانات مرور`)
  return trafficData
}

async function generatePredictions(segments: any[]) {
  console.log('🔮 إنشاء التنبؤات...')
  const now = new Date()
  const predictions = []

  for (const segment of segments) {
    // تنبؤات لـ 5، 10، 30، 60 دقيقة قادمة
    const predictionTimes = [5, 10, 30, 60]

    for (const minutes of predictionTimes) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const futureHour = predictedFor.getHours()
      const predictedIndex = getCongestionIndexByTime(futureHour)
      const predictedDelayMinutes = predictedIndex >= 60 ? random(5, 25) : random(0, 5)
      const confidence = random(0.7, 0.95)

      const factors = {
        historicalPattern: random(0.6, 0.9),
        currentTraffic: random(0.5, 0.8),
        timeOfDay: futureHour >= 7 && futureHour <= 9 ? 0.9 : 0.5,
        dayOfWeek: predictedFor.getDay() < 5 ? 0.8 : 0.6, // أيام العمل
      }

      const prediction = await prisma.prediction.create({
        data: {
          segmentId: segment.id,
          predictedAt: now,
          predictedFor,
          predictedIndex,
          predictedDelayMinutes,
          confidence,
          factors: factors as any,
          modelType: minutes <= 10 ? 'temporal' : 'ml',
          seasonalityFactor: random(0.8, 1.2),
        },
      })
      predictions.push(prediction)
    }
  }

  console.log(`✅ تم إنشاء ${predictions.length} تنبؤ`)
  return predictions
}

async function generateAlerts(segments: any[]) {
  console.log('⚠️ إنشاء التنبيهات...')
  const now = new Date()
  const alerts = []

  // إنشاء تنبيهات نشطة
  for (let i = 0; i < segments.length * 0.3; i++) {
    const segment = segments[randomInt(0, segments.length - 1)]
    const alertType = alertTypes[randomInt(0, alertTypes.length - 1)]
    const expiresAt = new Date(now.getTime() + randomInt(1, 6) * 60 * 60 * 1000)

    // مسار بديل مقترح
    const alternativeRoute = {
      distance: segment.length * random(1.1, 1.5),
      duration: random(10, 30),
      waypoints: [
        { lat: segment.startLat + random(-0.01, 0.01), lng: segment.startLng + random(-0.01, 0.01) },
        { lat: segment.endLat + random(-0.01, 0.01), lng: segment.endLng + random(-0.01, 0.01) },
      ],
    }

    const alert = await prisma.alert.create({
      data: {
        segmentId: segment.id,
        type: alertType.type,
        severity: alertType.severity,
        message: `${alertType.message} على ${segment.roadName}`,
        alternativeRoute: alternativeRoute as any,
        createdAt: new Date(now.getTime() - randomInt(0, 120) * 60 * 1000), // قبل 0-120 دقيقة
        expiresAt,
        isActive: true,
      },
    })
    alerts.push(alert)
  }

  console.log(`✅ تم إنشاء ${alerts.length} تنبيه`)
  return alerts
}

async function generateBottlenecks(segments: any[]) {
  console.log('🔴 إنشاء نقاط الازدحام...')
  const now = new Date()
  const bottlenecks = []

  // إنشاء نقاط ازدحام نشطة
  for (let i = 0; i < segments.length * 0.2; i++) {
    const segment = segments[randomInt(0, segments.length - 1)]
    const severity = ['low', 'medium', 'high', 'critical'][randomInt(0, 3)]
    const speedDrop = severity === 'critical' ? random(60, 80) : severity === 'high' ? random(40, 60) : random(20, 40)

    const bottleneck = await prisma.bottleneck.create({
      data: {
        segmentId: segment.id,
        detectedAt: new Date(now.getTime() - randomInt(0, 60) * 60 * 1000),
        originLat: segment.startLat + (segment.endLat - segment.startLat) * random(0.3, 0.7),
        originLng: segment.startLng + (segment.endLng - segment.startLng) * random(0.3, 0.7),
        severity,
        speedDrop,
        backwardExtent: random(0.5, 3.0),
        isResolved: Math.random() < 0.3, // 30% تم حلها
        resolvedAt: Math.random() < 0.3 ? new Date(now.getTime() - randomInt(10, 120) * 60 * 1000) : null,
      },
    })
    bottlenecks.push(bottleneck)
  }

  console.log(`✅ تم إنشاء ${bottlenecks.length} نقطة ازدحام`)
  return bottlenecks
}

async function generateWeatherData() {
  console.log('🌤️ إنشاء بيانات الطقس...')
  const now = new Date()
  const weatherData = []

  // إنشاء بيانات طقس للمدن الرئيسية
  const cities = [
    { name: 'الرياض', lat: 24.7136, lng: 46.6753 },
    { name: 'جدة', lat: 21.4858, lng: 39.1925 },
    { name: 'الدمام', lat: 26.4207, lng: 50.0888 },
  ]

  for (const city of cities) {
    const weather = weatherConditions[randomInt(0, weatherConditions.length - 1)]
    const data = await prisma.weatherData.create({
      data: {
        lat: city.lat,
        lng: city.lng,
        timestamp: now,
        temperature: weather.temperature,
        humidity: weather.humidity,
        windSpeed: weather.windSpeed,
        windDirection: random(0, 360),
        visibility: weather.visibility,
        pressure: random(1010, 1020),
        precipitation: weather.precipitation || 0,
        rainRate: weather.precipitation ? random(1, 5) : 0,
        snowRate: 0,
        condition: weather.condition,
        cloudCover: random(0, 100),
        alerts: [],
        forecast: {
          hourly: Array.from({ length: 24 }, (_, i) => ({
            time: new Date(now.getTime() + i * 60 * 60 * 1000),
            temperature: weather.temperature + random(-5, 5),
            condition: weather.condition,
            precipitation: random(0, 10),
          })),
          daily: Array.from({ length: 7 }, (_, i) => ({
            date: new Date(now.getTime() + i * 24 * 60 * 60 * 1000),
            high: weather.temperature + random(0, 5),
            low: weather.temperature - random(5, 10),
            condition: weather.condition,
          })),
        },
      },
    })
    weatherData.push(data)
  }

  console.log(`✅ تم إنشاء ${weatherData.length} سجل بيانات طقس`)
  return weatherData
}

async function generateUsageStats() {
  console.log('📊 إنشاء الإحصائيات...')
  const now = new Date()
  const stats = []

  // إنشاء إحصائيات للـ 30 يوم الماضية
  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    const stat = await prisma.usageStats.create({
      data: {
        date,
        totalUsers: randomInt(1000, 5000),
        activeAlerts: randomInt(10, 50),
        routesSuggested: randomInt(500, 2000),
        avgResponseTime: random(0.5, 2.0),
      },
    })
    stats.push(stat)
  }

  console.log(`✅ تم إنشاء ${stats.length} سجل إحصائيات`)
  return stats
}

async function generateTrafficDecisions(segments: any[]) {
  console.log('🎯 إنشاء القرارات المرورية...')
  const now = new Date()
  const decisions = []

  const decisionTypes = ['diversion', 'signal_adjustment', 'intervention']
  const statuses = ['pending', 'approved', 'implemented', 'rejected']

  for (let i = 0; i < segments.length * 0.15; i++) {
    const segment = segments[randomInt(0, segments.length - 1)]
    const decisionType = decisionTypes[randomInt(0, decisionTypes.length - 1)]
    const status = statuses[randomInt(0, statuses.length - 1)]

    const decision = await prisma.trafficDecision.create({
      data: {
        segmentId: segment.id,
        decisionType,
        recommendedAt: new Date(now.getTime() - randomInt(0, 48) * 60 * 60 * 1000),
        implementedAt: status === 'implemented' ? new Date(now.getTime() - randomInt(0, 24) * 60 * 60 * 1000) : null,
        expectedDelayReduction: random(5, 20),
        expectedBenefitScore: random(60, 95),
        affectedSegments: [segment.id],
        details: {
          reason: 'ازدحام مروري شديد',
          action: decisionType === 'diversion' ? 'تحويل المرور' : 'تعديل الإشارات',
          priority: 'high',
        },
        status,
      },
    })
    decisions.push(decision)
  }

  console.log(`✅ تم إنشاء ${decisions.length} قرار مروري`)
  return decisions
}

async function generateSignalRecommendations(segments: any[]) {
  console.log('🚦 إنشاء توصيات الإشارات...')
  const now = new Date()
  const recommendations = []

  const priorities = ['normal', 'high', 'emergency']

  for (const segment of segments.filter(s => s.hasTrafficLight)) {
    if (Math.random() < 0.4) {
      // 40% من الإشارات لديها توصيات
      const recommendation = await prisma.signalRecommendation.create({
        data: {
          segmentId: segment.id,
          signalId: `signal-${segment.id}`,
          recommendedAt: new Date(now.getTime() - randomInt(0, 24) * 60 * 60 * 1000),
          greenTimeSeconds: randomInt(30, 60),
          cycleTimeSeconds: randomInt(90, 180),
          priority: priorities[randomInt(0, priorities.length - 1)],
          expectedImpact: {
            delayReduction: random(5, 15),
            throughputIncrease: random(10, 30),
          },
          implemented: Math.random() < 0.5,
          implementedAt: Math.random() < 0.5 ? new Date(now.getTime() - randomInt(0, 12) * 60 * 60 * 1000) : null,
        },
      })
      recommendations.push(recommendation)
    }
  }

  console.log(`✅ تم إنشاء ${recommendations.length} توصية إشارة`)
  return recommendations
}

async function generateKPIs() {
  console.log('📈 إنشاء مؤشرات الأداء...')
  const now = new Date()
  const kpis = []

  const kpiTypes = ['prediction_accuracy', 'response_time', 'decision_effectiveness', 'privacy_compliance', 'system_uptime']

  // إنشاء KPIs للـ 7 أيام الماضية
  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

    for (const kpiType of kpiTypes) {
      let value = 0
      switch (kpiType) {
        case 'prediction_accuracy':
          value = random(75, 95)
          break
        case 'response_time':
          value = random(0.5, 2.0)
          break
        case 'decision_effectiveness':
          value = random(70, 90)
          break
        case 'privacy_compliance':
          value = random(95, 100)
          break
        case 'system_uptime':
          value = random(98, 100)
          break
      }

      const kpi = await prisma.kPI.create({
        data: {
          date,
          kpiType,
          predictionAccuracy: kpiType === 'prediction_accuracy' ? value : random(75, 95),
          responseTime: kpiType === 'response_time' ? value : random(0.5, 2.0),
          decisionEffectiveness: kpiType === 'decision_effectiveness' ? value : random(70, 90),
          privacyCompliance: kpiType === 'privacy_compliance' ? value : random(95, 100),
          systemUptime: kpiType === 'system_uptime' ? value : random(98, 100),
          details: {
            notes: 'أداء جيد',
            improvements: [],
          },
        },
      })
      kpis.push(kpi)
    }
  }

  console.log(`✅ تم إنشاء ${kpis.length} مؤشر أداء`)
  return kpis
}

async function main() {
  try {
    console.log('🚀 بدء إنشاء البيانات الوهمية الواقعية...\n')

    // 1. إنشاء مقاطع الطرق
    const segments = await generateRoadSegments()
    console.log(`\n✅ تم إنشاء ${segments.length} مقطع طريق\n`)

    // 2. إنشاء بيانات المرور
    await generateTrafficData(segments)
    console.log('')

    // 3. إنشاء التنبؤات
    await generatePredictions(segments)
    console.log('')

    // 4. إنشاء التنبيهات
    await generateAlerts(segments)
    console.log('')

    // 5. إنشاء نقاط الازدحام
    await generateBottlenecks(segments)
    console.log('')

    // 6. إنشاء بيانات الطقس
    await generateWeatherData()
    console.log('')

    // 7. إنشاء الإحصائيات
    await generateUsageStats()
    console.log('')

    // 8. إنشاء القرارات المرورية
    await generateTrafficDecisions(segments)
    console.log('')

    // 9. إنشاء توصيات الإشارات
    await generateSignalRecommendations(segments)
    console.log('')

    // 10. إنشاء مؤشرات الأداء
    await generateKPIs()
    console.log('')

    console.log('✅ تم إنشاء جميع البيانات الوهمية بنجاح!')
    console.log('\n📊 ملخص البيانات:')
    console.log(`   - مقاطع الطرق: ${segments.length}`)
    console.log(`   - بيانات المرور: ~${segments.length * 96} سجل`)
    console.log(`   - التنبؤات: ~${segments.length * 4} تنبؤ`)
    console.log(`   - التنبيهات: ~${Math.floor(segments.length * 0.3)} تنبيه`)
    console.log(`   - نقاط الازدحام: ~${Math.floor(segments.length * 0.2)} نقطة`)
    console.log(`   - بيانات الطقس: 3 سجلات`)
    console.log(`   - الإحصائيات: 30 سجل`)
    console.log(`   - القرارات المرورية: ~${Math.floor(segments.length * 0.15)} قرار`)
    console.log(`   - توصيات الإشارات: ~${Math.floor(segments.filter(s => s.hasTrafficLight).length * 0.4)} توصية`)
    console.log(`   - مؤشرات الأداء: 35 مؤشر`)
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error)
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

