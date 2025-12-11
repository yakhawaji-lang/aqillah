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

    // حساب المسار باستخدام البيانات الوهمية من قاعدة البيانات
    // استخدام خوارزمية حساب مبسطة بناءً على المقاطع المتاحة
    let route
    try {
      // البحث عن المقاطع القريبة من نقطة البداية والنهاية
      const originSegments = await prisma.roadSegment.findMany({
        where: {
          OR: [
            {
              startLat: { gte: originLat - 0.05, lte: originLat + 0.05 },
              startLng: { gte: originLng - 0.05, lte: originLng + 0.05 },
            },
            {
              endLat: { gte: originLat - 0.05, lte: originLat + 0.05 },
              endLng: { gte: originLng - 0.05, lte: originLng + 0.05 },
            },
          ],
        },
        take: 5,
      })

      const destinationSegments = await prisma.roadSegment.findMany({
        where: {
          OR: [
            {
              startLat: { gte: destinationLat - 0.05, lte: destinationLat + 0.05 },
              startLng: { gte: destinationLng - 0.05, lte: destinationLng + 0.05 },
            },
            {
              endLat: { gte: destinationLat - 0.05, lte: destinationLat + 0.05 },
              endLng: { gte: destinationLng - 0.05, lte: destinationLng + 0.05 },
            },
          ],
        },
        take: 5,
      })

      // إذا وجدنا مقاطع قريبة، استخدمها لإنشاء مسار
      if (originSegments.length > 0 || destinationSegments.length > 0) {
        // استخدام الحساب المبسط مع بيانات الازدحام من قاعدة البيانات
        route = calculateEmergencyRoute(
          [originLat, originLng],
          [destinationLat, destinationLng],
          congestionMap
        )

        // إضافة معلومات إضافية من المقاطع
        const allSegments = [...originSegments, ...destinationSegments]
        if (allSegments.length > 0) {
          // تحديث المسار ليمر عبر المقاطع المتاحة
          const routePoints: Array<[number, number]> = [[originLat, originLng]]
          
          // إضافة نقاط من المقاطع
          allSegments.forEach(segment => {
            routePoints.push([segment.startLat, segment.startLng])
            routePoints.push([segment.endLat, segment.endLng])
          })
          
          routePoints.push([destinationLat, destinationLng])
          
          route.route = routePoints
          
          // حساب المسافة والوقت بناءً على المقاطع
          let totalDistance = 0
          let totalTime = 0
          
          for (let i = 0; i < routePoints.length - 1; i++) {
            const [lat1, lng1] = routePoints[i]
            const [lat2, lng2] = routePoints[i + 1]
            
            // حساب المسافة بين النقطتين
            const R = 6371e3 // Earth radius in meters
            const φ1 = lat1 * Math.PI / 180
            const φ2 = lat2 * Math.PI / 180
            const Δφ = (lat2 - lat1) * Math.PI / 180
            const Δλ = (lng2 - lng1) * Math.PI / 180

            const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                      Math.cos(φ1) * Math.cos(φ2) *
                      Math.sin(Δλ/2) * Math.sin(Δλ/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

            const distance = R * c / 1000 // بالكيلومتر
            totalDistance += distance
            
            // حساب الوقت (افتراضي 60 كم/ساعة)
            const avgSpeed = 60 // km/h
            totalTime += (distance / avgSpeed) * 60 // بالدقائق
          }
          
          route.distance = Math.round(totalDistance * 10) / 10
          route.estimatedTime = Math.round(totalTime)
          
          // حساب الازدحام على طول المسار
          const congestionAlongRoute: Array<{ lat: number; lng: number; congestion: number }> = []
          routePoints.forEach(([lat, lng]) => {
            // البحث عن مقطع قريب
            const nearbySegment = allSegments.find(s => {
              const dist1 = Math.sqrt(Math.pow(s.startLat - lat, 2) + Math.pow(s.startLng - lng, 2))
              const dist2 = Math.sqrt(Math.pow(s.endLat - lat, 2) + Math.pow(s.endLng - lng, 2))
              return dist1 < 0.01 || dist2 < 0.01
            })
            
            if (nearbySegment) {
              const segmentData = congestionMap.get(nearbySegment.id)
              congestionAlongRoute.push({
                lat,
                lng,
                congestion: segmentData?.index || 30,
              })
            } else {
              congestionAlongRoute.push({
                lat,
                lng,
                congestion: 30, // افتراضي
              })
            }
          })
          
          route.congestionAlongRoute = congestionAlongRoute
        }
        
        console.log('Route calculated using database segments:', { 
          distance: route.distance, 
          estimatedTime: route.estimatedTime,
          segmentsCount: allSegments.length 
        })
      } else {
        // إذا لم نجد مقاطع قريبة، استخدم الحساب المبسط
        console.log('No nearby segments found, using simplified route calculation')
        route = calculateEmergencyRoute(
          [originLat, originLng],
          [destinationLat, destinationLng],
          congestionMap
        )
      }
    } catch (routeError: any) {
      console.error('Error calculating route:', routeError)
      // Fallback إلى الحساب المبسط
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

