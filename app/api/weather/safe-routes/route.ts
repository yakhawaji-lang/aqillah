/**
 * API - جلب الطرق الآمنة وغير الآمنة لجميع أحوال الطقس خلال 16 يوم
 * يستخدم بيانات واقعية من Weather API بدلاً من قاعدة البيانات
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { WeatherAlertsChecker, WeatherDayData } from '@/lib/services/weather-alerts'

// عدد الأيام للتنبؤ
const FORECAST_DAYS = 16

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const city = request.nextUrl.searchParams.get('city')

    // إحداثيات المدن الرئيسية
    const cityCoordinates: Record<string, { lat: number; lng: number; bounds: { ne: { lat: number; lng: number }, sw: { lat: number; lng: number } } }> = {
      'الرياض': {
        lat: 24.7136,
        lng: 46.6753,
        bounds: { ne: { lat: 24.8500, lng: 46.8500 }, sw: { lat: 24.5500, lng: 46.5000 } }
      },
      'جدة': {
        lat: 21.4858,
        lng: 39.1925,
        bounds: { ne: { lat: 21.7000, lng: 39.3000 }, sw: { lat: 21.2000, lng: 39.0000 } }
      },
      'الدمام': {
        lat: 26.4207,
        lng: 50.0888,
        bounds: { ne: { lat: 26.5000, lng: 50.2000 }, sw: { lat: 26.3000, lng: 50.0000 } }
      },
      'المدينة المنورة': {
        lat: 24.4681,
        lng: 39.6142,
        bounds: { ne: { lat: 24.5500, lng: 39.7000 }, sw: { lat: 24.4000, lng: 39.5000 } }
      },
      'الخبر': {
        lat: 26.2172,
        lng: 50.1971,
        bounds: { ne: { lat: 26.3000, lng: 50.3000 }, sw: { lat: 26.1000, lng: 50.1000 } }
      },
      'أبها': {
        lat: 18.2164,
        lng: 42.5044,
        bounds: { ne: { lat: 18.3000, lng: 42.6000 }, sw: { lat: 18.1000, lng: 42.4000 } }
      },
      'خميس مشيط': {
        lat: 18.3000,
        lng: 42.7300,
        bounds: { ne: { lat: 18.4000, lng: 42.8500 }, sw: { lat: 18.2000, lng: 42.6000 } }
      },
    }

    const cityInfo = city ? cityCoordinates[city] : cityCoordinates['الرياض']
    if (!cityInfo) {
      return NextResponse.json({
        success: true,
        data: {
          safeRoutes: [],
          unsafeRoutes: [],
          summary: {
            totalRoutes: 0,
            safeRoutesCount: 0,
            unsafeRoutesCount: 0,
            forecastDays: FORECAST_DAYS,
          },
        },
      })
    }

    // إنشاء شبكة من النقاط لتغطية المدينة
    const samplePoints: Array<{ lat: number; lng: number; roadName: string }> = []
    const gridSize = 5 // 5x5 grid = 25 نقطة
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = cityInfo.bounds.sw.lat + 
          (cityInfo.bounds.ne.lat - cityInfo.bounds.sw.lat) * (i / (gridSize - 1))
        const lng = cityInfo.bounds.sw.lng + 
          (cityInfo.bounds.ne.lng - cityInfo.bounds.sw.lng) * (j / (gridSize - 1))
        
        samplePoints.push({
          lat,
          lng,
          roadName: `منطقة ${i + 1}-${j + 1}`,
        })
      }
    }

    console.log(`📊 Analyzing ${samplePoints.length} points in ${city || 'الرياض'}`)

    const safeRoutes: Array<{
      segmentId: string
      roadName: string
      city: string
      position: [number, number]
      safetyScore: number
      allDaysSafe: boolean
    }> = []

    const unsafeRoutes: Array<{
      segmentId: string
      roadName: string
      city: string
      position: [number, number]
      dangerousDays: Array<{
        date: string
        hazards: Array<{
          type: string
          severity: 'low' | 'medium' | 'high' | 'critical'
          message: string
          value: number
        }>
      }>
      totalDangerousDays: number
    }> = []

    // فحص كل نقطة عينة
    for (const point of samplePoints) {
      try {
        const centerLat = point.lat
        const centerLng = point.lng

        // جلب تنبؤات الطقس مع معالجة الأخطاء
        let weatherForecast
        try {
          weatherForecast = await weatherService.getWeatherForecast({
            lat: centerLat,
            lng: centerLng,
            days: FORECAST_DAYS,
          })
        } catch (weatherError: any) {
          console.warn(`Failed to get weather forecast for point ${point.lat}, ${point.lng}:`, weatherError.message)
          // تخطي هذه النقطة والمتابعة
          continue
        }

        if (!weatherForecast || !weatherForecast.daily || weatherForecast.daily.length === 0) {
          console.warn(`No forecast data for point ${point.lat}, ${point.lng}`)
          continue
        }

        const dangerousDays: Array<{
          date: string
          hazards: Array<{
            type: string
            severity: 'low' | 'medium' | 'high' | 'critical'
            message: string
            value: number
          }>
        }> = []

        let safeDaysCount = 0

        // فحص كل يوم في التنبؤ باستخدام نظام التحذيرات الشامل
        weatherForecast.daily.forEach((day) => {
          // تحويل بيانات اليوم إلى تنسيق WeatherDayData
          const dayData: WeatherDayData = {
            temperature: (day.high + day.low) / 2, // متوسط الحرارة
            temp_min: day.low,
            temp_max: day.high,
            humidity: undefined, // OpenWeatherMap Forecast API لا يوفر الرطوبة اليومية
            pressure: undefined, // OpenWeatherMap Forecast API لا يوفر الضغط اليومي
            windSpeed: day.windSpeed, // بالفعل بالكيلومتر/ساعة
            visibility: day.visibility !== undefined ? day.visibility * 1000 : undefined, // تحويل من km إلى m
            precipitation: day.precipitation,
            condition: day.condition,
          }

          // استخدام نظام التحذيرات الشامل
          const alerts = WeatherAlertsChecker.checkAllAlerts(dayData)

          // تحويل التحذيرات إلى تنسيق hazards
          const hazards = alerts.map(alert => ({
            type: alert.type,
            severity: alert.severity,
            message: alert.message,
            value: alert.value,
            icon: alert.icon,
          }))

          if (hazards.length > 0) {
            dangerousDays.push({
              date: day.date.toISOString(),
              hazards,
            })
          } else {
            safeDaysCount++
          }
        })

        // حساب درجة الأمان (نسبة الأيام الآمنة)
        const safetyScore = (safeDaysCount / FORECAST_DAYS) * 100
        const allDaysSafe = dangerousDays.length === 0

        if (allDaysSafe) {
          // منطقة آمنة لجميع الأيام
          safeRoutes.push({
            segmentId: `point-${point.lat}-${point.lng}`,
            roadName: point.roadName,
            city: city || 'الرياض',
            position: [centerLat, centerLng],
            safetyScore,
            allDaysSafe: true,
          })
        } else {
          // منطقة غير آمنة في بعض الأيام
          unsafeRoutes.push({
            segmentId: `point-${point.lat}-${point.lng}`,
            roadName: point.roadName,
            city: city || 'الرياض',
            position: [centerLat, centerLng],
            dangerousDays,
            totalDangerousDays: dangerousDays.length,
          })
        }
      } catch (err) {
        console.error(`Error checking weather safety for point ${point.lat}, ${point.lng}:`, err)
        // تجاهل الأخطاء والمتابعة
      }
    }

    console.log(`✅ Analysis complete: ${safeRoutes.length} safe routes, ${unsafeRoutes.length} unsafe routes`)

    return NextResponse.json({
      success: true,
      data: {
        safeRoutes: safeRoutes || [],
        unsafeRoutes: unsafeRoutes || [],
        summary: {
          totalRoutes: samplePoints.length,
          safeRoutesCount: safeRoutes.length,
          unsafeRoutesCount: unsafeRoutes.length,
          forecastDays: FORECAST_DAYS,
        },
      },
    })
  } catch (error: any) {
    console.error('Error fetching weather-safe routes:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather-safe routes' },
      { status: 500 }
    )
  }
}
