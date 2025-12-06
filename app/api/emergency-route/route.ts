import { NextRequest, NextResponse } from 'next/server'
import {
  calculateEmergencyRoute,
  updateEmergencyRoute,
  shouldUpdateRoute,
} from '@/lib/core/emergency-routing'
import { prisma } from '@/lib/prisma'

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

    // حساب المسار
    let route
    try {
      route = calculateEmergencyRoute(
        [originLat, originLng],
        [destinationLat, destinationLng],
        congestionMap
      )
      console.log('Route calculated:', { distance: route.distance, estimatedTime: route.estimatedTime })
      
      // تحويل المسار إلى خطوات للتوجيه
      if (route.route && route.route.length > 0) {
        const steps: any[] = []
        const segmentLength = Math.max(1, Math.floor(route.route.length / 10)) // تقسيم المسار إلى 10 خطوات تقريباً
        
        for (let i = 0; i < route.route.length - 1; i += segmentLength) {
          const startPoint = route.route[i]
          const endPoint = route.route[Math.min(i + segmentLength, route.route.length - 1)]
          
          const distance = calculateDistance(startPoint, endPoint)
          const duration = (distance / 1000 / 50) * 60 // افتراض سرعة 50 كم/س
          
          let instruction = 'تابع المسار'
          if (i === 0) {
            instruction = 'ابدأ المسار'
          } else if (i + segmentLength >= route.route.length - 1) {
            instruction = 'وصلت إلى الوجهة'
          } else {
            // تحديد نوع المنعطف بناءً على الزاوية
            const angle = calculateAngle(startPoint, route.route[Math.max(0, i - 1)], endPoint)
            if (angle > 30) {
              instruction = 'استدر يميناً'
            } else if (angle < -30) {
              instruction = 'استدر يساراً'
            } else {
              instruction = 'تابع مباشرة'
            }
          }
          
          steps.push({
            instruction,
            distance: Math.round(distance),
            duration: Math.round(duration),
            startLocation: startPoint,
            endLocation: endPoint,
          })
        }
        
        route.steps = steps
      }
    } catch (routeError: any) {
      console.error('Error in calculateEmergencyRoute:', routeError)
      throw new Error(`فشل في حساب المسار: ${routeError?.message || 'خطأ غير معروف'}`)
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

