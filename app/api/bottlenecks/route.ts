import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { detectBottleneck, linkBackwardExtent } from '@/lib/core/bottleneck-detection'
import { analyzeTraffic } from '@/lib/core/traffic-intelligence'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const segmentId = searchParams.get('segmentId')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // محاولة الوصول إلى قاعدة البيانات
    try {
      const bottlenecks = await prisma.bottleneck.findMany({
        where: {
          ...(segmentId && { segmentId }),
          ...(activeOnly && { isResolved: false }),
        },
        include: {
          segment: true,
        },
        orderBy: {
          detectedAt: 'desc',
        },
        take: 100,
      })

      return NextResponse.json({ 
        success: true,
        data: bottlenecks 
      })
    } catch (dbError: any) {
      // إذا فشل الاتصال بقاعدة البيانات، إرجاع بيانات فارغة بدلاً من خطأ
      console.warn('Database not available, returning empty data:', dbError.message)
      return NextResponse.json({ 
        success: true,
        data: [],
        message: 'قاعدة البيانات غير متاحة حالياً'
      })
    }
  } catch (error: any) {
    console.error('Error fetching bottlenecks:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'فشل في جلب نقاط الازدحام',
        data: []
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segmentId } = body

    // جلب البيانات الحالية والسابقة
    const currentData = await prisma.trafficData.findFirst({
      where: { segmentId },
      orderBy: { timestamp: 'desc' },
      include: { segment: true },
    })

    const previousData = await prisma.trafficData.findMany({
      where: { segmentId },
      orderBy: { timestamp: 'desc' },
      take: 2,
      include: { segment: true },
    })

    if (!currentData || previousData.length < 2) {
      return NextResponse.json(
        { error: 'بيانات غير كافية للكشف' },
        { status: 400 }
      )
    }

    // تحليل البيانات
    const currentAnalysis = analyzeTraffic(
      {
        segmentId: currentData.segmentId,
        timestamp: currentData.timestamp,
        deviceCount: Math.round(currentData.density * 1000), // تقدير عدد الأجهزة
        density: currentData.density,
        avgSpeed: currentData.avgSpeed,
        movementDirection: currentData.movementDirection || 0,
        kAnonymity: 30,
        isAnonymized: true,
      },
      currentData.segment.freeFlowSpeed
    )

    const previousAnalysis = analyzeTraffic(
      {
        segmentId: previousData[1].segmentId,
        timestamp: previousData[1].timestamp,
        deviceCount: Math.round(previousData[1].density * 1000),
        density: previousData[1].density,
        avgSpeed: previousData[1].avgSpeed,
        movementDirection: previousData[1].movementDirection || 0,
        kAnonymity: 30,
        isAnonymized: true,
      },
      previousData[1].segment.freeFlowSpeed
    )

    // كشف نقطة الازدحام
    const bottleneck = detectBottleneck(
      currentAnalysis,
      previousAnalysis,
      currentData.segment.freeFlowSpeed
    )

    if (!bottleneck) {
      return NextResponse.json({
        success: false,
        message: 'لا توجد نقطة ازدحام مكتشفة',
      })
    }

    // إضافة إحداثيات المقطع
    bottleneck.originLat = (currentData.segment.startLat + currentData.segment.endLat) / 2
    bottleneck.originLng = (currentData.segment.startLng + currentData.segment.endLng) / 2

    // حفظ في قاعدة البيانات
    const savedBottleneck = await prisma.bottleneck.create({
      data: {
        segmentId: bottleneck.segmentId,
        detectedAt: bottleneck.detectedAt,
        originLat: bottleneck.originLat,
        originLng: bottleneck.originLng,
        severity: bottleneck.severity,
        speedDrop: bottleneck.speedDrop,
        backwardExtent: bottleneck.backwardExtent,
        isResolved: false,
      },
    })

    return NextResponse.json({
      success: true,
      data: savedBottleneck,
    })
  } catch (error) {
    console.error('Error detecting bottleneck:', error)
    return NextResponse.json(
      { error: 'فشل في كشف نقطة الازدحام' },
      { status: 500 }
    )
  }
}

