import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// أنماط ازدحام واقعية (محاكاة ذروة صباحية)
const congestionPatterns = {
  morningRush: {
    start: 0, // بداية الجلسة
    peak: 15, // ذروة بعد 15 دقيقة
    end: 30, // نهاية الجلسة
    baseCongestion: 30,
    peakCongestion: 85,
  },
  normal: {
    baseCongestion: 20,
    variance: 15,
  },
}

// قائمة المقاطع المرورية
const roadSegments = [
  { name: 'طريق الملك فهد', city: 'الرياض', direction: 'شمال', lat: 24.7136, lng: 46.6753, freeFlowSpeed: 80 },
  { name: 'طريق الملك فهد', city: 'الرياض', direction: 'جنوب', lat: 24.7136, lng: 46.6753, freeFlowSpeed: 80 },
  { name: 'طريق العليا', city: 'الرياض', direction: 'شرق', lat: 24.7200, lng: 46.6850, freeFlowSpeed: 60 },
  { name: 'طريق العليا', city: 'الرياض', direction: 'غرب', lat: 24.7200, lng: 46.6850, freeFlowSpeed: 60 },
  { name: 'طريق الجامعة', city: 'الرياض', direction: 'شمال', lat: 24.7228, lng: 46.6256, freeFlowSpeed: 60 },
  { name: 'طريق الجامعة', city: 'الرياض', direction: 'جنوب', lat: 24.7228, lng: 46.6256, freeFlowSpeed: 60 },
  { name: 'طريق الدائري الشرقي', city: 'الرياض', direction: 'شمال', lat: 24.7500, lng: 46.8000, freeFlowSpeed: 100 },
  { name: 'طريق الدائري الشرقي', city: 'الرياض', direction: 'جنوب', lat: 24.7500, lng: 46.8000, freeFlowSpeed: 100 },
  { name: 'طريق الكورنيش', city: 'جدة', direction: 'شمال', lat: 21.4858, lng: 39.1925, freeFlowSpeed: 70 },
  { name: 'طريق الكورنيش', city: 'جدة', direction: 'جنوب', lat: 21.4858, lng: 39.1925, freeFlowSpeed: 70 },
  { name: 'طريق الملك عبدالعزيز', city: 'جدة', direction: 'شرق', lat: 21.5000, lng: 39.2000, freeFlowSpeed: 60 },
  { name: 'طريق الملك عبدالعزيز', city: 'جدة', direction: 'غرب', lat: 21.5000, lng: 39.2000, freeFlowSpeed: 60 },
  { name: 'طريق الخليج', city: 'الدمام', direction: 'شمال', lat: 26.4207, lng: 50.0888, freeFlowSpeed: 70 },
  { name: 'طريق الخليج', city: 'الدمام', direction: 'جنوب', lat: 26.4207, lng: 50.0888, freeFlowSpeed: 70 },
  { name: 'طريق الملك فهد', city: 'الدمام', direction: 'شرق', lat: 26.4207, lng: 50.0888, freeFlowSpeed: 60 },
]

// حساب مؤشر الازدحام بناءً على الوقت
function calculateCongestionIndex(minute: number, baseIndex: number): number {
  const pattern = congestionPatterns.morningRush
  const progress = minute / pattern.end // 0 إلى 1
  
  // منحنى ذروة صباحية
  let congestionMultiplier = 1
  if (progress < 0.5) {
    // تصاعدي حتى الذروة
    congestionMultiplier = 1 + (progress * 2) * 1.5
  } else {
    // تنازلي بعد الذروة
    congestionMultiplier = 2.5 - ((progress - 0.5) * 2) * 0.8
  }
  
  const congestion = baseIndex * congestionMultiplier + Math.random() * 15 - 7.5
  return Math.max(0, Math.min(100, Math.round(congestion)))
}

// توليد بيانات مرورية لمقطع واحد
async function generateTrafficData(segmentId: string, minute: number) {
  const segment = await prisma.roadSegment.findUnique({ where: { id: segmentId } })
  if (!segment) return

  const baseCongestion = congestionPatterns.normal.baseCongestion + Math.random() * 20
  const congestionIndex = calculateCongestionIndex(minute, baseCongestion)
  
  // حساب البيانات بناءً على مؤشر الازدحام
  const freeFlowSpeed = segment.freeFlowSpeed || 60
  const avgSpeed = freeFlowSpeed * (1 - congestionIndex / 100) + Math.random() * 5
  const deviceCount = Math.max(30, Math.round(50 + congestionIndex * 2 + Math.random() * 30))
  const density = deviceCount / (segment.length || 1)
  const delayMinutes = (congestionIndex / 100) * 10 + Math.random() * 3

  const trafficData = await prisma.trafficData.create({
    data: {
      segmentId,
      deviceCount,
      avgSpeed: Math.round(avgSpeed * 10) / 10,
      density: Math.round(density * 10) / 10,
      congestionIndex,
      delayMinutes: Math.round(delayMinutes * 10) / 10,
      movementDirection: Math.random() * 360,
      kAnonymity: Math.max(30, deviceCount),
      isAnonymized: true,
      timestamp: new Date(),
    },
  })

  return trafficData
}

