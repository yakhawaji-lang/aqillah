import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// دالة لإنشاء تنبيهات حقيقية من APIs
async function generateRealAlerts(city: string, request: NextRequest) {
  const alerts: any[] = []
  // الحصول على base URL من الطلب الحالي
  const protocol = request.headers.get('x-forwarded-proto') || 'https'
  const host = request.headers.get('host') || 'aqillah.vercel.app'
  const baseUrl = `${protocol}://${host}`

  try {
    // 1. تنبيهات الازدحام من بيانات المرور
    try {
      const trafficRes = await fetch(`${baseUrl}/api/traffic/scan?city=${encodeURIComponent(city)}&minCongestion=50`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Aqillah-Alerts-Service',
        },
      })
      if (trafficRes.ok) {
        const trafficData = await trafficRes.json()
        if (trafficData.success && trafficData.data && Array.isArray(trafficData.data)) {
          trafficData.data.forEach((item: any, index: number) => {
            const congestionIndex = item.congestionIndex || 0
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
            if (congestionIndex >= 80) severity = 'critical'
            else if (congestionIndex >= 70) severity = 'high'
            else if (congestionIndex >= 60) severity = 'medium'
            else severity = 'low'

            alerts.push({
              id: `traffic-${city}-${index}-${Date.now()}`,
              segmentId: null,
              roadName: item.roadName || item.name || 'طريق غير محدد',
              city: city,
              direction: item.direction || 'غير محدد',
              type: 'congestion',
              severity: severity,
              message: `ازدحام مروري ${congestionIndex}% على ${item.roadName || item.name || 'الطريق'}. تأخير متوقع: ${item.delayMinutes || 0} دقيقة`,
              alternativeRoute: item.alternativeRoute || null,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // ينتهي بعد ساعة
              isActive: true,
              source: 'traffic-api',
              location: item.location || { lat: item.lat, lng: item.lng },
              congestionIndex: congestionIndex,
              delayMinutes: item.delayMinutes || 0,
            })
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching traffic alerts:', error)
    }

    // 2. تنبيهات الطقس
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
      
      const weatherRes = await fetch(`${baseUrl}/api/weather/impact?lat=${coords.lat}&lng=${coords.lng}`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (weatherRes.ok) {
        const weatherData = await weatherRes.json()
        if (weatherData.success && weatherData.data) {
          const impact = weatherData.data
          if (impact.severity && impact.severity !== 'none') {
            let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
            if (impact.severity === 'critical') severity = 'critical'
            else if (impact.severity === 'high') severity = 'high'
            else if (impact.severity === 'medium') severity = 'medium'
            else severity = 'low'

            alerts.push({
              id: `weather-${city}-${Date.now()}`,
              segmentId: null,
              roadName: `منطقة ${city}`,
              city: city,
              direction: 'جميع الاتجاهات',
              type: 'weather',
              severity: severity,
              message: impact.message || `ظروف طقس ${impact.severity === 'critical' ? 'حرجة' : impact.severity === 'high' ? 'صعبة' : 'متوسطة'} في ${city}. ${impact.advice || 'يرجى توخي الحذر أثناء القيادة'}`,
              alternativeRoute: null,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // ينتهي بعد 3 ساعات
              isActive: true,
              source: 'weather-api',
              weatherCondition: impact.condition,
              impactLevel: impact.severity,
            })
          }
        }
      }
    } catch (error) {
      console.warn('Error fetching weather alerts:', error)
    }

    // 3. تنبيهات الرؤية المنخفضة
    try {
      const visibilityRes = await fetch(`${baseUrl}/api/visibility/current?city=${encodeURIComponent(city)}`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (visibilityRes.ok) {
        const visibilityData = await visibilityRes.json()
        if (visibilityData.success && visibilityData.data && Array.isArray(visibilityData.data)) {
          visibilityData.data.forEach((item: any, index: number) => {
            if (item.visibility && item.visibility < 1000) { // رؤية أقل من 1 كم
              let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
              if (item.visibility < 200) severity = 'critical'
              else if (item.visibility < 500) severity = 'high'
              else severity = 'medium'

              alerts.push({
                id: `visibility-${city}-${index}-${Date.now()}`,
                segmentId: null,
                roadName: item.roadName || item.segmentName || 'طريق غير محدد',
                city: city,
                direction: item.direction || 'غير محدد',
                type: 'weather',
                severity: severity,
                message: `رؤية منخفضة ${item.visibility} متر على ${item.roadName || item.segmentName || 'الطريق'}. يرجى توخي الحذر الشديد`,
                alternativeRoute: null,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // ينتهي بعد ساعتين
                isActive: true,
                source: 'visibility-api',
                visibility: item.visibility,
              })
            }
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching visibility alerts:', error)
    }

    // 4. تنبيهات نقاط الاختناق
    try {
      const bottlenecksRes = await fetch(`${baseUrl}/api/bottlenecks?city=${encodeURIComponent(city)}`, {
        headers: {
          'Accept': 'application/json',
        },
      })
      if (bottlenecksRes.ok) {
        const bottlenecksData = await bottlenecksRes.json()
        if (bottlenecksData.success && bottlenecksData.data && Array.isArray(bottlenecksData.data)) {
          bottlenecksData.data.forEach((item: any, index: number) => {
            alerts.push({
              id: `bottleneck-${city}-${index}-${Date.now()}`,
              segmentId: item.segmentId || null,
              roadName: item.roadName || item.name || 'طريق غير محدد',
              city: city,
              direction: item.direction || 'غير محدد',
              type: 'congestion',
              severity: 'high',
              message: `نقطة اختناق مروري على ${item.roadName || item.name || 'الطريق'}. ${item.description || 'يرجى تجنب هذا الطريق أو استخدام مسار بديل'}`,
              alternativeRoute: item.alternativeRoute || null,
              createdAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // ينتهي بعد 4 ساعات
              isActive: true,
              source: 'bottlenecks-api',
            })
          })
        }
      }
    } catch (error) {
      console.warn('Error fetching bottlenecks alerts:', error)
    }

  } catch (error) {
    console.error('Error generating real alerts:', error)
  }

  return alerts
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // إنشاء تنبيهات حقيقية من APIs
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

    // دمج التنبيهات من APIs مع التنبيهات من قاعدة البيانات
    const allAlerts = [...realAlerts, ...dbAlerts]

    // تصفية حسب المدينة إذا كانت محددة
    const filteredAlerts = city 
      ? allAlerts.filter(alert => alert.city === city)
      : allAlerts

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
        fromApi: realAlerts.length,
        fromDatabase: dbAlerts.length,
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

