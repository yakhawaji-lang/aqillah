import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// دالة لإنشاء تنبيهات من البيانات الوهمية في قاعدة البيانات
async function generateRealAlerts(city: string, request: NextRequest) {
  const alerts: any[] = []

  try {
    // 1. تنبيهات الازدحام من بيانات المرور في قاعدة البيانات
    try {
      const trafficData = await prisma.trafficData.findMany({
        where: {
          segment: {
            city: city,
          },
          congestionIndex: {
            gte: 50, // ازدحام متوسط أو أعلى
          },
        },
        include: {
          segment: true,
        },
        orderBy: {
          timestamp: 'desc',
        },
        take: 20,
      })

      // تجميع البيانات حسب المقطع
      const segmentMap = new Map<string, any>()
      trafficData.forEach((data) => {
        if (!segmentMap.has(data.segmentId)) {
          segmentMap.set(data.segmentId, {
            segment: data.segment,
            congestionIndex: data.congestionIndex,
            delayMinutes: data.delayMinutes,
            timestamp: data.timestamp,
          })
        } else {
          const existing = segmentMap.get(data.segmentId)!
          if (data.timestamp > existing.timestamp) {
            segmentMap.set(data.segmentId, {
              segment: data.segment,
              congestionIndex: data.congestionIndex,
              delayMinutes: data.delayMinutes,
              timestamp: data.timestamp,
            })
          }
        }
      })

      segmentMap.forEach((data, segmentId) => {
        const congestionIndex = data.congestionIndex || 0
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
        if (congestionIndex >= 80) severity = 'critical'
        else if (congestionIndex >= 70) severity = 'high'
        else if (congestionIndex >= 60) severity = 'medium'
        else severity = 'low'

        alerts.push({
          id: `traffic-${city}-${segmentId}-${Date.now()}`,
          segmentId: segmentId,
          roadName: data.segment.roadName,
          city: city,
          direction: data.segment.direction,
          type: 'congestion',
          severity: severity,
          message: `ازدحام مروري ${congestionIndex}% على ${data.segment.roadName}. تأخير متوقع: ${Math.round(data.delayMinutes || 0)} دقيقة`,
          alternativeRoute: null,
          createdAt: data.timestamp.toISOString(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          isActive: true,
          source: 'database',
          congestionIndex: congestionIndex,
          delayMinutes: data.delayMinutes,
        })
      })
    } catch (error) {
      console.warn('Error fetching traffic alerts from database:', error)
    }

    // 2. تنبيهات الطقس من قاعدة البيانات
    try {
      const cityCoordinates: Record<string, { lat: number; lng: number }> = {
        'الرياض': { lat: 24.7136, lng: 46.6753 },
        'جدة': { lat: 21.4858, lng: 39.1925 },
        'الدمام': { lat: 26.4207, lng: 50.0888 },
        'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
        'الخبر': { lat: 26.2794, lng: 50.2080 },
        'أبها': { lat: 18.2164, lng: 42.5042 },
        'خميس مشيط': { lat: 18.3000, lng: 42.7333 },
      }
      const coords = cityCoordinates[city] || cityCoordinates['الرياض']
      
      const weatherData = await prisma.weatherData.findFirst({
        where: {
          lat: {
            gte: coords.lat - 0.1,
            lte: coords.lat + 0.1,
          },
          lng: {
            gte: coords.lng - 0.1,
            lte: coords.lng + 0.1,
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      })

      if (weatherData) {
        const condition = weatherData.condition || 'clear'
        const visibility = weatherData.visibility || 10000
        const precipitation = weatherData.precipitation || 0
        
        // تحديد مستوى الخطورة بناءً على الطقس
        let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
        let message = ''
        
        if (condition === 'fog' && visibility < 500) {
          severity = 'critical'
          message = `ضباب كثيف ورؤية منخفضة (${Math.round(visibility)} متر) في ${city}. يرجى توخي الحذر الشديد`
        } else if (condition === 'rain' && precipitation > 3) {
          severity = 'high'
          message = `أمطار غزيرة (${Math.round(precipitation * 10) / 10} مم/ساعة) في ${city}. يرجى توخي الحذر أثناء القيادة`
        } else if (condition === 'rain' && precipitation > 1) {
          severity = 'medium'
          message = `أمطار متوسطة في ${city}. يرجى توخي الحذر`
        } else if (condition === 'fog' && visibility < 1000) {
          severity = 'medium'
          message = `ضباب ورؤية منخفضة (${Math.round(visibility)} متر) في ${city}. يرجى توخي الحذر`
        }

        if (severity !== 'low') {
          alerts.push({
            id: `weather-${city}-${Date.now()}`,
            segmentId: null,
            roadName: `منطقة ${city}`,
            city: city,
            direction: 'جميع الاتجاهات',
            type: 'weather',
            severity: severity,
            message: message,
            alternativeRoute: null,
            createdAt: weatherData.timestamp.toISOString(),
            expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            source: 'database',
            weatherCondition: condition,
            visibility: visibility,
            precipitation: precipitation,
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching weather alerts from database:', error)
    }

    // 3. تنبيهات نقاط الاختناق من قاعدة البيانات
    try {
      const bottlenecks = await prisma.bottleneck.findMany({
        where: {
          segment: {
            city: city,
          },
          isResolved: false,
        },
        include: {
          segment: true,
        },
        orderBy: {
          detectedAt: 'desc',
        },
        take: 10,
      })

      bottlenecks.forEach((bottleneck) => {
        alerts.push({
          id: `bottleneck-${city}-${bottleneck.id}`,
          segmentId: bottleneck.segmentId,
          roadName: bottleneck.segment.roadName,
          city: city,
          direction: bottleneck.segment.direction,
          type: 'congestion',
          severity: bottleneck.severity === 'critical' ? 'critical' : bottleneck.severity === 'high' ? 'high' : 'medium',
          message: `نقطة اختناق مروري على ${bottleneck.segment.roadName}. انخفاض السرعة ${Math.round(bottleneck.speedDrop)}%، امتداد ${Math.round(bottleneck.backwardExtent * 10) / 10} كم. يرجى تجنب هذا الطريق أو استخدام مسار بديل`,
          alternativeRoute: null,
          createdAt: bottleneck.detectedAt.toISOString(),
          expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          isActive: true,
          source: 'database',
          speedDrop: bottleneck.speedDrop,
          backwardExtent: bottleneck.backwardExtent,
        })
      })
    } catch (error) {
      console.warn('Error fetching bottlenecks alerts from database:', error)
    }

  } catch (error) {
    console.error('Error generating alerts from database:', error)
  }

  return alerts
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // إنشاء تنبيهات من البيانات الوهمية في قاعدة البيانات
    const realAlerts = await generateRealAlerts(city || 'الرياض', request)

    // محاولة الوصول إلى قاعدة البيانات للحصول على تنبيهات إضافية
    let dbAlerts: any[] = []
    try {
      const alerts = await prisma.alert.findMany({
        where: {
          isActive: activeOnly ? true : undefined,
          expiresAt: {
            gte: new Date(),
          },
          ...(city && {
            segment: {
              city: city,
            },
          }),
        },
        include: {
          segment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      })

      dbAlerts = alerts.map((alert) => ({
        id: alert.id,
        segmentId: alert.segmentId,
        roadName: alert.segment.roadName,
        city: alert.segment.city,
        direction: alert.segment.direction,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        alternativeRoute: alert.alternativeRoute,
        createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
        expiresAt: alert.expiresAt instanceof Date ? alert.expiresAt.toISOString() : alert.expiresAt,
        isActive: alert.isActive,
        source: 'database',
      }))
    } catch (dbError: any) {
      console.warn('Database not available, using API alerts only:', dbError.message)
    }

    // دمج التنبيهات من قاعدة البيانات (جميعها من قاعدة البيانات)
    const allAlerts = [...realAlerts, ...dbAlerts]
    
    // إزالة التكرارات بناءً على segmentId و type
    const uniqueAlerts = allAlerts.filter((alert, index, self) =>
      index === self.findIndex((a) => 
        a.segmentId === alert.segmentId && 
        a.type === alert.type &&
        Math.abs(new Date(a.createdAt).getTime() - new Date(alert.createdAt).getTime()) < 60000 // نفس الدقيقة
      )
    )

    // تصفية حسب المدينة إذا كانت محددة
    const filteredAlerts = city 
      ? uniqueAlerts.filter(alert => alert.city === city)
      : uniqueAlerts

    // ترتيب حسب التاريخ (الأحدث أولاً)
    filteredAlerts.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateB - dateA
    })

    return NextResponse.json({ 
      success: true,
      data: filteredAlerts,
      meta: {
        total: filteredAlerts.length,
        fromDatabase: filteredAlerts.length,
      }
    })
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'فشل في جلب التنبيهات',
        data: []
      },
      { status: 500 }
    )
  }
}