// توليد تنبؤات
async function generatePredictions(segmentId: string) {
  const recentData = await prisma.trafficData.findMany({
    where: { segmentId },
    orderBy: { timestamp: 'desc' },
    take: 10,
  })

  if (recentData.length === 0) return

  const currentCongestion = recentData[0].congestionIndex
  const predictions = []

  // تنبؤات لـ 5, 10, 30, 60 دقيقة
  const intervals = [5, 10, 30, 60]
  
  for (const minutes of intervals) {
    const predictedFor = new Date(Date.now() + minutes * 60000)
    
    // محاكاة تنبؤ ذكي
    let predictedIndex = currentCongestion
    if (currentCongestion > 70) {
      // إذا كان الازدحام عالي، يتوقع أن يزداد
      predictedIndex = Math.min(100, currentCongestion + minutes * 0.3)
    } else if (currentCongestion < 30) {
      // إذا كان الازدحام منخفض، يتوقع أن يبقى منخفض
      predictedIndex = currentCongestion + Math.random() * 10
    } else {
      // حالة متوسطة
      predictedIndex = currentCongestion + (Math.random() - 0.5) * 20
    }

    const confidence = Math.max(0.6, 1 - (minutes / 60) * 0.3)
    const predictedDelay = (predictedIndex / 100) * 10

    predictions.push({
      segmentId,
      predictedFor,
      predictedIndex: Math.round(Math.max(0, Math.min(100, predictedIndex))),
      predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
      confidence: Math.round(confidence * 100) / 100,
      factors: {
        currentCongestion,
        timeOfDay: new Date().getHours(),
        dayOfWeek: new Date().getDay(),
        historicalAverage: currentCongestion,
      },
      modelType: minutes <= 10 ? 'temporal' : minutes <= 30 ? 'ml' : 'seasonal',
      seasonalityFactor: 1 + Math.sin((new Date().getHours() - 6) / 12 * Math.PI) * 0.2,
    })
  }

  // حفظ التنبؤات
  for (const pred of predictions) {
    await prisma.prediction.create({ data: pred })
  }
}

// أنواع التنبيهات المختلفة
const alertTypes = ['congestion', 'accident', 'event', 'weather', 'construction', 'road_closed']
const alertMessages = {
  congestion: {
    critical: (road: string, dir: string) => `🚨 ازدحام شديد على ${road} - ${dir}. يُنصح بتجنب هذا الطريق تماماً.`,
    high: (road: string, dir: string) => `🔶 ازدحام عالي على ${road} - ${dir}. يُنصح بمسار بديل.`,
    medium: (road: string, dir: string) => `⚠️ ازدحام متوسط على ${road} - ${dir}. قد تواجه تأخير بسيط.`,
  },
  accident: {
    critical: (road: string, dir: string) => `🚨 حادث مروري على ${road} - ${dir}. تجنب الطريق فوراً.`,
    high: (road: string, dir: string) => `🔶 حادث مروري على ${road} - ${dir}. ازدحام متوقع.`,
    medium: (road: string, dir: string) => `⚠️ حادث بسيط على ${road} - ${dir}. حركة بطيئة.`,
  },
  event: {
    critical: (road: string, dir: string) => `🚨 فعالية كبيرة على ${road} - ${dir}. ازدحام شديد متوقع.`,
    high: (road: string, dir: string) => `🔶 فعالية على ${road} - ${dir}. ازدحام متوقع.`,
    medium: (road: string, dir: string) => `⚠️ فعالية على ${road} - ${dir}. حركة بطيئة.`,
  },
  weather: {
    critical: (road: string, dir: string) => `🚨 ظروف جوية صعبة على ${road} - ${dir}. توخ الحذر.`,
    high: (road: string, dir: string) => `🔶 ظروف جوية على ${road} - ${dir}. حركة بطيئة.`,
    medium: (road: string, dir: string) => `⚠️ ظروف جوية خفيفة على ${road} - ${dir}.`,
  },
  construction: {
    critical: (road: string, dir: string) => `🚨 أعمال بناء على ${road} - ${dir}. مسار مغلق.`,
    high: (road: string, dir: string) => `🔶 أعمال بناء على ${road} - ${dir}. ازدحام متوقع.`,
    medium: (road: string, dir: string) => `⚠️ أعمال بناء على ${road} - ${dir}. حركة بطيئة.`,
  },
  road_closed: {
    critical: (road: string, dir: string) => `🚨 إغلاق كامل لـ ${road} - ${dir}. استخدم مسار بديل.`,
    high: (road: string, dir: string) => `🔶 إغلاق جزئي لـ ${road} - ${dir}. ازدحام شديد.`,
    medium: (road: string, dir: string) => `⚠️ إغلاق جزئي لـ ${road} - ${dir}. حركة بطيئة.`,
  },
}

