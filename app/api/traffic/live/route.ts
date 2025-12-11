/**
 * API - جلب بيانات الازدحام المباشرة من Google Routes API (New)
 * يستخدم Google Routes API v2 للحصول على بيانات أكثر دقة وتفصيلاً
 */

import { NextRequest, NextResponse } from 'next/server'

// إحداثيات المدن الرئيسية وطرقها الرئيسية
const CITY_ROUTES: Record<string, Array<{
  name: string
  start: { lat: number; lng: number }
  end: { lat: number; lng: number }
}>> = {
  'الرياض': [
    { name: 'طريق الملك فهد', start: { lat: 24.7136, lng: 46.6753 }, end: { lat: 24.7500, lng: 46.7000 } },
    { name: 'طريق العليا', start: { lat: 24.6800, lng: 46.6500 }, end: { lat: 24.7200, lng: 46.6800 } },
    { name: 'طريق الدائري الشرقي', start: { lat: 24.7000, lng: 46.8000 }, end: { lat: 24.7000, lng: 46.6000 } },
    { name: 'طريق الدائري الشمالي', start: { lat: 24.8000, lng: 46.7000 }, end: { lat: 24.6000, lng: 46.7000 } },
    { name: 'طريق الملك عبدالعزيز', start: { lat: 24.6500, lng: 46.6000 }, end: { lat: 24.7500, lng: 46.8000 } },
    { name: 'طريق الأمير سلطان', start: { lat: 24.6800, lng: 46.6200 }, end: { lat: 24.7200, lng: 46.7500 } },
    { name: 'طريق العروبة', start: { lat: 24.6600, lng: 46.6400 }, end: { lat: 24.7100, lng: 46.6900 } },
    { name: 'طريق الخليج', start: { lat: 24.6900, lng: 46.6300 }, end: { lat: 24.7300, lng: 46.7200 } },
  ],
  'جدة': [
    { name: 'طريق الملك عبدالعزيز', start: { lat: 21.4858, lng: 39.1925 }, end: { lat: 21.5000, lng: 39.2200 } },
    { name: 'طريق الحرمين', start: { lat: 21.4700, lng: 39.1800 }, end: { lat: 21.5100, lng: 39.2000 } },
    { name: 'الكورنيش', start: { lat: 21.4800, lng: 39.1500 }, end: { lat: 21.5000, lng: 39.1800 } },
    { name: 'طريق المدينة', start: { lat: 21.4600, lng: 39.1900 }, end: { lat: 21.4900, lng: 39.2100 } },
  ],
  'الدمام': [
    { name: 'طريق الملك فهد', start: { lat: 26.4207, lng: 50.0888 }, end: { lat: 26.4400, lng: 50.1100 } },
    { name: 'الكورنيش', start: { lat: 26.4100, lng: 50.0800 }, end: { lat: 26.4300, lng: 50.1000 } },
  ],
  'المدينة المنورة': [
    { name: 'طريق الملك فهد', start: { lat: 24.4681, lng: 39.6142 }, end: { lat: 24.4800, lng: 39.6300 } },
  ],
  'الخبر': [
    { name: 'طريق الملك فهد', start: { lat: 26.2172, lng: 50.1971 }, end: { lat: 26.2300, lng: 50.2100 } },
  ],
  'أبها': [
    { name: 'طريق الملك فهد', start: { lat: 18.2164, lng: 42.5044 }, end: { lat: 18.2300, lng: 42.5200 } },
  ],
  'خميس مشيط': [
    { name: 'طريق الملك فهد', start: { lat: 18.3000, lng: 42.7300 }, end: { lat: 18.3200, lng: 42.7500 } },
  ],
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city') || 'الرياض'

    const routes = CITY_ROUTES[city] || CITY_ROUTES['الرياض']
    const results: any[] = []

    const apiKey = process.env.AQILLAH_ROUTES_KEY || process.env.AQILLAH_MAPS_WEB_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Routes API key not configured')
    }

    // جلب بيانات الازدحام لكل طريق باستخدام Google Routes API (New)
    for (const route of routes) {
      try {
        const routesUrl = `https://routes.googleapis.com/directions/v2:computeRoutes`
        
        const requestBody = {
          origin: {
            location: {
              latLng: {
                latitude: route.start.lat,
                longitude: route.start.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: route.end.lat,
                longitude: route.end.lng,
              },
            },
          },
          travelMode: 'DRIVE',
          routingPreference: 'TRAFFIC_AWARE',
          computeAlternativeRoutes: false,
          routeModifiers: {
            avoidTolls: false,
            avoidHighways: false,
            avoidFerries: false,
          },
          departureTime: new Date().toISOString(),
          languageCode: 'ar',
          units: 'METRIC',
        }

        const response = await fetch(routesUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs.steps.duration,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline',
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`Routes API error for ${route.name}:`, errorText)
          continue
        }

        const data = await response.json()

        if (data.routes && data.routes.length > 0) {
          const routeData = data.routes[0]
          const leg = routeData.legs?.[0]
          
          if (leg) {
            const duration = leg.duration?.replace('s', '') || '0'
            const staticDuration = leg.staticDuration?.replace('s', '') || duration
            const distanceMeters = parseInt(leg.distanceMeters || '0')
            const distanceKm = distanceMeters / 1000

            // حساب التأخير
            const durationSeconds = parseInt(duration)
            const staticDurationSeconds = parseInt(staticDuration)
            const delaySeconds = Math.max(0, durationSeconds - staticDurationSeconds)
            const delayMinutes = Math.round(delaySeconds / 60)

            // حساب مؤشر الازدحام
            const delayRatio = staticDurationSeconds > 0 ? durationSeconds / staticDurationSeconds : 1
            let congestionIndex = 0
            
            if (delayRatio > 1.5) {
              congestionIndex = Math.min(100, Math.round((delayRatio - 1.5) * 50 + 50))
            } else if (delayRatio > 1.2) {
              congestionIndex = Math.round((delayRatio - 1.2) * 166)
            } else {
              congestionIndex = Math.round((delayRatio - 1) * 25)
            }

            // حساب متوسط السرعة
            const avgSpeed = durationSeconds > 0 ? (distanceKm / (durationSeconds / 3600)) : 0

            // حساب عدد المركبات المتأثرة بناءً على الازدحام الفعلي
            const affectedVehicles = Math.round((congestionIndex / 100) * (distanceKm * 50))

            results.push({
              id: `routes-api-${city}-${route.name.replace(/\s+/g, '-')}`,
              roadName: route.name,
              city: city,
              direction: 'ذهاب وإياب',
              position: [
                (route.start.lat + route.end.lat) / 2,
                (route.start.lng + route.end.lng) / 2,
              ] as [number, number],
              congestionIndex: congestionIndex,
              deviceCount: affectedVehicles,
              avgSpeed: Math.round(avgSpeed),
              timestamp: new Date().toISOString(),
              duration: Math.round(durationSeconds / 60),
              distance: Math.round(distanceKm * 10) / 10,
              delayMinutes: delayMinutes,
              source: 'google-routes-api-v2',
            })
          }
        }
      } catch (error: any) {
        console.error(`Error fetching Routes API data for route ${route.name}:`, error.message)
        // لا نضيف بيانات وهمية - نتركها فارغة
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      source: 'google-routes-api-v2',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching Google Routes API data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Google Routes API data',
        data: [],
      },
      { status: 500 }
    )
  }
}



