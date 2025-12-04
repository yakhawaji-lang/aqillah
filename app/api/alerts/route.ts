import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    const alerts = await prisma.alert.findMany({
      where: {
        isActive: activeOnly ? true : undefined,
        expiresAt: {
          gte: new Date(),
        },
        ...(city && {
          segment: {
            city: city,
          },
        }),
      },
      include: {
        segment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    const result = alerts.map((alert) => ({
      id: alert.id,
      segmentId: alert.segmentId,
      roadName: alert.segment.roadName,
      city: alert.segment.city,
      direction: alert.segment.direction,
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      alternativeRoute: alert.alternativeRoute,
      createdAt: alert.createdAt instanceof Date ? alert.createdAt.toISOString() : alert.createdAt,
      expiresAt: alert.expiresAt instanceof Date ? alert.expiresAt.toISOString() : alert.expiresAt,
      isActive: alert.isActive,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'فشل في جلب التنبيهات' },
      { status: 500 }
    )
  }
}