// توليد تنبيهات عند ازدحام عالي - كثيفة جداً
async function generateAlerts(segmentId: string, congestionIndex: number, minute: number) {
  const segment = await prisma.roadSegment.findUnique({ where: { id: segmentId } })
  if (!segment) return

  // توليد تنبيهات كثيفة - كل دقيقة عند ازدحام
  if (congestionIndex >= 50) {
    // احتمال توليد تنبيه بناءً على مستوى الازدحام
    const alertProbability = (congestionIndex - 50) / 50 // 0% عند 50، 100% عند 100
    
    if (Math.random() < alertProbability) {
      const severity = congestionIndex >= 90 ? 'critical' : congestionIndex >= 80 ? 'high' : 'medium'
      
      // اختيار نوع تنبيه عشوائي (مع احتمال أعلى للازدحام)
      let alertType: string
      const rand = Math.random()
      if (rand < 0.5) {
        alertType = 'congestion'
      } else if (rand < 0.7) {
        alertType = 'accident'
      } else if (rand < 0.85) {
        alertType = 'event'
      } else if (rand < 0.92) {
        alertType = 'weather'
      } else if (rand < 0.97) {
        alertType = 'construction'
      } else {
        alertType = 'road_closed'
      }

      const messages = alertMessages[alertType as keyof typeof alertMessages]
      const message = messages[severity as keyof typeof messages](segment.roadName, segment.direction)

      // التحقق من وجود تنبيه نشط من نفس النوع
      const existingAlert = await prisma.alert.findFirst({
        where: {
          segmentId,
          type: alertType,
          isActive: true,
          expiresAt: { gt: new Date() },
        },
      })

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            segmentId,
            type: alertType,
            severity,
            message,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + (30 + Math.random() * 30) * 60000), // 30-60 دقيقة
            isActive: true,
            alternativeRoute: {
              suggested: true,
              estimatedTime: Math.round((congestionIndex / 100) * 15),
              alternativeSegments: [],
            },
          },
        })
      }
    }
  }

  // توليد تنبيهات خاصة كل 5 دقائق
  if (minute % 5 === 0 && congestionIndex >= 60) {
    const specialTypes = ['event', 'construction', 'weather']
    const specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)]
    const severity = congestionIndex >= 85 ? 'critical' : congestionIndex >= 70 ? 'high' : 'medium'
    
    const messages = alertMessages[specialType as keyof typeof alertMessages]
    const message = messages[severity as keyof typeof messages](segment.roadName, segment.direction)

    await prisma.alert.create({
      data: {
        segmentId,
        type: specialType,
        severity,
        message,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 60 * 60000), // 60 دقيقة
        isActive: true,
        alternativeRoute: {
          suggested: true,
          estimatedTime: Math.round((congestionIndex / 100) * 20),
        },
      },
    })
  }
}

// اكتشاف bottlenecks
async function detectBottlenecks(segmentId: string, congestionIndex: number, avgSpeed: number) {
  if (congestionIndex < 60) return

  const segment = await prisma.roadSegment.findUnique({ where: { id: segmentId } })
  if (!segment) return

  const freeFlowSpeed = segment.freeFlowSpeed || 60
  const speedDrop = ((freeFlowSpeed - avgSpeed) / freeFlowSpeed) * 100

  if (speedDrop > 40) {
    // اكتشاف bottleneck
    const existingBottleneck = await prisma.bottleneck.findFirst({
      where: {
        segmentId,
        isResolved: false,
      },
    })

    if (!existingBottleneck) {
      await prisma.bottleneck.create({
        data: {
          segmentId,
          originLat: (segment.startLat + segment.endLat) / 2,
          originLng: (segment.startLng + segment.endLng) / 2,
          severity: congestionIndex >= 85 ? 'critical' : congestionIndex >= 75 ? 'high' : 'medium',
          speedDrop: Math.round(speedDrop * 10) / 10,
          backwardExtent: Math.round((congestionIndex / 100) * segment.length * 10) / 10,
          detectedAt: new Date(),
        },
      })
    }
  }
}

