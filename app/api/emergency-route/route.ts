import { NextRequest, NextResponse } from 'next/server'
import {
  calculateEmergencyRoute,
  updateEmergencyRoute,
  shouldUpdateRoute,
} from '@/lib/core/emergency-routing'
import { prisma } from '@/lib/prisma'
import { googleMapsService } from '@/lib/services/google-maps'

/**
 * فك تشفير Google Polyline إلى مصفوفة من الإحداثيات
 */
function decodePolyline(encoded: string): Array<[number, number]> {
  if (!encoded) return []
  
  const poly: Array<[number, number]> = []
  let index = 0
  const len = encoded.length
  let lat = 0
  let lng = 0

  while (index < len) {
    let b
    let shift = 0
    let result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
    lat += dlat

    shift = 0
    result = 0
    do {
      b = encoded.charCodeAt(index++) - 63
      result |= (b & 0x1f) << shift
      shift += 5
    } while (b >= 0x20)
    const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1))
    lng += dlng

    poly.push([lat * 1e-5, lng * 1e-5])
  }

  return poly
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originLat, originLng, destinationLat, destinationLng, routeId } = body

    // إذا كان هناك routeId، تحديث المسار الموجود
    if (routeId) {
      let existingRoute
      try {
        existingRoute = await prisma.emergencyRoute.findUnique({
          where: { id: routeId },
        })
      } catch (dbError: any) {
        console.warn('Database not available, cannot update existing route:', dbError.message)
        return NextResponse.json(
          { error: 'قاعدة البيانات غير متاحة. لا يمكن تحديث المسار الموجود.' },
          { status: 503 }
        )
      }

      if (!existingRoute) {
        return NextResponse.json(
          { error: 'المسار غير موجود' },
          { status: 404 }
        )
      }

      // التحقق من الحاجة للتحديث
      const routeData = {
        ...existingRoute,
        lastUpdate: existingRoute.lastUpdate,
        updateInterval: existingRoute.updateInterval,
        route: existingRoute.route as Array<[number, number]>,
        congestionAlongRoute: (existingRoute.congestionAlongRoute as any) || [],
      }
      
      if (!shouldUpdateRoute(routeData)) {
        return NextResponse.json({
          success: true,
          data: existingRoute,
          message: 'المسار محدث بالفعل',
        })
      }

      // جلب بيانات الازدحام الحالية (مع التعامل مع عدم توفر قاعدة البيانات)
      const congestionMap = new Map<string, { index: number; delay: number }>()
      try {
        const trafficData = await prisma.trafficData.findMany({
          take: 100,
          orderBy: { timestamp: 'desc' },
          include: { segment: true },
        })

        trafficData.forEach(data => {
          congestionMap.set(data.segmentId, {
            index: data.congestionIndex,
            delay: data.delayMinutes,
          })
        })
      } catch (dbError: any) {
        // إذا فشل الاتصال بقاعدة البيانات، نستخدم congestionMap فارغ
        // سيتم حساب المسار بدون بيانات ازدحام محلية
        console.warn('Database not available, using empty congestion map:', dbError.message)
      }

      // تحديث المسار
      const updatedRoute = updateEmergencyRoute(
        routeData,
        congestionMap
      )

      // حفظ التحديث (مع التعامل مع عدم توفر قاعدة البيانات)
      let savedRoute
      try {
        savedRoute = await prisma.emergencyRoute.update({
          where: { id: routeId },
          data: {
            route: updatedRoute.route,
            distance: updatedRoute.distance,
            estimatedTime: updatedRoute.estimatedTime,
            lastUpdate: updatedRoute.lastUpdate,
            congestionAlongRoute: updatedRoute.congestionAlongRoute,
          },
        })
      } catch (dbError: any) {
        // إذا فشل التحديث في قاعدة البيانات، نعيد المسار المحدث بدون حفظ
        console.warn('Database not available, returning updated route without saving:', dbError.message)
        savedRoute = {
          ...existingRoute,
          ...updatedRoute,
        }
      }

      return NextResponse.json({
        success: true,
        data: savedRoute,
      })
    }

    // حساب مسار جديد
    if (!originLat || !originLng || !destinationLat || !destinationLng) {
      console.error('Missing coordinates:', { originLat, originLng, destinationLat, destinationLng })
      return NextResponse.json(
        { error: 'إحداثيات غير كاملة' },
        { status: 400 }
      )
    }

    // التحقق من صحة الإحداثيات
    if (
      typeof originLat !== 'number' || typeof originLng !== 'number' ||
      typeof destinationLat !== 'number' || typeof destinationLng !== 'number' ||
      isNaN(originLat) || isNaN(originLng) || isNaN(destinationLat) || isNaN(destinationLng)
    ) {
      console.error('Invalid coordinates:', { originLat, originLng, destinationLat, destinationLng })
      return NextResponse.json(
        { error: 'إحداثيات غير صحيحة' },
        { status: 400 }
      )
    }

    // جلب بيانات الازدحام الحالية (مع التعامل مع عدم توفر قاعدة البيانات)
    const congestionMap = new Map<string, { index: number; delay: number }>()
    try {
      const trafficData = await prisma.trafficData.findMany({
        take: 100,
        orderBy: { timestamp: 'desc' },
        include: { segment: true },
      })

      trafficData.forEach(data => {
        congestionMap.set(data.segmentId, {
          index: data.congestionIndex,
          delay: data.delayMinutes,
        })
      })
    } catch (dbError: any) {
      // إذا فشل الاتصال بقاعدة البيانات، نستخدم congestionMap فارغ
      // سيتم حساب المسار بدون بيانات ازدحام محلية
      console.warn('Database not available, using empty congestion map:', dbError.message)
    }

    // دوال مساعدة لحساب المسافة والزاوية
    const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
      const R = 6371e3 // Earth radius in meters
      const φ1 = point1[0] * Math.PI / 180
      const φ2 = point2[0] * Math.PI / 180
      const Δφ = (point2[0] - point1[0]) * Math.PI / 180
      const Δλ = (point2[1] - point1[1]) * Math.PI / 180

      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

      return R * c
    }

    const calculateBearing = (point1: [number, number], point2: [number, number]): number => {
      const lat1 = point1[0] * Math.PI / 180
      const lat2 = point2[0] * Math.PI / 180
      const dLon = (point2[1] - point1[1]) * Math.PI / 180

      const y = Math.sin(dLon) * Math.cos(lat2)
      const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

      const bearing = Math.atan2(y, x)
      return bearing * 180 / Math.PI
    }

    const calculateAngle = (point1: [number, number], point2: [number, number], point3: [number, number]): number => {
      const bearing1 = calculateBearing(point2, point1)
      const bearing2 = calculateBearing(point2, point3)
      return bearing2 - bearing1
    }

    // حساب المسار باستخدام Google Directions API للحصول على مسار يتبع الطرق الفعلية
    let route
    try {
      // استخدام Google Routes API للحصول على المسار الفعلي على الطرق
      const googleRoute = await googleMapsService.calculateRoute({
        origin: { lat: originLat, lng: originLng },
        destination: { lat: destinationLat, lng: destinationLng },
        departureTime: 'now',
        alternatives: false,
      })

      if (!googleRoute.routes || googleRoute.routes.length === 0) {
        throw new Error('لم يتم العثور على مسار')
      }

      const bestRoute = googleRoute.routes[0]
      
      // فك تشفير polyline للحصول على نقاط المسار
      const decodedPolyline = decodePolyline(bestRoute.polyline)
      
      // تحويل الخطوات من Google Routes API
      const steps = bestRoute.steps.map((step: any) => ({
        instruction: step.instructions || 'تابع المسار',
        distance: step.distance || 0,
        duration: step.duration || 0,
        startLocation: [step.startLocation.lat, step.startLocation.lng] as [number, number],
        endLocation: [step.endLocation.lat, step.endLocation.lng] as [number, number],
        maneuver: step.maneuver || undefined,
      }))

      // إنشاء كائن EmergencyRoute
      route = {
        id: `emergency-${Date.now()}`,
        originLat,
        originLng,
        destinationLat,
        destinationLng,
        route: decodedPolyline,
        distance: (bestRoute.distance || 0) / 1000, // تحويل من متر إلى كيلومتر
        estimatedTime: (bestRoute.durationInTraffic || bestRoute.duration || 0) / 60, // تحويل من ثانية إلى دقيقة
        lastUpdate: new Date(),
        updateInterval: 30,
        isActive: true,
        congestionAlongRoute: [],
        steps,
      }

      console.log('Route calculated using Google Directions API:', { 
        distance: route.distance, 
        estimatedTime: route.estimatedTime,
        stepsCount: steps.length 
      })
    } catch (routeError: any) {
      console.error('Error calculating route with Google Directions API:', routeError)
      // Fallback إلى الحساب المبسط إذا فشل Google Directions API
      console.log('Falling back to simplified route calculation')
      route = calculateEmergencyRoute(
        [originLat, originLng],
        [destinationLat, destinationLng],
        congestionMap
      )
    }

    // حفظ المسار (مع التعامل مع عدم توفر قاعدة البيانات)
    let savedRoute
    try {
      savedRoute = await prisma.emergencyRoute.create({
        data: {
          originLat: route.originLat,
          originLng: route.originLng,
          destinationLat: route.destinationLat,
          destinationLng: route.destinationLng,
          route: route.route,
          distance: route.distance,
          estimatedTime: route.estimatedTime,
          lastUpdate: route.lastUpdate,
          updateInterval: route.updateInterval,
          isActive: route.isActive,
          congestionAlongRoute: route.congestionAlongRoute,
        },
      })
      console.log('Route saved:', savedRoute.id)
    } catch (dbError: any) {
      // إذا فشل حفظ المسار في قاعدة البيانات، نعيد المسار المحسوب بدون حفظ
      console.warn('Database not available, returning route without saving:', dbError.message)
      savedRoute = {
        id: route.id,
        originLat: route.originLat,
        originLng: route.originLng,
        destinationLat: route.destinationLat,
        destinationLng: route.destinationLng,
        route: route.route,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        lastUpdate: route.lastUpdate,
        updateInterval: route.updateInterval,
        isActive: route.isActive,
        congestionAlongRoute: route.congestionAlongRoute,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any
    }

    return NextResponse.json({
      success: true,
      data: {
        ...savedRoute,
        steps: route.steps || [],
      },
    })
  } catch (error: any) {
    console.error('Error calculating emergency route:', error)
    const errorMessage = error?.message || 'فشل في حساب مسار الطوارئ'
    const errorDetails = error?.cause || error?.stack || ''
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorDetails : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const routeId = searchParams.get('routeId')

    if (routeId) {
      let route
      try {
        route = await prisma.emergencyRoute.findUnique({
          where: { id: routeId },
        })
      } catch (dbError: any) {
        console.warn('Database not available, cannot fetch route:', dbError.message)
        return NextResponse.json(
          { error: 'قاعدة البيانات غير متاحة. لا يمكن جلب المسار.' },
          { status: 503 }
        )
      }

      if (!route) {
        return NextResponse.json(
          { error: 'المسار غير موجود' },
          { status: 404 }
        )
      }

      return NextResponse.json({ data: route })
    }

    // جلب جميع المسارات النشطة
    let routes
    try {
      routes = await prisma.emergencyRoute.findMany({
        where: { isActive: true },
        orderBy: { requestedAt: 'desc' },
        take: 50,
      })
    } catch (dbError: any) {
      console.warn('Database not available, returning empty routes list:', dbError.message)
      // إرجاع قائمة فارغة بدلاً من خطأ
      return NextResponse.json({ data: [] })
    }

    return NextResponse.json({ data: routes })
  } catch (error) {
    console.error('Error fetching emergency routes:', error)
    return NextResponse.json(
      { error: 'فشل في جلب مسارات الطوارئ' },
      { status: 500 }
    )
  }
}

