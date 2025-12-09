/**
 * Weather Impact API - تأثير الطقس على القيادة
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { weatherDrivingAssistant } from '@/lib/services/weather-driving-assistant'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const date = searchParams.get('date') // تاريخ مستقبلي (YYYY-MM-DD)
    const time = searchParams.get('time') // وقت مستقبلي (HH:MM)

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    let weather: any

    // إذا كان هناك تاريخ ووقت مستقبلي، استخدم التنبؤات
    if (date && time) {
      try {
        const targetDate = new Date(`${date}T${time}`)
        const now = new Date()
        const daysDiff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff > 0 && daysDiff <= 16) {
          // جلب التنبؤات للتاريخ المحدد
          const forecast = await weatherService.getWeatherForecast({
            lat,
            lng,
            days: daysDiff,
          })
          
          // البحث عن البيانات للتاريخ المحدد
          if (forecast.daily && forecast.daily.length > 0) {
            const targetDay = forecast.daily.find((day: any) => {
              const dayDate = new Date(day.date)
              return dayDate.toDateString() === targetDate.toDateString()
            })
            
            if (targetDay) {
              weather = {
                current: {
                  temperature: targetDay.high || targetDay.low || 20,
                  humidity: 70, // افتراضي
                  windSpeed: targetDay.windSpeed || 20,
                  windDirection: 0,
                  visibility: targetDay.visibility || 10000,
                  pressure: 1013,
                  precipitation: targetDay.precipitation || 0,
                  rainRate: targetDay.precipitation || 0,
                  condition: targetDay.condition || 'clear',
                  cloudCover: 50,
                  timestamp: targetDate,
                },
              }
            }
          }
          
          // إذا لم نجد في daily، جرب hourly
          if (!weather && forecast.hourly && forecast.hourly.length > 0) {
            const targetHour = forecast.hourly.find((hour: any) => {
              const hourDate = new Date(hour.timestamp)
              return hourDate.getHours() === targetDate.getHours() &&
                     hourDate.toDateString() === targetDate.toDateString()
            })
            
            if (targetHour) {
              weather = {
                current: {
                  temperature: targetHour.temperature || 20,
                  humidity: 70,
                  windSpeed: targetHour.windSpeed || 20,
                  windDirection: 0,
                  visibility: targetHour.visibility || 10000,
                  pressure: 1013,
                  precipitation: targetHour.precipitation || 0,
                  rainRate: targetHour.precipitation || 0,
                  condition: targetHour.condition || 'clear',
                  cloudCover: 50,
                  timestamp: targetDate,
                },
              }
            }
          }
        }
      } catch (error) {
        console.warn('Failed to get forecast, using current weather:', error)
      }
    }

    // إذا لم نحصل على بيانات مستقبلية، استخدم الطقس الحالي
    if (!weather) {
      weather = await weatherService.getCurrentWeather({
        lat,
        lng,
      })
    }

    // Analyze impact
    const impact = weatherDrivingAssistant.analyze(weather.current || weather)

    // إرجاع بيانات الطقس الكاملة مع التأثير
    const currentWeather = weather.current || weather
    
    return NextResponse.json({
      success: true,
      data: {
        ...impact,
        // بيانات الطقس الأساسية
        condition: currentWeather.condition || currentWeather.weather || 'غير محدد',
        temperature: currentWeather.temperature || currentWeather.temp || null,
        precipitation: currentWeather.precipitation || currentWeather.rain || currentWeather.rainfall || 0,
        visibility: currentWeather.visibility || currentWeather.vis || null,
        windSpeed: currentWeather.windSpeed || currentWeather.wind?.speed || currentWeather.ws || null,
        windDirection: currentWeather.windDirection || currentWeather.wind?.direction || null,
        humidity: currentWeather.humidity || null,
        pressure: currentWeather.pressure || null,
        cloudCover: currentWeather.cloudCover || currentWeather.clouds || null,
        timestamp: currentWeather.timestamp || new Date(),
      },
    })
  } catch (error: any) {
    console.error('Error analyzing weather impact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze weather impact' },
      { status: 500 }
    )
  }
}

