/**
 * Route Predictions API
 */

import { NextRequest, NextResponse } from 'next/server'
import { predictionEngine } from '@/lib/engines/prediction-engine'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'
import { googleMapsService } from '@/lib/services/google-maps'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const originLat = parseFloat(searchParams.get('originLat') || '0')
    const originLng = parseFloat(searchParams.get('originLng') || '0')
    const destinationLat = parseFloat(searchParams.get('destinationLat') || '0')
    const destinationLng = parseFloat(searchParams.get('destinationLng') || '0')
    const minutesAhead = parseInt(searchParams.get('minutesAhead') || '60')

    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      return NextResponse.json(
        { success: false, error: 'Origin and destination coordinates are required' },
        { status: 400 }
      )
    }

    let estimatedTimeMinutes = 30 // افتراضي 30 دقيقة

    try {
      // حساب المسار
      const routeResult = await googleMapsService.calculateRoute({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destinationLat, lng: destinationLng },
      })

      if (routeResult && routeResult.routes && routeResult.routes.length > 0) {
        const route = routeResult.routes[0]
        estimatedTimeMinutes = route.duration / 60 // تحويل من ثواني إلى دقائق
      }
    } catch (routeError: any) {
      console.warn('Failed to calculate route, using default time:', routeError.message)
      // نستمر في التنبؤات حتى لو فشل حساب المسار
    }

    const now = new Date()
    const targetTime = new Date(now.getTime() + minutesAhead * 60 * 1000)
    const targetHour = targetTime.getHours()
    const isRushHour = (targetHour >= 7 && targetHour <= 9) || (targetHour >= 17 && targetHour <= 19)

    // جلب بيانات المرور الحالية للمسار من Google Maps
    let currentTrafficData: any = null
    try {
      const currentRoute = await googleMapsService.calculateRoute({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destinationLat, lng: destinationLng },
        departureTime: now,
      })
      
      if (currentRoute && currentRoute.routes && currentRoute.routes.length > 0) {
        const route = currentRoute.routes[0]
        const durationInTraffic = route.durationInTraffic || route.duration
        const duration = route.duration
        
        // حساب مؤشر الازدحام الحالي
        const delayRatio = duration > 0 ? durationInTraffic / duration : 1
        let currentCongestionIndex = 0
        
        if (delayRatio > 1.5) {
          currentCongestionIndex = Math.min(100, Math.round((delayRatio - 1.5) * 50 + 50))
        } else if (delayRatio > 1.2) {
          currentCongestionIndex = Math.round((delayRatio - 1.2) * 166)
        } else {
          currentCongestionIndex = Math.round((delayRatio - 1) * 25)
        }
        
        currentTrafficData = {
          currentCongestionIndex,
          currentDuration: durationInTraffic,
          baseDuration: duration,
          delaySeconds: Math.max(0, durationInTraffic - duration),
        }
      }
    } catch (error: any) {
      console.warn('Failed to get current traffic data:', error.message)
    }

    // إنشاء تنبؤات للمسار بناءً على البيانات الحالية والأنماط التاريخية
    const predictions = []
    const predictionTimes = [15, 30, 45, 60].filter(t => t <= minutesAhead)

    for (const minutes of predictionTimes) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const predictedHour = predictedFor.getHours()
      const predictedIsRushHour = (predictedHour >= 7 && predictedHour <= 9) || (predictedHour >= 17 && predictedHour <= 19)
      const predictedIsMidDay = predictedHour >= 10 && predictedHour <= 16
      const predictedIsNight = predictedHour >= 20 || predictedHour < 7

      // حساب مؤشر الازدحام المتوقع بناءً على البيانات الحالية والأنماط
      let predictedIndex = currentTrafficData?.currentCongestionIndex || 30
      let confidence = 0.7
      const factors: string[] = []

      // استخدام البيانات الحالية كأساس
      if (currentTrafficData) {
        factors.push('بيانات مرورية حية')
        confidence = 0.8
      }

      // تأثير الوقت المتوقع
      if (predictedIsRushHour) {
        if (currentTrafficData && currentTrafficData.currentCongestionIndex < 50) {
          // إذا كان الازدحام منخفضاً الآن ولكننا نتوقع وقت الذروة
          predictedIndex = Math.min(100, predictedIndex + 30 + Math.random() * 20)
          factors.push('وقت الذروة المتوقع')
          confidence = 0.85
        } else {
          // إذا كان الازدحام عالياً بالفعل
          predictedIndex = Math.min(100, predictedIndex + Math.random() * 15 - 5)
          factors.push('استمرار وقت الذروة')
          confidence = 0.9
        }
      } else if (predictedIsMidDay) {
        predictedIndex = Math.max(0, Math.min(100, predictedIndex + Math.random() * 10 - 5))
        factors.push('منتصف النهار')
        confidence = 0.75
      } else {
        // وقت الليل
        predictedIndex = Math.max(0, predictedIndex - Math.random() * 20 - 10)
        factors.push('وقت الليل')
        confidence = 0.7
      }

      // إضافة عوامل بناءً على مستوى الازدحام الحالي
      if (currentTrafficData) {
        if (currentTrafficData.currentCongestionIndex >= 70) {
          factors.push('ازدحام شديد حالياً')
          if (predictedIsRushHour) {
            predictedIndex = Math.min(100, predictedIndex + 10)
            confidence = 0.95
          }
        } else if (currentTrafficData.currentCongestionIndex >= 50) {
          factors.push('ازدحام متوسط')
        } else {
          factors.push('حركة سلسة حالياً')
        }
      }

      // حساب التأخير المتوقع بناءً على الوقت المتوقع
      const delayRatio = predictedIndex / 100
      const predictedDelayMinutes = estimatedTimeMinutes * delayRatio

      predictions.push({
        minutesAhead: minutes,
        congestionIndex: Math.round(predictedIndex),
        delayMinutes: Math.round(predictedDelayMinutes * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        factors,
        predictedFor: predictedFor.toISOString(),
        currentCongestionIndex: currentTrafficData?.currentCongestionIndex || null,
        trend: currentTrafficData ? 
          (predictedIndex > currentTrafficData.currentCongestionIndex ? 'increasing' : 
           predictedIndex < currentTrafficData.currentCongestionIndex ? 'decreasing' : 'stable') : 
          'unknown',
      })
    }

    // حساب متوسط الازدحام
    const avgCongestion = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.congestionIndex, 0) / predictions.length
      : 0

    return NextResponse.json({
      success: true,
      data: {
        predictions,
        avgCongestion,
        routeId: `route-${Date.now()}`,
      },
    })
  } catch (error: any) {
    console.error('Error generating route predictions:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to generate route predictions',
        data: null
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeId, segments } = body

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: 'Segments are required' },
        { status: 400 }
      )
    }

    const predictions = []

    for (const segment of segments) {
      // Get weather for segment
      const weather = await weatherService.getCurrentWeather({
        lat: segment.lat,
        lng: segment.lng,
      })

      // Get traffic data (placeholder)
      const traffic = {
        congestionIndex: 50,
        avgSpeed: 60,
        density: 30,
      }

      // Make prediction
      const prediction = predictionEngine.predict({
        weather: weather.current,
        traffic,
        vehicle: segment.vehicle,
        location: {
          lat: segment.lat,
          lng: segment.lng,
        },
      })

      predictions.push({
        segment,
        ...prediction,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId,
        predictions,
      },
    })
  } catch (error: any) {
    console.error('Error generating predictions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}

