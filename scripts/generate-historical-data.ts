import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * توليد بيانات تاريخية لمدة سنة كاملة
 * هذا السكريبت يولد بيانات واقعية لمحاكاة سنة كاملة من البيانات
 */

// أنماط ازدحام حسب الوقت من اليوم
function getCongestionByTime(hour: number, dayOfWeek: number): number {
  // ذروة صباحية: 7-9 صباحاً
  if (hour >= 7 && hour <= 9) {
    return 70 + Math.random() * 20 // 70-90
  }
  // ذروة مسائية: 5-7 مساءً
  if (hour >= 17 && hour <= 19) {
    return 65 + Math.random() * 25 // 65-90
  }
  // نهاية الأسبوع: ازدحام أقل
  if (dayOfWeek === 5 || dayOfWeek === 6) { // الجمعة والسبت
    return 20 + Math.random() * 30 // 20-50
  }
  // أوقات الليل: ازدحام منخفض
  if (hour >= 22 || hour <= 5) {
    return 10 + Math.random() * 15 // 10-25
  }
  // أوقات عادية
  return 30 + Math.random() * 30 // 30-60
}

// أنماط موسمية (رمضان، مواسم سياحية، إلخ)
function getSeasonalFactor(month: number): number {
  // رمضان (تقريبي - شهر 9)
  if (month === 9) {
    return 1.3 // زيادة 30%
  }
  // موسم الحج (شهر 12)
  if (month === 12) {
    return 1.2 // زيادة 20%
  }
  // الصيف (6-8)
  if (month >= 6 && month <= 8) {
    return 0.9 // انخفاض 10%
  }
  return 1.0
}

async function generateHistoricalData() {
  console.log('🚀 بدء توليد البيانات التاريخية (سنة كاملة)...')

  // الحصول على جميع المقاطع
  const segments = await prisma.roadSegment.findMany()
  
  if (segments.length === 0) {
    console.log('❌ لا توجد مقاطع. يرجى تشغيل npm run db:seed أولاً')
    return
  }

  console.log(`📊 تم العثور على ${segments.length} مقطع`)

  const startDate = new Date()
  startDate.setFullYear(startDate.getFullYear() - 1) // سنة مضت
  startDate.setHours(0, 0, 0, 0)

  const endDate = new Date()
  endDate.setHours(23, 59, 59, 999)

  // توليد بيانات كل ساعة لمدة سنة
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  let processedDays = 0

  console.log(`📅 سيتم توليد بيانات لـ ${totalDays} يوم (كل ساعة)`)

  for (let day = 0; day < totalDays; day++) {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + day)

    // تخطي بعض الأيام لتسريع العملية (كل 3 أيام)
    if (day % 3 !== 0 && day > 0) continue

    const month = currentDate.getMonth() + 1
    const dayOfWeek = currentDate.getDay()
    const seasonalFactor = getSeasonalFactor(month)

    // توليد بيانات كل ساعتين
    for (let hour = 0; hour < 24; hour += 2) {
      const timestamp = new Date(currentDate)
      timestamp.setHours(hour, Math.floor(Math.random() * 60), 0, 0)

      for (const segment of segments) {
        const baseCongestion = getCongestionByTime(hour, dayOfWeek)
        const congestionIndex = Math.min(100, Math.max(0, Math.round(baseCongestion * seasonalFactor + (Math.random() - 0.5) * 20)))

        const freeFlowSpeed = segment.freeFlowSpeed || 60
        const avgSpeed = freeFlowSpeed * (1 - congestionIndex / 100) + Math.random() * 5
        const deviceCount = Math.max(30, Math.round(50 + congestionIndex * 2 + Math.random() * 30))
        const density = deviceCount / (segment.length || 1)
        const delayMinutes = (congestionIndex / 100) * 10 + Math.random() * 3

        try {
          await prisma.trafficData.create({
            data: {
              segmentId: segment.id,
              timestamp,
              deviceCount,
              avgSpeed: Math.round(avgSpeed * 10) / 10,
              density: Math.round(density * 10) / 10,
              congestionIndex,
              delayMinutes: Math.round(delayMinutes * 10) / 10,
              movementDirection: Math.random() * 360,
              kAnonymity: Math.max(30, deviceCount),
              isAnonymized: true,
            },
          })
        } catch (error) {
          // تجاهل الأخطاء (مثل البيانات المكررة)
        }
      }
    }

    processedDays++
    if (processedDays % 10 === 0) {
      console.log(`   ✅ تم معالجة ${processedDays} يوم...`)
    }
  }

  console.log(`✅ تم توليد البيانات التاريخية لـ ${processedDays} يوم`)
  
  // إحصائيات
  const stats = {
    trafficData: await prisma.trafficData.count(),
    segments: segments.length,
  }

  console.log(`\n📊 الإحصائيات النهائية:`)
  console.log(`   - بيانات مرورية: ${stats.trafficData.toLocaleString()}`)
  console.log(`   - مقاطع: ${stats.segments}`)
  console.log(`   - متوسط بيانات لكل مقطع: ${Math.round(stats.trafficData / stats.segments)}`)

  await prisma.$disconnect()
}

generateHistoricalData()
  .catch((error) => {
    console.error('❌ خطأ في توليد البيانات التاريخية:', error)
    process.exit(1)
  })

