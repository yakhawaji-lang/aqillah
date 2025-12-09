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
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')

    // محاولة الوصول إلى قاعدة البيانات
    let segments
    try {
      segments = await prisma.roadSegment.findMany({
        where: city ? { city } : {},
        take: 100, // حد أقصى 100 مقطع
      })
    } catch (dbError: any) {
      console.warn('Database not available, returning empty data:', dbError.message)
      return NextResponse.json({
        success: true,
        data: [],
        message: 'قاعدة البيانات غير متاحة حالياً'
      })
    }

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
    // إذا كان الخطأ متعلق بقاعدة البيانات، إرجاع بيانات فارغة
    if (error.message?.includes('database') || error.message?.includes('Prisma')) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'قاعدة البيانات غير متاحة حالياً'
      })
    }
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'فشل في جلب بيانات الرؤية',
        data: []
      },
      { status: 500 }
    )
  }
}

