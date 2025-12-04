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
      const existingRoute = await prisma.emergencyRoute.findUnique({
        where: { id: routeId },
      })

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

      // جلب بيانات الازدحام الحالية
      const congestionMap = new Map<string, { index: number; delay: number }>()
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

      // تحديث المسار
      const updatedRoute = updateEmergencyRoute(
        routeData,
        congestionMap
      )

      // حفظ التحديث
      const savedRoute = await prisma.emergencyRoute.update({
        where: { id: routeId },
        data: {
          route: updatedRoute.route,
          distance: updatedRoute.distance,
          estimatedTime: updatedRoute.estimatedTime,
          lastUpdate: updatedRoute.lastUpdate,
          congestionAlongRoute: updatedRoute.congestionAlongRoute,
        },
      })

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

    // جلب بيانات الازدحام الحالية
    const congestionMap = new Map<string, { index: number; delay: number }>()
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

    // حساب المسار
    let route
    try {
      route = calculateEmergencyRoute(
        [originLat, originLng],
        [destinationLat, destinationLng],
        congestionMap
      )
      console.log('Route calculated:', { distance: route.distance, estimatedTime: route.estimatedTime })
    } catch (routeError: any) {
      console.error('Error in calculateEmergencyRoute:', routeError)
      throw new Error(`فشل في حساب المسار: ${routeError?.message || 'خطأ غير معروف'}`)
    }

    // حفظ المسار
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
      console.error('Database error:', dbError)
      throw new Error(`فشل في حفظ المسار: ${dbError?.message || 'خطأ في قاعدة البيانات'}`)
    }

    return NextResponse.json({
      success: true,
      data: savedRoute,
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
    const { searchParams } = new URL(request.url)
    const routeId = searchParams.get('routeId')

    if (routeId) {
      const route = await prisma.emergencyRoute.findUnique({
        where: { id: routeId },
      })

      if (!route) {
        return NextResponse.json(
          { error: 'المسار غير موجود' },
          { status: 404 }
        )
      }

      return NextResponse.json({ data: route })
    }

    // جلب جميع المسارات النشطة
    const routes = await prisma.emergencyRoute.findMany({
      where: { isActive: true },
      orderBy: { requestedAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: routes })
  } catch (error) {
    console.error('Error fetching emergency routes:', error)
    return NextResponse.json(
      { error: 'فشل في جلب مسارات الطوارئ' },
      { status: 500 }
    )
  }
}

