import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const limit = parseInt(searchParams.get('limit') || '50')
    const timeRange = searchParams.get('timeRange') || '24h' // 1h, 6h, 24h

    // حساب الوقت المحدد بناءً على timeRange
    const now = new Date()
    let startTime: Date
    switch (timeRange) {
      case '1h':
        startTime = new Date(now.getTime() - 60 * 60 * 1000) // ساعة واحدة
        break
      case '6h':
        startTime = new Date(now.getTime() - 6 * 60 * 60 * 1000) // 6 ساعات
        break
      case '24h':
      default:
        startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 ساعة
        break
    }

    // جلب بيانات المرور حسب الفترة الزمنية
    const trafficData = await prisma.trafficData.findMany({
      take: limit * 10, // جلب المزيد للفلترة
      orderBy: {
        timestamp: 'desc',
      },
      include: {
        segment: true,
      },
      where: {
        timestamp: {
          gte: startTime,
        },
        ...(city ? {
          segment: {
            city: city,
          },
        } : {}),
      },
    })

    // تجميع البيانات حسب المقطع
    const aggregatedData = trafficData.reduce((acc, data) => {
      const segmentId = data.segmentId
      if (!acc[segmentId]) {
        acc[segmentId] = {
          segment: data.segment,
          latestData: data,
          avgCongestion: data.congestionIndex,
          count: 1,
        }
      } else {
        acc[segmentId].avgCongestion = 
          (acc[segmentId].avgCongestion * acc[segmentId].count + data.congestionIndex) /
          (acc[segmentId].count + 1)
        acc[segmentId].count++
        if (data.timestamp > acc[segmentId].latestData.timestamp) {
          acc[segmentId].latestData = data
        }
      }
      return acc
    }, {} as Record<string, any>)

    const result = Object.values(aggregatedData).map((item: any) => ({
      id: item.segment.id,
      roadName: item.segment.roadName,
      city: item.segment.city,
      direction: item.segment.direction,
      position: [
        (item.segment.startLat + item.segment.endLat) / 2,
        (item.segment.startLng + item.segment.endLng) / 2,
      ] as [number, number],
      congestionIndex: Math.round(item.avgCongestion),
      deviceCount: item.latestData.deviceCount,
      avgSpeed: item.latestData.avgSpeed,
      timestamp: item.latestData.timestamp,
    }))

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error('Error fetching traffic data:', error)
    
    // التحقق من نوع الخطأ
    const errorMessage = error?.message || 'فشل في جلب بيانات المرور'
    const isDatabaseError = errorMessage.includes('database') || 
                           errorMessage.includes('Can\'t reach database') ||
                           errorMessage.includes('localhost:3306')
    
    return NextResponse.json(
      { 
        error: isDatabaseError 
          ? 'فشل الاتصال بقاعدة البيانات. تأكد من تشغيل MySQL على localhost:3306'
          : 'فشل في جلب بيانات المرور',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        databaseError: isDatabaseError
      },
      { status: 500 }
    )
  }
}

