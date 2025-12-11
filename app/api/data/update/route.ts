/**
 * API endpoint لتحديث البيانات بشكل دوري
 * يحاكي تحديث البيانات من APIs الخارجية
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// توليد رقم عشوائي
function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomBetween(min, max))
}

// أنماط الازدحام حسب الوقت
function getCongestionPattern(hour: number) {
  if (hour >= 6 && hour < 10) return { min: 40, max: 85, peak: true }
  if (hour >= 10 && hour < 14) return { min: 20, max: 50, peak: false }
  if (hour >= 14 && hour < 17) return { min: 30, max: 70, peak: false }
  if (hour >= 17 && hour < 21) return { min: 50, max: 95, peak: true }
  return { min: 10, max: 30, peak: false }
}

// تحديث بيانات الازدحام
async function updateTrafficData() {
  const segments = await prisma.roadSegment.findMany({
    take: 50, // تحديث 50 مقطع عشوائي
  })

  const now = new Date()
  const hour = now.getHours()
  const pattern = getCongestionPattern(hour)

  const updates = []

  for (const segment of segments) {
    const congestionIndex = Math.min(100, Math.max(0, 
      randomInt(pattern.min, pattern.max) + (pattern.peak ? randomInt(0, 15) : 0)
    ))
    const avgSpeed = segment.freeFlowSpeed * (1 - congestionIndex / 100)
    const density = congestionIndex * 2 + randomInt(10, 50)
    const deviceCount = Math.max(30, Math.round(density * segment.length))
    const delayMinutes = (congestionIndex / 100) * (segment.length / avgSpeed) * 60

    const trafficData = await prisma.trafficData.create({
      data: {
        segmentId: segment.id,
        timestamp: now,
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

    updates.push(trafficData)
  }

  return updates
}

// تحديث التنبؤات
async function updatePredictions() {
  const segments = await prisma.roadSegment.findMany({
    take: 30,
  })

  const now = new Date()
  const intervals = [5, 10, 30, 60]
  const predictions = []

  for (const segment of segments) {
    for (const minutes of intervals) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const futureHour = predictedFor.getHours()
      const pattern = getCongestionPattern(futureHour)
      
      const predictedIndex = Math.min(100, Math.max(0,
        randomInt(pattern.min, pattern.max) + (pattern.peak ? randomInt(0, 10) : 0)
      ))
      const predictedDelay = (predictedIndex / 100) * (segment.length / segment.freeFlowSpeed) * 60
      const confidence = Math.max(0.5, 1 - (minutes / 120))

      // حذف التنبؤات القديمة
      await prisma.prediction.deleteMany({
        where: {
          segmentId: segment.id,
          predictedFor: { lt: now },
        },
      })

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

  return predictions
}

// تحديث التنبيهات
async function updateAlerts() {
  // حذف التنبيهات المنتهية
  await prisma.alert.updateMany({
    where: {
      expiresAt: { lt: new Date() },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })

  // إنشاء تنبيهات جديدة عشوائياً
  const segments = await prisma.roadSegment.findMany({
    where: {
      trafficData: {
        some: {
          congestionIndex: { gte: 70 },
          timestamp: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
      },
    },
    take: 5,
  })

  const alertTypes = [
    { type: 'congestion', severity: 'high' },
    { type: 'accident', severity: 'critical' },
    { type: 'event', severity: 'medium' },
  ]

  const alerts = []

  for (const segment of segments) {
    if (Math.random() > 0.7) { // 30% احتمال إنشاء تنبيه
      const alertType = alertTypes[randomInt(0, alertTypes.length)]
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + randomInt(1, 4))

      const alert = await prisma.alert.create({
        data: {
          segmentId: segment.id,
          type: alertType.type,
          severity: alertType.severity,
          message: `تنبيه ${alertType.type} على ${segment.roadName}`,
          alternativeRoute: {
            distance: segment.length * 1.2,
            duration: segment.length * 1.3,
          },
          expiresAt,
          isActive: true,
        },
      })

      alerts.push(alert)
    }
  }

  return alerts
}

// تحديث بيانات الطقس
async function updateWeatherData() {
  const cities = [
    { name: 'الرياض', coords: [24.7136, 46.6753] },
    { name: 'جدة', coords: [21.4858, 39.1925] },
    { name: 'الدمام', coords: [26.4207, 50.0888] },
  ]

  const weatherRecords = []
  const now = new Date()

  for (const city of cities) {
    // حذف البيانات القديمة (أكثر من ساعة)
    await prisma.weatherData.deleteMany({
      where: {
        lat: city.coords[0],
        lng: city.coords[1],
        timestamp: { lt: new Date(now.getTime() - 60 * 60 * 1000) },
      },
    })

    const temp = randomInt(20, 35)
    const humidity = randomInt(30, 70)
    const condition = Math.random() > 0.8 ? 'rain' : 'clear'

    const weatherData = await prisma.weatherData.create({
      data: {
        lat: city.coords[0],
        lng: city.coords[1],
        timestamp: now,
        temperature: temp,
        humidity,
        windSpeed: randomInt(5, 25),
        windDirection: randomInt(0, 360),
        visibility: randomInt(5000, 10000),
        pressure: randomInt(1000, 1020),
        precipitation: condition === 'rain' ? randomBetween(2, 15) : 0,
        rainRate: condition === 'rain' ? randomBetween(0.5, 5) : 0,
        snowRate: 0,
        condition,
        cloudCover: condition === 'rain' ? randomInt(70, 100) : randomInt(0, 50),
        alerts: [],
        forecast: {
          hourly: Array.from({ length: 24 }, (_, i) => ({
            time: new Date(now.getTime() + i * 60 * 60 * 1000),
            temp: temp + randomInt(-3, 3),
            condition,
            precipitation: condition === 'rain' ? randomBetween(0, 10) : 0,
          })),
        },
      },
    })

    weatherRecords.push(weatherData)
  }

  return weatherRecords
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updateType = body.type || 'all' // all, traffic, predictions, alerts, weather

    const results: any = {
      timestamp: new Date().toISOString(),
      updates: {},
    }

    if (updateType === 'all' || updateType === 'traffic') {
      const trafficUpdates = await updateTrafficData()
      results.updates.traffic = {
        count: trafficUpdates.length,
        segments: trafficUpdates.length,
      }
    }

    if (updateType === 'all' || updateType === 'predictions') {
      const predictionUpdates = await updatePredictions()
      results.updates.predictions = {
        count: predictionUpdates.length,
        segments: predictionUpdates.length / 4, // 4 تنبؤات لكل مقطع
      }
    }

    if (updateType === 'all' || updateType === 'alerts') {
      const alertUpdates = await updateAlerts()
      results.updates.alerts = {
        count: alertUpdates.length,
        active: await prisma.alert.count({ where: { isActive: true } }),
      }
    }

    if (updateType === 'all' || updateType === 'weather') {
      const weatherUpdates = await updateWeatherData()
      results.updates.weather = {
        count: weatherUpdates.length,
        cities: weatherUpdates.length,
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    })
  } catch (error: any) {
    console.error('Error updating data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update data',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // إرجاع معلومات عن آخر تحديث
    const lastTrafficData = await prisma.trafficData.findFirst({
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    })

    const activeAlerts = await prisma.alert.count({
      where: { isActive: true },
    })

    const recentPredictions = await prisma.prediction.count({
      where: {
        predictedFor: { gte: new Date() },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        lastUpdate: lastTrafficData?.timestamp || null,
        activeAlerts,
        recentPredictions,
        status: 'ready',
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to get update status',
      },
      { status: 500 }
    )
  }
}

