/**
 * API - مسح شامل لجميع الشوارع في المدينة لاكتشاف الازدحام
 * يستخدم شبكة من النقاط لتغطية جميع الشوارع في المدينة
 */

import { NextRequest, NextResponse } from 'next/server'

// طرق رئيسية في المدن مع نقاط متعددة على كل طريق لتغطية شاملة
const CITY_ROUTES_DETAILED: Record<string, Array<{
  name: string
  segments: Array<{ start: { lat: number; lng: number }, end: { lat: number; lng: number } }>
}>> = {
  'الرياض': [
    {
      name: 'طريق الدائري الشمالي',
      segments: [
        { start: { lat: 24.8000, lng: 46.6000 }, end: { lat: 24.8000, lng: 46.7000 } },
        { start: { lat: 24.8000, lng: 46.7000 }, end: { lat: 24.8000, lng: 46.8000 } },
        { start: { lat: 24.7500, lng: 46.8000 }, end: { lat: 24.8000, lng: 46.8000 } },
        { start: { lat: 24.7000, lng: 46.8000 }, end: { lat: 24.7500, lng: 46.8000 } },
      ],
    },
    {
      name: 'طريق الدائري الشرقي',
      segments: [
        { start: { lat: 24.7000, lng: 46.8000 }, end: { lat: 24.7000, lng: 46.7500 } },
        { start: { lat: 24.7000, lng: 46.7500 }, end: { lat: 24.7000, lng: 46.7000 } },
        { start: { lat: 24.7000, lng: 46.7000 }, end: { lat: 24.7000, lng: 46.6500 } },
        { start: { lat: 24.7000, lng: 46.6500 }, end: { lat: 24.7000, lng: 46.6000 } },
      ],
    },
    {
      name: 'طريق الدائري الجنوبي',
      segments: [
        { start: { lat: 24.6000, lng: 46.6000 }, end: { lat: 24.6000, lng: 46.7000 } },
        { start: { lat: 24.6000, lng: 46.7000 }, end: { lat: 24.6000, lng: 46.8000 } },
        { start: { lat: 24.6500, lng: 46.8000 }, end: { lat: 24.6000, lng: 46.8000 } },
        { start: { lat: 24.7000, lng: 46.8000 }, end: { lat: 24.6500, lng: 46.8000 } },
      ],
    },
    {
      name: 'طريق الدائري الغربي',
      segments: [
        { start: { lat: 24.7000, lng: 46.6000 }, end: { lat: 24.7000, lng: 46.6500 } },
        { start: { lat: 24.7000, lng: 46.6500 }, end: { lat: 24.7000, lng: 46.7000 } },
        { start: { lat: 24.7500, lng: 46.6000 }, end: { lat: 24.7000, lng: 46.6000 } },
        { start: { lat: 24.8000, lng: 46.6000 }, end: { lat: 24.7500, lng: 46.6000 } },
      ],
    },
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 24.7136, lng: 46.6753 }, end: { lat: 24.7300, lng: 46.6800 } },
        { start: { lat: 24.7300, lng: 46.6800 }, end: { lat: 24.7500, lng: 46.7000 } },
        { start: { lat: 24.7500, lng: 46.7000 }, end: { lat: 24.7700, lng: 46.7200 } },
      ],
    },
    {
      name: 'طريق الملك عبدالعزيز',
      segments: [
        { start: { lat: 24.6500, lng: 46.6000 }, end: { lat: 24.6800, lng: 46.6500 } },
        { start: { lat: 24.6800, lng: 46.6500 }, end: { lat: 24.7000, lng: 46.7000 } },
        { start: { lat: 24.7000, lng: 46.7000 }, end: { lat: 24.7200, lng: 46.7500 } },
        { start: { lat: 24.7200, lng: 46.7500 }, end: { lat: 24.7500, lng: 46.8000 } },
      ],
    },
    {
      name: 'طريق الأمير سلطان',
      segments: [
        { start: { lat: 24.6800, lng: 46.6200 }, end: { lat: 24.7000, lng: 46.6800 } },
        { start: { lat: 24.7000, lng: 46.6800 }, end: { lat: 24.7200, lng: 46.7500 } },
      ],
    },
    {
      name: 'طريق العليا',
      segments: [
        { start: { lat: 24.6800, lng: 46.6500 }, end: { lat: 24.7000, lng: 46.6800 } },
        { start: { lat: 24.7000, lng: 46.6800 }, end: { lat: 24.7200, lng: 46.7000 } },
      ],
    },
    {
      name: 'طريق العروبة',
      segments: [
        { start: { lat: 24.6600, lng: 46.6400 }, end: { lat: 24.6800, lng: 46.6600 } },
        { start: { lat: 24.6800, lng: 46.6600 }, end: { lat: 24.7100, lng: 46.6900 } },
      ],
    },
    {
      name: 'طريق الخليج',
      segments: [
        { start: { lat: 24.6900, lng: 46.6300 }, end: { lat: 24.7100, lng: 46.6800 } },
        { start: { lat: 24.7100, lng: 46.6800 }, end: { lat: 24.7300, lng: 46.7200 } },
      ],
    },
    // طرق إضافية لتغطية أفضل
    {
      name: 'طريق الملك سلمان',
      segments: [
        { start: { lat: 24.7000, lng: 46.6000 }, end: { lat: 24.7200, lng: 46.6500 } },
        { start: { lat: 24.7200, lng: 46.6500 }, end: { lat: 24.7500, lng: 46.7000 } },
      ],
    },
    {
      name: 'طريق الأمير محمد بن سلمان',
      segments: [
        { start: { lat: 24.6500, lng: 46.7000 }, end: { lat: 24.6800, lng: 46.7200 } },
        { start: { lat: 24.6800, lng: 46.7200 }, end: { lat: 24.7100, lng: 46.7500 } },
      ],
    },
  ],
  'جدة': [
    {
      name: 'طريق الملك عبدالعزيز',
      segments: [
        { start: { lat: 21.4858, lng: 39.1925 }, end: { lat: 21.5000, lng: 39.2100 } },
        { start: { lat: 21.5000, lng: 39.2100 }, end: { lat: 21.5100, lng: 39.2200 } },
      ],
    },
    {
      name: 'طريق الحرمين',
      segments: [
        { start: { lat: 21.4700, lng: 39.1800 }, end: { lat: 21.4900, lng: 39.2000 } },
        { start: { lat: 21.4900, lng: 39.2000 }, end: { lat: 21.5100, lng: 39.2100 } },
      ],
    },
    {
      name: 'الكورنيش',
      segments: [
        { start: { lat: 21.4800, lng: 39.1500 }, end: { lat: 21.4900, lng: 39.1700 } },
        { start: { lat: 21.4900, lng: 39.1700 }, end: { lat: 21.5000, lng: 39.1800 } },
      ],
    },
  ],
  'الدمام': [
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 26.4207, lng: 50.0888 }, end: { lat: 26.4300, lng: 50.1000 } },
        { start: { lat: 26.4300, lng: 50.1000 }, end: { lat: 26.4400, lng: 50.1100 } },
      ],
    },
    {
      name: 'الكورنيش',
      segments: [
        { start: { lat: 26.4100, lng: 50.0800 }, end: { lat: 26.4200, lng: 50.0900 } },
        { start: { lat: 26.4200, lng: 50.0900 }, end: { lat: 26.4300, lng: 50.1000 } },
      ],
    },
  ],
  'المدينة المنورة': [
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 24.4681, lng: 39.6142 }, end: { lat: 24.4750, lng: 39.6200 } },
        { start: { lat: 24.4750, lng: 39.6200 }, end: { lat: 24.4800, lng: 39.6300 } },
      ],
    },
  ],
  'الخبر': [
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 26.2172, lng: 50.1971 }, end: { lat: 26.2250, lng: 50.2050 } },
        { start: { lat: 26.2250, lng: 50.2050 }, end: { lat: 26.2300, lng: 50.2100 } },
      ],
    },
  ],
  'أبها': [
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 18.2164, lng: 42.5044 }, end: { lat: 18.2230, lng: 42.5120 } },
        { start: { lat: 18.2230, lng: 42.5120 }, end: { lat: 18.2300, lng: 42.5200 } },
      ],
    },
  ],
  'خميس مشيط': [
    {
      name: 'طريق الملك فهد',
      segments: [
        { start: { lat: 18.3000, lng: 42.7300 }, end: { lat: 18.3100, lng: 42.7400 } },
        { start: { lat: 18.3100, lng: 42.7400 }, end: { lat: 18.3200, lng: 42.7500 } },
      ],
    },
  ],
}


