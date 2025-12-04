/**
 * API - جلب الطرق ذات الرؤية السيئة حالياً
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'

// عتبة الرؤية السيئة (أقل من 500 متر)
const POOR_VISIBILITY_THRESHOLD = 500 // متر

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    // جلب جميع المقاطع الطرقية
    const segments = await prisma.roadSegment.findMany({
      where: city ? { city } : {},
      take: 100, // حد أقصى 100 مقطع
    })

    const poorVisibilitySegments: Array<{
      segmentId: string
      roadName: string
      city: string
      position: [number, number]
      visibility: number
      condition: string
      alerts: any[]
    }> = []

    // فحص الرؤية لكل مقطع
    for (const segment of segments) {
      try {
        const centerLat = (segment.startLat + segment.endLat) / 2
        const centerLng = (segment.startLng + segment.endLng) / 2

        const weather = await weatherService.getCurrentWeather({
          lat: centerLat,
          lng: centerLng,
        })

        // التحقق من الرؤية السيئة
        if (weather.current.visibility < POOR_VISIBILITY_THRESHOLD) {
          const alerts = weatherService.checkWeatherAlerts(weather.current)
          
          poorVisibilitySegments.push({
            segmentId: segment.id,
            roadName: segment.roadName,
            city: segment.city,
            position: [centerLat, centerLng],
            visibility: weather.current.visibility,
            condition: weather.current.condition,
            alerts: alerts.filter(a => a.type === 'low_visibility'),
          })
        }
      } catch (err) {
        console.error(`Error checking visibility for segment ${segment.id}:`, err)
        // تجاهل الأخطاء والمتابعة
      }
    }

    return NextResponse.json({
      success: true,
      data: poorVisibilitySegments,
      count: poorVisibilitySegments.length,
    })
  } catch (error: any) {
    console.error('Error fetching poor visibility segments:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch visibility data' },
      { status: 500 }
    )
  }
}

