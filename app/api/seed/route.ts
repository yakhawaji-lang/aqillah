import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// هذا endpoint لإضافة بيانات تجريبية (للتطوير فقط)
export async function POST() {
  try {
    // إضافة مقاطع طرق تجريبية
    const segments = [
      {
        roadName: 'طريق الملك فهد',
        city: 'الرياض',
        direction: 'شمال',
        startLat: 24.7136,
        startLng: 46.6753,
        endLat: 24.7500,
        endLng: 46.7000,
        length: 5.2,
      },
      {
        roadName: 'طريق الملك فهد',
        city: 'الرياض',
        direction: 'جنوب',
        startLat: 24.7136,
        startLng: 46.6753,
        endLat: 24.6800,
        endLng: 46.6500,
        length: 4.8,
      },
      {
        roadName: 'طريق العليا',
        city: 'الرياض',
        direction: 'شرق',
        startLat: 24.7136,
        startLng: 46.6753,
        endLat: 24.7200,
        endLng: 46.7200,
        length: 3.5,
      },
    ]

    const createdSegments = []

    for (const segment of segments) {
      const created = await prisma.roadSegment.create({
        data: segment,
      })
      createdSegments.push(created)

      // إضافة بيانات مرور تجريبية
      for (let i = 0; i < 5; i++) {
        const timestamp = new Date()
        timestamp.setMinutes(timestamp.getMinutes() - i * 5)

        await prisma.trafficData.create({
          data: {
            segmentId: created.id,
            timestamp,
            deviceCount: Math.floor(Math.random() * 1000) + 500,
            avgSpeed: 30 + Math.random() * 30,
            density: 20 + Math.random() * 30,
            congestionIndex: Math.floor(Math.random() * 100),
            delayMinutes: Math.random() * 20,
            movementDirection: Math.random() * 360,
          },
        })
      }
    }

    return NextResponse.json({ 
      message: 'تم إضافة البيانات التجريبية بنجاح',
      segmentsCreated: createdSegments.length 
    })
  } catch (error) {
    console.error('Error seeding data:', error)
    return NextResponse.json(
      { error: 'فشل في إضافة البيانات التجريبية' },
      { status: 500 }
    )
  }
}

