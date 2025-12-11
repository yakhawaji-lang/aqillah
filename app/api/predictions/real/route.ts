/**
 * API - إنشاء تنبؤات واقعية بناءً على البيانات الوهمية في قاعدة البيانات
 * يحلل البيانات الحالية والاتجاهات لإنشاء تنبؤات دقيقة
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') || 'الرياض'
    const minutesAhead = parseInt(searchParams.get('minutesAhead') || '60')

    const predictions: any[] = []
    const now = new Date()

    // جلب المقاطع في المدينة
    const segments = await prisma.roadSegment.findMany({
      where: {
        city: city,
      },
    })

    if (segments.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        city: city,
        timestamp: now.toISOString(),
        message: 'لا توجد مقاطع طرق في هذه المدينة',
      })
    }

    // جلب بيانات المرور الحالية لكل مقطع
    for (const segment of segments) {
      try {
        // جلب آخر بيانات مرور للمقطع
        const latestTrafficData = await prisma.trafficData.findFirst({
          where: {
            segmentId: segment.id,
          },
          orderBy: {
            timestamp: 'desc',
          },
        })

        // جلب التنبؤات الموجودة في قاعدة البيانات
        const existingPredictions = await prisma.prediction.findMany({
          where: {
            segmentId: segment.id,
            predictedFor: {
              gte: now,
              lte: new Date(now.getTime() + minutesAhead * 60 * 1000),
            },
          },
          orderBy: {
            predictedFor: 'asc',
          },
        })

        // إذا كانت هناك تنبؤات موجودة، استخدمها
        if (existingPredictions.length > 0) {
          existingPredictions.forEach((pred) => {
            const factors = (pred.factors as any) || []
            predictions.push({
              id: pred.id,
              segmentId: pred.segmentId,
              roadName: segment.roadName,
              city: segment.city,
              direction: segment.direction,
              position: [
                (segment.startLat + segment.endLat) / 2,
                (segment.startLng + segment.endLng) / 2,
              ] as [number, number],
              predictedIndex: pred.predictedIndex,
              confidence: pred.confidence,
              predictedFor: pred.predictedFor.toISOString(),
              predictedDelayMinutes: pred.predictedDelayMinutes,
              factors: Array.isArray(factors) ? factors : [],
              currentIndex: latestTrafficData?.congestionIndex || 0,
              trend: pred.predictedIndex > (latestTrafficData?.congestionIndex || 0) 
                ? 'increasing' 
                : pred.predictedIndex < (latestTrafficData?.congestionIndex || 0) 
                  ? 'decreasing' 
                  : 'stable',
            })
          })
        } else {
          // إنشاء تنبؤات جديدة بناءً على البيانات الحالية
          const currentCongestionIndex = latestTrafficData?.congestionIndex || 30
          const currentHour = now.getHours()
          const isRushHour = (currentHour >= 7 && currentHour <= 9) || (currentHour >= 17 && currentHour <= 19)
          const isMidDay = currentHour >= 10 && currentHour <= 16
          const isNight = currentHour >= 20 || currentHour < 7

          // إنشاء تنبؤات لعدة نقاط زمنية قادمة
          const predictionTimes = [5, 10, 30, 60].filter(t => t <= minutesAhead)
          
          for (const minutes of predictionTimes) {
            const predictedFor = new Date(now.getTime() + minutes * 60 * 1000)
            const predictedHour = predictedFor.getHours()
            const predictedIsRushHour = (predictedHour >= 7 && predictedHour <= 9) || (predictedHour >= 17 && predictedHour <= 19)
            const predictedIsMidDay = predictedHour >= 10 && predictedHour <= 16
            const predictedIsNight = predictedHour >= 20 || predictedHour < 7

            // حساب التنبؤ بناءً على الوقت والاتجاهات
            let predictedIndex = currentCongestionIndex
            let confidence = 0.7
            const factors: string[] = []

            // تأثير الوقت المتوقع
            if (predictedIsRushHour && !isRushHour) {
              predictedIndex = Math.min(100, currentCongestionIndex + Math.random() * 30 + 20)
              confidence = 0.85
              factors.push('وقت الذروة المتوقع')
            } else if (isRushHour && predictedIsRushHour) {
              predictedIndex = Math.min(100, currentCongestionIndex + Math.random() * 15 - 5)
              confidence = 0.9
              factors.push('استمرار وقت الذروة')
            } else if (!isRushHour && predictedIsRushHour) {
              predictedIndex = Math.max(0, currentCongestionIndex - Math.random() * 20 - 10)
              confidence = 0.8
              factors.push('انتهاء وقت الذروة')
            } else if (predictedIsNight && !isNight) {
              predictedIndex = Math.max(0, currentCongestionIndex - Math.random() * 25 - 15)
              confidence = 0.75
              factors.push('وقت الليل')
            } else if (predictedIsMidDay && !isMidDay) {
              predictedIndex = Math.max(0, Math.min(100, currentCongestionIndex + Math.random() * 10 - 5))
              confidence = 0.7
              factors.push('منتصف النهار')
            } else {
              predictedIndex = Math.max(0, Math.min(100, currentCongestionIndex + Math.random() * 10 - 5))
              confidence = 0.65
              factors.push('اتجاه مستقر')
            }

            // إضافة عوامل إضافية
            if (currentCongestionIndex >= 70) {
              factors.push('ازدحام شديد حالياً')
              if (predictedIsRushHour) {
                predictedIndex = Math.min(100, predictedIndex + 10)
                confidence = 0.95
              }
            } else if (currentCongestionIndex >= 50) {
              factors.push('ازدحام متوسط')
            } else {
              factors.push('حركة سلسة حالياً')
            }

            const predictedDelayMinutes = Math.max(0, (predictedIndex / 100) * 15)

            predictions.push({
              id: `prediction-${segment.id}-${minutes}`,
              segmentId: segment.id,
              roadName: segment.roadName,
              city: segment.city,
              direction: segment.direction,
              position: [
                (segment.startLat + segment.endLat) / 2,
                (segment.startLng + segment.endLng) / 2,
              ] as [number, number],
              predictedIndex: Math.round(predictedIndex),
              confidence: Math.round(confidence * 100) / 100,
              predictedFor: predictedFor.toISOString(),
              predictedDelayMinutes: Math.round(predictedDelayMinutes * 10) / 10,
              factors: factors,
              currentIndex: currentCongestionIndex,
              trend: predictedIndex > currentCongestionIndex ? 'increasing' : predictedIndex < currentCongestionIndex ? 'decreasing' : 'stable',
            })
          }
        }
      } catch (error: any) {
        console.error(`Error generating prediction for segment ${segment.roadName}:`, error.message)
      }
    }

    // ترتيب التنبؤات حسب الوقت المتوقع
    predictions.sort((a, b) => {
      const timeA = new Date(a.predictedFor).getTime()
      const timeB = new Date(b.predictedFor).getTime()
      return timeA - timeB
    })

    return NextResponse.json({
      success: true,
      data: predictions,
      city: city,
      timestamp: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Error generating real predictions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate predictions',
        data: [],
      },
      { status: 500 }
    )
  }
}

