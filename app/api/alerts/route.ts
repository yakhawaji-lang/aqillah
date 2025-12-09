import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const city = searchParams.get('city')
    const activeOnly = searchParams.get('activeOnly') !== 'false'

    // محاولة الوصول إلى قاعدة البيانات
    try {
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

      return NextResponse.json({ 
        success: true,
        data: result 
      })
    } catch (dbError: any) {
      // إذا فشل الاتصال بقاعدة البيانات، إرجاع بيانات فارغة
      console.warn('Database not available, returning empty data:', dbError.message)
      return NextResponse.json({ 
        success: true,
        data: [],
        message: 'قاعدة البيانات غير متاحة حالياً'
      })
    }
  } catch (error: any) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'فشل في جلب التنبيهات',
        data: []
      },
      { status: 500 }
    )
  }
}

