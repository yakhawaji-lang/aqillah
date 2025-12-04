import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateDecisions, selectBestDecision } from '@/lib/core/decision-engine'
import { analyzeTraffic } from '@/lib/core/traffic-intelligence'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const segmentId = searchParams.get('segmentId')
    const status = searchParams.get('status')

    const decisions = await prisma.trafficDecision.findMany({
      where: {
        ...(segmentId && { segmentId }),
        ...(status && { status }),
      },
      include: {
        segment: true,
      },
      orderBy: {
        recommendedAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ data: decisions })
  } catch (error) {
    console.error('Error fetching decisions:', error)
    return NextResponse.json(
      { error: 'فشل في جلب القرارات' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { segmentId } = body

    // جلب البيانات الحالية
    const currentData = await prisma.trafficData.findFirst({
      where: { segmentId },
      orderBy: { timestamp: 'desc' },
      include: { segment: true },
    })

    if (!currentData) {
      return NextResponse.json(
        { error: 'لا توجد بيانات للمقطع' },
        { status: 404 }
      )
    }

    // جلب الاختناق الحالي
    const bottleneck = await prisma.bottleneck.findFirst({
      where: {
        segmentId,
        isResolved: false,
      },
    })

    // جلب التنبؤات
    const predictions = await prisma.prediction.findMany({
      where: {
        segmentId,
        predictedFor: { gte: new Date() },
      },
      orderBy: { predictedFor: 'asc' },
      take: 4,
    })

    // تحليل البيانات
    const analysis = analyzeTraffic(
      {
        segmentId: currentData.segmentId,
        timestamp: currentData.timestamp,
        deviceCount: Math.round(currentData.density * 1000),
        density: currentData.density,
        avgSpeed: currentData.avgSpeed,
        movementDirection: currentData.movementDirection || 0,
        kAnonymity: 30,
        isAnonymized: true,
      },
      currentData.segment.freeFlowSpeed
    )

    // توليد القرارات
    const decisions = generateDecisions(
      analysis,
      bottleneck ? {
        segmentId: bottleneck.segmentId,
        originLat: bottleneck.originLat,
        originLng: bottleneck.originLng,
        detectedAt: bottleneck.detectedAt,
        severity: bottleneck.severity as any,
        speedDrop: bottleneck.speedDrop,
        backwardExtent: bottleneck.backwardExtent,
        affectedSegments: [bottleneck.segmentId],
      } : null,
      predictions.map(p => ({
        segmentId: p.segmentId,
        predictedAt: p.predictedAt,
        predictedFor: p.predictedFor,
        predictedIndex: p.predictedIndex,
        predictedDelayMinutes: p.predictedDelayMinutes || 0,
        confidence: p.confidence,
        modelType: p.modelType as any,
        seasonalityFactor: p.seasonalityFactor,
        factors: p.factors as any,
      }))
    )

    // حفظ القرارات في قاعدة البيانات
    const savedDecisions = await Promise.all(
      decisions.map(decision =>
        prisma.trafficDecision.create({
          data: {
            segmentId: decision.segmentId,
            decisionType: decision.decisionType,
            recommendedAt: decision.recommendedAt,
            expectedDelayReduction: decision.expectedDelayReduction,
            expectedBenefitScore: decision.expectedBenefitScore,
            affectedSegments: decision.affectedSegments,
            details: decision.details,
            status: 'pending',
          },
        })
      )
    )

    // اختيار أفضل قرار
    const bestDecision = selectBestDecision(decisions)

    return NextResponse.json({
      success: true,
      data: {
        decisions: savedDecisions,
        bestDecision: bestDecision
          ? savedDecisions.find(d => d.id === bestDecision.id)
          : null,
      },
    })
  } catch (error) {
    console.error('Error generating decisions:', error)
    return NextResponse.json(
      { error: 'فشل في توليد القرارات' },
      { status: 500 }
    )
  }
}

