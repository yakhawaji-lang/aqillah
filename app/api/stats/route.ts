import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // محاولة الوصول إلى قاعدة البيانات
    try {
      // إحصائيات عامة
      const totalSegments = await prisma.roadSegment.count()
      const activeAlerts = await prisma.alert.count({
        where: {
          isActive: true,
          expiresAt: {
            gte: new Date(),
          },
        },
      })

      // أحدث بيانات المرور
      const recentTraffic = await prisma.trafficData.findMany({
        take: 100,
        orderBy: {
          timestamp: 'desc',
        },
      })

      const avgCongestion = recentTraffic.length > 0
        ? recentTraffic.reduce((sum, data) => sum + data.congestionIndex, 0) / recentTraffic.length
        : 0

      const highCongestionCount = recentTraffic.filter(
        (data) => data.congestionIndex >= 70
      ).length

      // تنبؤات نشطة
      const activePredictions = await prisma.prediction.count({
        where: {
          predictedFor: {
            gte: new Date(),
          },
        },
      })

      return NextResponse.json({
        success: true,
        totalSegments,
        activeAlerts,
        avgCongestion: Math.round(avgCongestion),
        highCongestionCount,
        activePredictions,
        lastUpdate: recentTraffic[0]?.timestamp || new Date(),
      })
    } catch (dbError: any) {
      // إذا فشل الاتصال بقاعدة البيانات، إرجاع بيانات افتراضية
      console.warn('Database not available, returning default stats:', dbError.message)
      return NextResponse.json({
        success: true,
        totalSegments: 0,
        activeAlerts: 0,
        avgCongestion: 0,
        highCongestionCount: 0,
        activePredictions: 0,
        lastUpdate: new Date(),
        message: 'قاعدة البيانات غير متاحة حالياً'
      })
    }
  } catch (error: any) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'فشل في جلب الإحصائيات',
        totalSegments: 0,
        activeAlerts: 0,
        avgCongestion: 0,
        highCongestionCount: 0,
        activePredictions: 0,
      },
      { status: 500 }
    )
  }
}

