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
    let weatherSources: string[] = [] // لتتبع مصادر البيانات المستخدمة

    // إذا كان هناك تاريخ ووقت مستقبلي، استخدم التنبؤات من مصادر متعددة
    if (date && time) {
      try {
        const targetDate = new Date(`${date}T${time}`)
        const now = new Date()
        const daysDiff = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        
        if (daysDiff > 0 && daysDiff <= 16) {
          // جلب التنبؤات للتاريخ المحدد من جميع المصادر المتاحة
          const forecast = await weatherService.getWeatherForecast({
            lat,
            lng,
            days: daysDiff,
          })
          
          weatherSources.push(forecast.source || 'unknown')
          
          // البحث عن البيانات للتاريخ المحدد في hourly (أكثر دقة)
          if (forecast.hourly && forecast.hourly.length > 0) {
            // البحث عن أقرب ساعة للوقت المحدد
            const targetHour = targetDate.getHours()
            const targetDay = targetDate.toDateString()
            
            const matchingHour = forecast.hourly.find((hour: any) => {
              const hourDate = new Date(hour.timestamp)
              return hourDate.getHours() === targetHour &&
                     hourDate.toDateString() === targetDay
            })
            
            // إذا لم نجد تطابق دقيق، نبحث عن أقرب ساعة
            const closestHour = matchingHour || forecast.hourly.reduce((closest: any, hour: any) => {
              const hourDate = new Date(hour.timestamp)
              const closestDate = closest ? new Date(closest.timestamp) : null
              const targetTime = targetDate.getTime()
              const hourDiff = Math.abs(hourDate.getTime() - targetTime)
              const closestDiff = closestDate ? Math.abs(closestDate.getTime() - targetTime) : Infinity
              return hourDiff < closestDiff ? hour : closest
            }, null)
            
            if (closestHour) {
              weather = {
                current: {
                  temperature: closestHour.temperature || 20,
                  humidity: 70,
                  windSpeed: closestHour.windSpeed || 20,
                  windDirection: 0,
                  visibility: closestHour.visibility || 10000,
                  pressure: 1013,
                  precipitation: closestHour.precipitation || 0,
                  rainRate: closestHour.precipitation || 0,
                  condition: closestHour.condition || 'clear',
                  cloudCover: 50,
                  timestamp: targetDate,
                },
                hourly: forecast.hourly, // حفظ جميع البيانات الساعية
                source: forecast.source,
              }
            }
          }
          
          // إذا لم نجد في hourly، جرب daily
          if (!weather && forecast.daily && forecast.daily.length > 0) {
            const targetDay = forecast.daily.find((day: any) => {
              const dayDate = new Date(day.date)
              return dayDate.toDateString() === targetDate.toDateString()
            })
            
            if (targetDay) {
              weather = {
                current: {
                  temperature: targetDay.high || targetDay.low || 20,
                  humidity: 70,
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
                daily: forecast.daily,
                source: forecast.source,
              }
            }
          }
          
          // حفظ تنبيهات الطقس إن وجدت
          if (forecast.alerts && forecast.alerts.length > 0) {
            weather.alerts = forecast.alerts
          }
        }
      } catch (error) {
        console.warn('Failed to get forecast, trying current weather:', error)
      }
    }

    // إذا لم نحصل على بيانات مستقبلية، استخدم الطقس الحالي من جميع المصادر
    if (!weather) {
      const currentWeather = await weatherService.getCurrentWeather({
        lat,
        lng,
      })
      weather = currentWeather
      weatherSources.push(currentWeather.source || 'unknown')
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
        // بيانات إضافية من مصادر متعددة
        source: weather.source || weatherSources.join(', ') || 'unknown',
        hourlyForecast: weather.hourly || null, // بيانات ساعية للفترة القادمة
        dailyForecast: weather.daily || null, // بيانات يومية للفترة القادمة
        alerts: weather.alerts || null, // تنبيهات الطقس
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

