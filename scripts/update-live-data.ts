/**
 * سكريبت تحديث البيانات الحية بشكل مستمر
 * يحدث البيانات كل دقيقة لمحاكاة النظام الحقيقي
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// تحديث بيانات حركة المرور
async function updateTrafficData() {
  const segments = await prisma.roadSegment.findMany()
  const now = new Date()
  const hour = now.getHours()
  const isWeekend = now.getDay() === 5 || now.getDay() === 6
  
  for (const segment of segments) {
    const congestionIndex = Math.round(getCongestionLevel(hour, isWeekend))
    const avgSpeed = calculateSpeed(congestionIndex, segment.freeFlowSpeed)
    const delayMinutes = calculateDelay(congestionIndex, segment.length, segment.freeFlowSpeed)
    const deviceCount = Math.floor(30 + congestionIndex * 2 + Math.random() * 50)
    const density = deviceCount / segment.length
    
    await prisma.trafficData.create({
      data: {
        segmentId: segment.id,
        timestamp: now,
        deviceCount,
        avgSpeed: Math.round(avgSpeed * 10) / 10,
        density: Math.round(density * 10) / 10,
        congestionIndex,
        delayMinutes: Math.round(delayMinutes * 10) / 10,
        movementDirection: Math.random() * 360,
        kAnonymity: Math.max(30, deviceCount),
        isAnonymized: true,
      },
    })
  }
  
  console.log(`✅ تم تحديث بيانات حركة المرور لـ ${segments.length} مقطع`)
}

// تحديث التنبؤات
async function updatePredictions() {
  const segments = await prisma.roadSegment.findMany()
  const now = new Date()
  const predictionTimes = [5, 10, 30, 60]
  
  // حذف التنبؤات القديمة
  await prisma.prediction.deleteMany({
    where: {
      predictedFor: {
        lt: now,
      },
    },
  })
  
  for (const segment of segments) {
    for (const minutes of predictionTimes) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const hour = predictedFor.getHours()
      const isWeekend = predictedFor.getDay() === 5 || predictedFor.getDay() === 6
      
      const baseCongestion = getCongestionLevel(hour, isWeekend)
      const predictedIndex = Math.round(baseCongestion + (Math.random() - 0.5) * 10)
      const predictedDelay = predictedIndex * 0.1
      const confidence = Math.max(0.7, 1 - (minutes / 120))
      
      await prisma.prediction.create({
        data: {
          segmentId: segment.id,
          predictedAt: now,
          predictedFor,
          predictedIndex: Math.max(0, Math.min(100, predictedIndex)),
          predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
          confidence: Math.round(confidence * 100) / 100,
          factors: {
            timeOfDay: hour,
            isWeekend,
            historicalAverage: baseCongestion,
            weatherImpact: Math.random() * 10 - 5,
            eventImpact: Math.random() * 5,
          },
          modelType: minutes <= 10 ? 'temporal' : 'ml',
          seasonalityFactor: Math.round((1 + Math.sin((hour / 24) * Math.PI * 2) * 0.2) * 100) / 100,
        },
      })
    }
  }
  
  console.log(`✅ تم تحديث التنبؤات لـ ${segments.length} مقطع`)
}

// تحديث التنبيهات
async function updateAlerts() {
  const now = new Date()
  
  // حذف التنبيهات المنتهية
  await prisma.alert.updateMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
    data: {
      isActive: false,
    },
  })
  
  // إضافة تنبيهات جديدة عشوائياً (5% احتمال)
  const segments = await prisma.roadSegment.findMany()
  
  for (const segment of segments) {
    if (Math.random() < 0.05) {
      const alertTypes = [
        { type: 'congestion', severity: 'high' },
        { type: 'accident', severity: 'critical' },
        { type: 'event', severity: 'medium' },
        { type: 'weather', severity: 'medium' },
      ]
      
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const expiresAt = new Date(now.getTime() + (2 + Math.random() * 4) * 60 * 60 * 1000)
      
      await prisma.alert.create({
        data: {
          segmentId: segment.id,
          type: alertType.type,
          severity: alertType.severity,
          message: `تنبيه ${alertType.type} على ${segment.roadName}`,
          createdAt: now,
          expiresAt,
          isActive: true,
        },
      })
    }
  }
  
  console.log('✅ تم تحديث التنبيهات')
}

// دوال مساعدة
function getCongestionLevel(hour: number, isWeekend: boolean): number {
  if (isWeekend) {
    if ([7, 8, 9, 17, 18, 19, 20].includes(hour)) return 40 + Math.random() * 20
    return 20 + Math.random() * 20
  }
  
  if ([7, 8, 9, 17, 18, 19, 20].includes(hour)) {
    return 60 + Math.random() * 30
  }
  if (hour >= 10 && hour <= 16) {
    return 30 + Math.random() * 20
  }
  return 20 + Math.random() * 15
}

function calculateSpeed(congestionIndex: number, freeFlowSpeed: number): number {
  const speedReduction = (congestionIndex / 100) * freeFlowSpeed * 0.7
  return Math.max(10, freeFlowSpeed - speedReduction)
}

function calculateDelay(congestionIndex: number, length: number, freeFlowSpeed: number): number {
  const normalTime = (length / freeFlowSpeed) * 60
  const delayFactor = congestionIndex / 100
  return normalTime * delayFactor
}

// الدالة الرئيسية
async function main() {
  console.log('🔄 بدء تحديث البيانات الحية...')
  
  try {
    await updateTrafficData()
    await updatePredictions()
    await updateAlerts()
    
    console.log('✅ تم تحديث جميع البيانات بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error)
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

