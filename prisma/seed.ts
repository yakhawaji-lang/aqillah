/**
 * Seed script for initial road segments data
 * سكريبت لإنشاء بيانات أولية للمقاطع الطرقية
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // بيانات المقاطع الطرقية للرياض
  const riyadhSegments = [
    {
      roadName: 'طريق الملك فهد',
      city: 'الرياض',
      direction: 'شمال-جنوب',
      startLat: 24.7136,
      startLng: 46.6753,
      endLat: 24.7500,
      endLng: 46.7000,
      length: 5.2,
      speedLimit: 80,
      roadType: 'highway',
    },
    {
      roadName: 'طريق العليا',
      city: 'الرياض',
      direction: 'شرق-غرب',
      startLat: 24.6800,
      startLng: 46.6200,
      endLat: 24.6800,
      endLng: 46.7500,
      length: 8.5,
      speedLimit: 60,
      roadType: 'arterial',
    },
    {
      roadName: 'طريق الدائري الشرقي',
      city: 'الرياض',
      direction: 'دائري',
      startLat: 24.7000,
      startLng: 46.8000,
      endLat: 24.7200,
      endLng: 46.8200,
      length: 12.3,
      speedLimit: 100,
      roadType: 'highway',
    },
    {
      roadName: 'طريق الملك عبدالعزيز',
      city: 'الرياض',
      direction: 'شمال-جنوب',
      startLat: 24.6500,
      startLng: 46.7000,
      endLat: 24.7500,
      endLng: 46.7000,
      length: 11.1,
      speedLimit: 80,
      roadType: 'highway',
    },
    {
      roadName: 'طريق الخليج',
      city: 'الرياض',
      direction: 'شرق-غرب',
      startLat: 24.7200,
      startLng: 46.6000,
      endLat: 24.7200,
      endLng: 46.7500,
      length: 9.8,
      speedLimit: 60,
      roadType: 'arterial',
    },
  ]

  // بيانات المقاطع الطرقية لجدة
  const jeddahSegments = [
    {
      roadName: 'الكورنيش الشمالي',
      city: 'جدة',
      direction: 'شمال-جنوب',
      startLat: 21.4858,
      startLng: 39.1925,
      endLat: 21.5500,
      endLng: 39.2000,
      length: 7.2,
      speedLimit: 80,
      roadType: 'coastal',
    },
    {
      roadName: 'طريق الملك عبدالله',
      city: 'جدة',
      direction: 'شرق-غرب',
      startLat: 21.5000,
      startLng: 39.1500,
      endLat: 21.5000,
      endLng: 39.2500,
      length: 8.9,
      speedLimit: 80,
      roadType: 'highway',
    },
  ]

  // بيانات المقاطع الطرقية للدمام
  const dammamSegments = [
    {
      roadName: 'طريق الخليج',
      city: 'الدمام',
      direction: 'شرق-غرب',
      startLat: 26.4207,
      startLng: 50.0888,
      endLat: 26.4207,
      endLng: 50.1500,
      length: 6.5,
      speedLimit: 60,
      roadType: 'arterial',
    },
  ]

  // بيانات المقاطع الطرقية للمدينة المنورة
  const medinaSegments = [
    {
      roadName: 'طريق قباء',
      city: 'المدينة المنورة',
      direction: 'شمال-جنوب',
      startLat: 24.4681,
      startLng: 39.6142,
      endLat: 24.5000,
      endLng: 39.6142,
      length: 3.5,
      speedLimit: 60,
      roadType: 'arterial',
    },
  ]

  // بيانات المقاطع الطرقية للخبر
  const khobarSegments = [
    {
      roadName: 'الكورنيش',
      city: 'الخبر',
      direction: 'شمال-جنوب',
      startLat: 26.2172,
      startLng: 50.1971,
      endLat: 26.2500,
      endLng: 50.2000,
      length: 4.2,
      speedLimit: 60,
      roadType: 'coastal',
    },
  ]

  // بيانات المقاطع الطرقية لأبها
  const abhaSegments = [
    {
      roadName: 'طريق الملك فهد',
      city: 'أبها',
      direction: 'شمال-جنوب',
      startLat: 18.2164,
      startLng: 42.5044,
      endLat: 18.2500,
      endLng: 42.5100,
      length: 3.8,
      speedLimit: 60,
      roadType: 'arterial',
    },
  ]

  // بيانات المقاطع الطرقية لخميس مشيط
  const khamisSegments = [
    {
      roadName: 'طريق الملك عبدالعزيز',
      city: 'خميس مشيط',
      direction: 'شرق-غرب',
      startLat: 18.3000,
      startLng: 42.7300,
      endLat: 18.3000,
      endLng: 42.8000,
      length: 6.2,
      speedLimit: 60,
      roadType: 'arterial',
    },
  ]

  const allSegments = [
    ...riyadhSegments,
    ...jeddahSegments,
    ...dammamSegments,
    ...medinaSegments,
    ...khobarSegments,
    ...abhaSegments,
    ...khamisSegments,
  ]

  console.log(`📊 Creating ${allSegments.length} road segments...`)

  // حذف البيانات القديمة (اختياري)
  // await prisma.roadSegment.deleteMany({})

  // إنشاء المقاطع الطرقية
  for (const segment of allSegments) {
    try {
      await prisma.roadSegment.create({
        data: segment,
      })
      console.log(`✅ Created: ${segment.roadName} (${segment.city})`)
    } catch (error: any) {
      // تجاهل الأخطاء إذا كان المقطع موجوداً بالفعل
      if (error.code === 'P2002') {
        console.log(`⏭️  Skipped (already exists): ${segment.roadName} (${segment.city})`)
      } else {
        console.error(`❌ Error creating ${segment.roadName}:`, error.message)
      }
    }
  }

  console.log('✅ Seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