// توليد قرارات مرورية
async function generateTrafficDecisions(segmentId: string, congestionIndex: number) {
  if (congestionIndex < 75) return

  const segment = await prisma.roadSegment.findUnique({ where: { id: segmentId } })
  if (!segment) return

  // محاكاة قرار مروري بسيط
  const decisionTypes = ['diversion', 'signal_adjustment', 'intervention']
  const decisionType = decisionTypes[Math.floor(Math.random() * decisionTypes.length)]
  
  const expectedDelayReduction = Math.round((congestionIndex / 100) * 15 * 10) / 10
  const expectedBenefitScore = Math.round(60 + (congestionIndex / 100) * 30)
  
  // الحصول على مقاطع مجاورة
  const nearbySegments = await prisma.roadSegment.findMany({
    where: {
      city: segment.city,
      id: { not: segmentId },
    },
    take: 3,
  })

  await prisma.trafficDecision.create({
    data: {
      segmentId,
      decisionType,
      expectedDelayReduction,
      expectedBenefitScore,
      affectedSegments: nearbySegments.map(s => s.id),
      details: {
        description: `اقتراح ${decisionType === 'diversion' ? 'تحويل مروري' : decisionType === 'signal_adjustment' ? 'ضبط إشارة' : 'تدخل تشغيلي'} على ${segment.roadName}`,
        implementation: `تنفيذ ${decisionType} لتقليل الازدحام`,
        cost: Math.round(Math.random() * 10000),
        duration: Math.round(Math.random() * 30) + 10,
      },
      status: 'pending',
      recommendedAt: new Date(),
    },
  })
}

// توليد توصيات إشارات
async function generateSignalRecommendations(segmentId: string, congestionIndex: number) {
  const segment = await prisma.roadSegment.findUnique({ where: { id: segmentId } })
  if (!segment || !segment.hasTrafficLight) return

  if (congestionIndex > 70) {
    // محاكاة توصيات إشارات ذكية
    const baseGreenTime = 30
    const congestionFactor = congestionIndex / 100
    const greenTimeSeconds = Math.min(60, Math.max(15, baseGreenTime + congestionFactor * 25))
    const cycleTimeSeconds = Math.round(greenTimeSeconds * 2 + 20)
    
    const priority = congestionIndex >= 85 ? 'emergency' : congestionIndex >= 75 ? 'high' : 'normal'
    
    await prisma.signalRecommendation.create({
      data: {
        segmentId,
        signalId: `signal-${segmentId}`,
        greenTimeSeconds: Math.round(greenTimeSeconds),
        cycleTimeSeconds,
        priority,
        expectedImpact: {
          delayReduction: Math.round((congestionIndex / 100) * 10 * 10) / 10,
          throughputIncrease: Math.round(congestionFactor * 25),
          queueLengthReduction: Math.round(congestionFactor * 35),
        },
        recommendedAt: new Date(),
      },
    })
  }
}

// تحديث مسارات الطوارئ
async function updateEmergencyRoutes() {
  const activeRoutes = await prisma.emergencyRoute.findMany({
    where: { isActive: true },
    take: 10,
  })

  if (activeRoutes.length === 0) return

  for (const route of activeRoutes) {
    const timeSinceUpdate = (Date.now() - route.lastUpdate.getTime()) / 1000
    if (timeSinceUpdate >= route.updateInterval) {
      try {
        // جلب بيانات الازدحام الحالية
        const congestionMap = new Map<string, { index: number; delay: number }>()
        const trafficData = await prisma.trafficData.findMany({
          take: 100,
          orderBy: { timestamp: 'desc' },
          include: { segment: true },
        })

        trafficData.forEach(data => {
          congestionMap.set(data.segmentId, {
            index: data.congestionIndex,
            delay: data.delayMinutes,
          })
        })

        // إعادة حساب المسار
        const { updateEmergencyRoute } = await import('../lib/core/emergency-routing')
        const routeData = {
          id: route.id,
          originLat: route.originLat,
          originLng: route.originLng,
          destinationLat: route.destinationLat,
          destinationLng: route.destinationLng,
          route: route.route as Array<[number, number]>,
          distance: route.distance,
          estimatedTime: route.estimatedTime,
          lastUpdate: route.lastUpdate,
          updateInterval: route.updateInterval,
          isActive: route.isActive,
          congestionAlongRoute: (route.congestionAlongRoute as any) || [],
        }
        
        const updatedRoute = updateEmergencyRoute(routeData, congestionMap)

        await prisma.emergencyRoute.update({
          where: { id: route.id },
          data: {
            route: updatedRoute.route,
            distance: updatedRoute.distance,
            estimatedTime: updatedRoute.estimatedTime,
            lastUpdate: updatedRoute.lastUpdate,
            congestionAlongRoute: updatedRoute.congestionAlongRoute,
          },
        })
      } catch (error) {
        console.error(`   ⚠️  خطأ في تحديث مسار ${route.id}:`, error)
      }
    }
  }
}

