/**
 * وحدة استقبال البيانات (Data Ingestion Layer)
 * 
 * استقبال بيانات مجمعة من مزودي الاتصالات
 * تطبيق إخفاء الهوية والتجميع
 */

import { NextRequest, NextResponse } from 'next/server'
import { anonymizeData, validatePrivacyCompliance } from '@/lib/core/anonymization'
import { analyzeTraffic } from '@/lib/core/traffic-intelligence'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// مخطط التحقق من البيانات الواردة
const IngestionSchema = z.object({
  segmentId: z.string(),
  devices: z.array(
    z.object({
      lat: z.number(),
      lng: z.number(),
      speed: z.number(),
      timestamp: z.string().datetime(),
    })
  ).min(1),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // التحقق من صحة البيانات
    const validatedData = IngestionSchema.parse(body)
    
    // تحويل البيانات إلى التنسيق المطلوب
    const rawData = {
      segmentId: validatedData.segmentId,
      devices: validatedData.devices.map(d => ({
        lat: d.lat,
        lng: d.lng,
        speed: d.speed,
        timestamp: new Date(d.timestamp),
      })),
    }

    // جلب معلومات المقطع
    const segment = await prisma.roadSegment.findUnique({
      where: { id: rawData.segmentId },
    })

    if (!segment) {
      return NextResponse.json(
        { error: 'المقطع غير موجود' },
        { status: 404 }
      )
    }

    // تطبيق إخفاء الهوية والتجميع
    const anonymizedData = anonymizeData(rawData, segment.length)

    if (!anonymizedData) {
      return NextResponse.json(
        { error: 'البيانات لا تلبي معايير الخصوصية (k-anonymity < 30)' },
        { status: 400 }
      )
    }

    // التحقق من الامتثال للخصوصية
    if (!validatePrivacyCompliance(anonymizedData)) {
      return NextResponse.json(
        { error: 'فشل التحقق من امتثال الخصوصية' },
        { status: 400 }
      )
    }

    // تحليل البيانات
    const analysis = analyzeTraffic(anonymizedData, segment.freeFlowSpeed)

    // حفظ البيانات في قاعدة البيانات
    const trafficData = await prisma.trafficData.create({
      data: {
        segmentId: segment.id,
        timestamp: analysis.timestamp,
        deviceCount: analysis.density * segment.length, // تحويل الكثافة إلى عدد
        avgSpeed: analysis.avgSpeed,
        density: analysis.density,
        congestionIndex: analysis.congestionIndex,
        delayMinutes: analysis.delayMinutes,
        movementDirection: analysis.movementDirection,
        kAnonymity: anonymizedData.kAnonymity,
        isAnonymized: true,
      },
    })

    // تسجيل في سجل الخصوصية
    await prisma.privacyAudit.create({
      data: {
        eventType: 'data_received',
        source: 'telecom_provider',
        kAnonymity: anonymizedData.kAnonymity,
        dataVolume: rawData.devices.length,
        anonymizationStatus: 'success',
        encryptionStatus: 'encrypted',
        accessLevel: 'aggregated',
        logHash: generateLogHash(trafficData.id),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        trafficDataId: trafficData.id,
        congestionIndex: analysis.congestionIndex,
        delayMinutes: analysis.delayMinutes,
        timestamp: trafficData.timestamp,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error ingesting data:', error)
    return NextResponse.json(
      { error: 'فشل في استقبال البيانات' },
      { status: 500 }
    )
  }
}

function generateLogHash(id: string): string {
  // توليد hash بسيط للسجل (في الإنتاج سيستخدم SHA-256)
  return Buffer.from(id + Date.now().toString()).toString('base64').substring(0, 32)
}