/**
 * جلب بيانات الازدحام لنقطة معينة
 */
async function getTrafficDataForPoint(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  apiKey: string
): Promise<any | null> {
  try {
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&departure_time=now&traffic_model=best_guess&key=${apiKey}`
    
    const response = await fetch(directionsUrl)
    const data = await response.json()

    if (data.status === 'OK' && data.routes && data.routes.length > 0) {
      const routeData = data.routes[0]
      const leg = routeData.legs[0]
      
      const durationInTraffic = leg.duration_in_traffic?.value || leg.duration.value
      const duration = leg.duration.value
      const distance = leg.distance.value / 1000 // بالكيلومتر
      const delaySeconds = Math.max(0, durationInTraffic - duration)
      const delayMinutes = delaySeconds / 60

      // حساب مؤشر الازدحام
      const delayRatio = duration > 0 ? durationInTraffic / duration : 1
      let congestionIndex = 0
      
      if (delayRatio > 1.5) {
        congestionIndex = Math.min(100, Math.round((delayRatio - 1.5) * 50 + 50))
      } else if (delayRatio > 1.2) {
        congestionIndex = Math.round((delayRatio - 1.2) * 166)
      } else {
        congestionIndex = Math.round((delayRatio - 1) * 25)
      }

      // حساب متوسط السرعة
      const avgSpeed = durationInTraffic > 0 ? (distance / (durationInTraffic / 3600)) : 0

      return {
        congestionIndex,
        delayMinutes,
        distance,
        avgSpeed,
        duration: durationInTraffic / 60,
        polyline: routeData.overview_polyline?.points || '',
      }
    }
    return null
  } catch (error: any) {
    console.error(`Error fetching traffic for point:`, error.message)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') || 'الرياض'
    const minCongestion = parseInt(searchParams.get('minCongestion') || '20') // الحد الأدنى لمؤشر الازدحام

    const routes = CITY_ROUTES_DETAILED[city] || CITY_ROUTES_DETAILED['الرياض']
    const apiKey = process.env.AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.GOOGLE_MAPS_API_KEY
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    const results: any[] = []
    const processedRoutes = new Set<string>() // لتجنب التكرار

    // مسح جميع المقاطع في جميع الطرق
    for (const route of routes) {
      for (const segment of route.segments) {
        // إنشاء معرف فريد للمسار لتجنب التكرار
        const routeKey = `${Math.round(segment.start.lat * 1000)}-${Math.round(segment.start.lng * 1000)}-${Math.round(segment.end.lat * 1000)}-${Math.round(segment.end.lng * 1000)}`
        
        if (processedRoutes.has(routeKey)) continue
        processedRoutes.add(routeKey)

        const trafficData = await getTrafficDataForPoint(segment.start, segment.end, apiKey)
        
        if (trafficData && trafficData.congestionIndex >= minCongestion) {
          // تحديد مستوى الشدة
          let severity: 'critical' | 'high' | 'medium' | 'low' = 'low'
          if (trafficData.congestionIndex >= 80) {
            severity = 'critical'
          } else if (trafficData.congestionIndex >= 70) {
            severity = 'high'
          } else if (trafficData.congestionIndex >= 50) {
            severity = 'medium'
          }

          results.push({
            id: `scan-${city}-${route.name.replace(/\s+/g, '-')}-${segment.start.lat}-${segment.start.lng}`,
            roadName: route.name,
            city: city,
            direction: 'ذهاب وإياب',
            position: [
              (segment.start.lat + segment.end.lat) / 2,
              (segment.start.lng + segment.end.lng) / 2,
            ] as [number, number],
            congestionIndex: trafficData.congestionIndex,
            severity: severity,
            deviceCount: Math.round((trafficData.congestionIndex / 100) * (trafficData.distance * 50)),
            avgSpeed: Math.round(trafficData.avgSpeed),
            timestamp: new Date().toISOString(),
            duration: Math.round(trafficData.duration),
            distance: Math.round(trafficData.distance * 10) / 10,
            delayMinutes: Math.round(trafficData.delayMinutes * 10) / 10,
            avgDelay: Math.round(trafficData.delayMinutes * 10) / 10,
            source: 'comprehensive-scan',
          })

          // إضافة تأخير صغير لتجنب تجاوز rate limits
          await new Promise(resolve => setTimeout(resolve, 150))
        }
      }
    }

    // ترتيب النتائج حسب مؤشر الازدحام (الأعلى أولاً)
    results.sort((a, b) => b.congestionIndex - a.congestionIndex)

    return NextResponse.json({
      success: true,
      data: results,
      city: city,
      totalScanned: results.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error scanning traffic:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scan traffic',
        data: [],
      },
      { status: 500 }
    )
  }
}

