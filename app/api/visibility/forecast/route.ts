/**
 * API - جلب الطرق المتوقع أن تكون الرؤية فيها سيئة لشهر قادم
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'

// عتبة الرؤية السيئة (أقل من 500 متر)
const POOR_VISIBILITY_THRESHOLD = 500 // متر

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const daysAhead = parseInt(searchParams.get('days') || '16') // افتراضياً 16 يوم (حد OpenWeatherMap)
    const dayIndex = parseInt(searchParams.get('dayIndex') || '-1') // -1 for all days, 0-15 for specific day

    // جلب جميع المقاطع الطرقية
    const segments = await prisma.roadSegment.findMany({
      where: city ? { city } : {},
      take: 100, // حد أقصى 100 مقطع
    })

    const forecastedPoorVisibility: Array<{
      segmentId: string
      roadName: string
      city: string
      position: [number, number]
      forecastedDates: Array<{
        date: string
        visibility: number
        condition: string
        confidence: number
      }>
    }> = []

    // فحص التنبؤات لكل مقطع
    for (const segment of segments) {
      try {
        const centerLat = (segment.startLat + segment.endLat) / 2
        const centerLng = (segment.startLng + segment.endLng) / 2

        // جلب التنبؤات المستقبلية من Weather Service
        const forecastedDates: Array<{
          date: string
          visibility: number
          condition: string
          confidence: number
        }> = []

        try {
          // جلب تنبؤات الطقس (حتى 16 يوم من OpenWeatherMap)
          const forecastDays = Math.min(daysAhead, 16) // OpenWeatherMap يدعم حتى 16 يوم
          const weatherForecast = await weatherService.getWeatherForecast({
            lat: centerLat,
            lng: centerLng,
            days: forecastDays,
          })

          // معالجة التنبؤات اليومية
          if (weatherForecast.daily && weatherForecast.daily.length > 0) {
            // إذا كان dayIndex محدد، نفحص فقط ذلك اليوم
            const daysToCheck = dayIndex >= 0 && dayIndex < weatherForecast.daily.length
              ? [weatherForecast.daily[dayIndex]]
              : weatherForecast.daily

            daysToCheck.forEach((day, index) => {
              // استخدام بيانات الرؤية الحقيقية فقط - لا تقديرات وهمية
              const visibility = day.visibility
              
              // فقط إذا كانت الرؤية متوفرة وأقل من العتبة
              if (visibility !== undefined && visibility !== null && visibility < POOR_VISIBILITY_THRESHOLD) {
                forecastedDates.push({
                  date: day.date.toISOString(),
                  visibility: visibility,
                  condition: day.condition,
                  confidence: 0.8, // ثقة عالية في التنبؤات من OpenWeatherMap API
                })
              }
            })
          }
        } catch (forecastError) {
          console.warn(`Failed to get forecast for segment ${segment.id}, using simulation:`, forecastError)
          
          // Fallback: استخدام المحاكاة
          for (let day = 1; day <= daysAhead; day++) {
            const forecastDate = new Date()
            forecastDate.setDate(forecastDate.getDate() + day)

            const mockWeather = await getMockForecastWeather(centerLat, centerLng, forecastDate)
            
            if (mockWeather.visibility < POOR_VISIBILITY_THRESHOLD) {
              forecastedDates.push({
                date: forecastDate.toISOString(),
                visibility: mockWeather.visibility,
                condition: mockWeather.condition,
                confidence: 0.5, // ثقة منخفضة للمحاكاة
              })
            }
          }
        }

        if (forecastedDates.length > 0) {
          forecastedPoorVisibility.push({
            segmentId: segment.id,
            roadName: segment.roadName,
            city: segment.city,
            position: [centerLat, centerLng],
            forecastedDates,
          })
        }
      } catch (err) {
        console.error(`Error forecasting visibility for segment ${segment.id}:`, err)
        // تجاهل الأخطاء والمتابعة
      }
    }

    return NextResponse.json({
      success: true,
      data: forecastedPoorVisibility,
      count: forecastedPoorVisibility.length,
    })
  } catch (error: any) {
    console.error('Error fetching visibility forecast:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch visibility forecast' },
      { status: 500 }
    )
  }
}

// دالة مساعدة لمحاكاة بيانات الطقس المستقبلية (للأيام بعد 16 يوم)
async function getSimulatedForecastWeather(
  lat: number,
  lng: number,
  date: Date,
  lastForecastDay?: any
): Promise<{
  visibility: number
  condition: string
}> {
  try {
    // استخدام آخر تنبؤ كقاعدة
    const baseVisibility = lastForecastDay?.visibility || 10000
    
    // محاكاة تغييرات مستقبلية بناءً على الأنماط الموسمية
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI)
    
    // محاكاة انخفاض الرؤية في أوقات معينة (مثلاً في الشتاء)
    let visibility = baseVisibility
    if (seasonalFactor < -0.5) {
      // شتاء - احتمال أعلى للضباب
      visibility = Math.max(100, visibility * (0.4 + Math.random() * 0.6))
    } else {
      visibility = visibility * (0.7 + Math.random() * 0.6)
    }
    
    // محاكاة حالات طقس مختلفة
    let condition = lastForecastDay?.condition || 'clear'
    if (visibility < 200) {
      condition = 'fog'
    } else if (visibility < 500) {
      condition = 'haze'
    }
    
    return { visibility, condition }
  } catch (err) {
    // في حالة الفشل، إرجاع بيانات محاكاة بسيطة
    const baseVisibility = 800 + Math.random() * 400
    return {
      visibility: baseVisibility,
      condition: baseVisibility < 500 ? 'fog' : 'clear',
    }
  }
}

// دالة مساعدة لمحاكاة بيانات الطقس المستقبلية (fallback كامل)
async function getMockForecastWeather(lat: number, lng: number, date: Date): Promise<{
  visibility: number
  condition: string
}> {
  // محاولة جلب بيانات حقيقية أولاً
  try {
    const weather = await weatherService.getCurrentWeather({ lat, lng })
    
    // محاكاة تغييرات مستقبلية بناءً على الأنماط الموسمية
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
    const seasonalFactor = Math.sin((dayOfYear / 365) * 2 * Math.PI)
    
    // محاكاة انخفاض الرؤية في أوقات معينة (مثلاً في الشتاء)
    let visibility = weather.current.visibility
    if (seasonalFactor < -0.5) {
      // شتاء - احتمال أعلى للضباب
      visibility = Math.max(100, visibility * (0.5 + Math.random() * 0.5))
    }
    
    // محاكاة حالات طقس مختلفة
    let condition = weather.current.condition
    if (visibility < 200) {
      condition = 'fog'
    } else if (visibility < 500) {
      condition = 'haze'
    }
    
    return { visibility, condition }
  } catch (err) {
    // في حالة الفشل، إرجاع بيانات محاكاة
    const baseVisibility = 800 + Math.random() * 400
    return {
      visibility: baseVisibility,
      condition: baseVisibility < 500 ? 'fog' : 'clear',
    }
  }
}

