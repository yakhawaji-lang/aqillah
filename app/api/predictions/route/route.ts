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
        { error: 'Origin and destination coordinates are required' },
        { status: 400 }
      )
    }

    // حساب المسار
    const routeResult = await googleMapsService.calculateRoute({
      origin: { lat: originLat, lng: originLng },
      destination: { lat: destinationLat, lng: destinationLng },
    })

    if (!routeResult || !routeResult.routes || routeResult.routes.length === 0) {
      return NextResponse.json(
        { error: 'Failed to calculate route' },
        { status: 500 }
      )
    }

    const route = routeResult.routes[0]
    const estimatedTimeMinutes = route.duration / 60 // تحويل من ثواني إلى دقائق

    const now = new Date()
    const targetTime = new Date(now.getTime() + minutesAhead * 60 * 1000)
    const targetHour = targetTime.getHours()
    const isRushHour = (targetHour >= 7 && targetHour <= 9) || (targetHour >= 17 && targetHour <= 19)

    // إنشاء تنبؤات للمسار
    const predictions = []
    const predictionTimes = [15, 30, 45, 60].filter(t => t <= minutesAhead)

    for (const minutes of predictionTimes) {
      const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
      const predictedHour = predictedFor.getHours()
      const predictedIsRushHour = (predictedHour >= 7 && predictedHour <= 9) || (predictedHour >= 17 && predictedHour <= 19)

      // حساب مؤشر الازدحام المتوقع بناءً على الوقت
      let predictedIndex = 30 // افتراضي
      let confidence = 0.7
      const factors: string[] = []

      if (predictedIsRushHour) {
        predictedIndex = 65 + Math.random() * 20 // 65-85% في وقت الذروة
        confidence = 0.85
        factors.push('وقت الذروة المتوقع')
      } else if (predictedHour >= 10 && predictedHour <= 16) {
        predictedIndex = 40 + Math.random() * 15 // 40-55% في منتصف النهار
        confidence = 0.75
        factors.push('منتصف النهار')
      } else {
        predictedIndex = 20 + Math.random() * 15 // 20-35% في الليل
        confidence = 0.7
        factors.push('وقت الليل')
      }

      // حساب التأخير المتوقع
      const delayRatio = predictedIndex / 100
      const predictedDelayMinutes = estimatedTimeMinutes * delayRatio

      predictions.push({
        minutesAhead: minutes,
        congestionIndex: Math.round(predictedIndex),
        delayMinutes: Math.round(predictedDelayMinutes * 10) / 10,
        confidence: Math.round(confidence * 100) / 100,
        factors,
        predictedFor: predictedFor.toISOString(),
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
      { error: error.message || 'Failed to generate route predictions' },
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

