import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get('segmentId')
    const minutesAhead = parseInt(searchParams.get('minutesAhead') || '20')

    const predictedFor = new Date()
    predictedFor.setMinutes(predictedFor.getMinutes() + minutesAhead)

    const predictions = await prisma.prediction.findMany({
      where: {
        predictedFor: {
          gte: new Date(),
          lte: predictedFor,
        },
        ...(segmentId && { segmentId }),
      },
      include: {
        segment: true,
      },
      orderBy: {
        predictedFor: 'asc',
      },
      take: 50,
    })

    const result = predictions.map((pred) => ({
      id: pred.id,
      segmentId: pred.segmentId,
      roadName: pred.segment.roadName,
      city: pred.segment.city,
      direction: pred.segment.direction,
      predictedIndex: pred.predictedIndex,
      confidence: pred.confidence,
      predictedFor: pred.predictedFor,
      factors: pred.factors,
    }))

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error fetching predictions:', error)
    return NextResponse.json(
      { error: 'فشل في جلب التنبؤات' },
      { status: 500 }
    )
  }
}

