import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
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
      totalSegments,
      activeAlerts,
      avgCongestion: Math.round(avgCongestion),
      highCongestionCount,
      activePredictions,
      lastUpdate: recentTraffic[0]?.timestamp || new Date(),
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'فشل في جلب الإحصائيات' },
      { status: 500 }
    )
  }
}

