import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('بدء إضافة البيانات التجريبية...')

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
    {
      roadName: 'طريق الكورنيش',
      city: 'جدة',
      direction: 'شمال',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.5000,
      endLng: 39.2100,
      length: 6.0,
    },
    {
      roadName: 'طريق الملك عبدالعزيز',
      city: 'جدة',
      direction: 'جنوب',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.4700,
      endLng: 39.1750,
      length: 4.2,
    },
  ]

  for (const segment of segments) {
    const created = await prisma.roadSegment.upsert({
      where: {
        id: `${segment.city}-${segment.roadName}-${segment.direction}`,
      },
      update: {},
      create: segment,
    })

    // إضافة بيانات مرور تجريبية
    const congestionIndices = [25, 45, 65, 85, 30, 50, 70]
    const speeds = [55, 45, 35, 20, 50, 40, 30]
    const densities = [15, 25, 35, 50, 20, 30, 40]

    for (let i = 0; i < 7; i++) {
      const timestamp = new Date()
      timestamp.setMinutes(timestamp.getMinutes() - i * 5)

      await prisma.trafficData.create({
        data: {
          segmentId: created.id,
          timestamp,
          deviceCount: Math.floor(Math.random() * 1000) + 500,
          avgSpeed: speeds[i],
          density: densities[i],
          congestionIndex: congestionIndices[i],
          delayMinutes: Math.round((congestionIndices[i] / 100) * 15 * 10) / 10, // حساب التأخير بناءً على مؤشر الازدحام
          movementDirection: Math.random() * 360,
          kAnonymity: Math.floor(Math.random() * 1000) + 500,
          isAnonymized: true,
        },
      })
    }

    // إضافة تنبؤات تجريبية
    const futureTime = new Date()
    futureTime.setMinutes(futureTime.getMinutes() + 20)

    const predictedIndex = Math.floor(Math.random() * 40) + 60
    await prisma.prediction.create({
      data: {
        segmentId: created.id,
        predictedAt: new Date(),
        predictedFor: futureTime,
        predictedIndex,
        predictedDelayMinutes: Math.round((predictedIndex / 100) * 15 * 10) / 10,
        confidence: 0.75 + Math.random() * 0.2,
        modelType: 'temporal',
        seasonalityFactor: 1.0,
        factors: {
          timeOfDay: 'morning',
          dayOfWeek: 'sunday',
          historicalPattern: 'high',
        },
      },
    })

    // إضافة تنبيهات تجريبية للبعض
    if (Math.random() > 0.5) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 2)

      await prisma.alert.create({
        data: {
          segmentId: created.id,
          type: congestionIndices[0] > 70 ? 'congestion' : 'event',
          severity: congestionIndices[0] > 80 ? 'high' : 'medium',
          message: `ازدحام متوقع على ${segment.roadName} - اتجاه ${segment.direction}`,
          expiresAt,
          isActive: true,
          alternativeRoute: {
            coordinates: [
              [segment.startLat, segment.startLng],
              [segment.endLat + 0.01, segment.endLng + 0.01],
              [segment.endLat, segment.endLng],
            ],
            distance: segment.length * 1.2,
            estimatedTime: Math.round((segment.length * 1.2 / 40) * 60),
          },
        },
      })
    }
  }

  console.log('✅ تم إضافة البيانات التجريبية بنجاح!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