// السكريبت الرئيسي
async function generateLiveData() {
  console.log('🚀 بدء توليد البيانات الحية...')
  
  // التأكد من وجود المقاطع
  let segments = await prisma.roadSegment.findMany()
  
  if (segments.length === 0) {
    console.log('📝 إنشاء مقاطع الطرق...')
    for (const seg of roadSegments) {
      const created = await prisma.roadSegment.create({
        data: {
          roadName: seg.name,
          city: seg.city,
          direction: seg.direction,
          startLat: seg.lat,
          startLng: seg.lng,
          endLat: seg.lat + (Math.random() - 0.5) * 0.1,
          endLng: seg.lng + (Math.random() - 0.5) * 0.1,
          length: 2 + Math.random() * 5,
          freeFlowSpeed: seg.freeFlowSpeed,
          hasTrafficLight: Math.random() > 0.7,
        },
      })
      segments.push(created)
    }
  }

  const startTime = Date.now()
  const duration = 30 * 60 * 1000 // 30 دقيقة
  const interval = 60 * 1000 // كل دقيقة
  let minute = 0

  console.log(`⏱️  سيتم توليد البيانات لمدة 30 دقيقة (كل دقيقة)`)

  const generateInterval = setInterval(async () => {
    const elapsed = (Date.now() - startTime) / 1000 / 60
    minute = Math.floor(elapsed)

    if (minute >= 30) {
      clearInterval(generateInterval)
      console.log('✅ انتهى توليد البيانات الحية')
      await prisma.$disconnect()
      process.exit(0)
    }

    console.log(`\n📊 الدقيقة ${minute + 1}/30 - توليد البيانات...`)

    try {
      // توليد بيانات مرورية لكل مقطع
      for (const segment of segments) {
        const trafficData = await generateTrafficData(segment.id, minute)
        if (!trafficData) continue

        // توليد تنبؤات كل دقيقة - كثيفة جداً
        if (minute % 2 === 0 || trafficData.congestionIndex >= 60) {
          await generatePredictions(segment.id)
        }

        // توليد تنبيهات عند ازدحام عالي - كثيفة جداً
        await generateAlerts(segment.id, trafficData.congestionIndex, minute)

        // اكتشاف bottlenecks
        await detectBottlenecks(segment.id, trafficData.congestionIndex, trafficData.avgSpeed)

        // توليد قرارات مرورية كل 10 دقائق
        if (minute % 10 === 0 && trafficData.congestionIndex >= 75) {
          await generateTrafficDecisions(segment.id, trafficData.congestionIndex)
        }

        // توليد توصيات إشارات
        if (segment.hasTrafficLight && trafficData.congestionIndex > 70) {
          await generateSignalRecommendations(segment.id, trafficData.congestionIndex)
        }
      }

      // تحديث مسارات الطوارئ كل دقيقة
      await updateEmergencyRoutes()

      // إحصائيات
      const stats = {
        trafficData: await prisma.trafficData.count(),
        predictions: await prisma.prediction.count(),
        alerts: await prisma.alert.count({ where: { isActive: true } }),
        bottlenecks: await prisma.bottleneck.count({ where: { isResolved: false } }),
        decisions: await prisma.trafficDecision.count({ where: { status: 'pending' } }),
      }

      console.log(`   ✅ تم: ${stats.trafficData} بيانات مرورية | ${stats.predictions} تنبؤات | ${stats.alerts} تنبيهات | ${stats.bottlenecks} bottlenecks | ${stats.decisions} قرارات`)
    } catch (error) {
      console.error(`   ❌ خطأ في الدقيقة ${minute + 1}:`, error)
    }
  }, interval)

  // توليد البيانات الأولى فوراً
  console.log('📊 توليد البيانات الأولية...')
  for (const segment of segments) {
    await generateTrafficData(segment.id, 0)
  }
}

// تشغيل السكريبت
generateLiveData()
  .catch((error) => {
    console.error('❌ خطأ في توليد البيانات:', error)
    process.exit(1)
  })

