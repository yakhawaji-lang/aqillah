/**
 * Weather Impact API - تأثير الطقس على القيادة
 * يستخدم البيانات الوهمية من قاعدة البيانات فقط
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
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

    let weather: any = null
    const targetDate = date && time ? new Date(`${date}T${time}`) : new Date()
    const now = new Date()

    // البحث عن بيانات الطقس الأقرب للإحداثيات المحددة
    // البحث في نطاق 0.1 درجة (حوالي 11 كم)
    const weatherData = await prisma.weatherData.findFirst({
      where: {
        lat: {
          gte: lat - 0.1,
          lte: lat + 0.1,
        },
        lng: {
          gte: lng - 0.1,
          lte: lng + 0.1,
        },
        timestamp: {
          // إذا كان تاريخ مستقبلي، نبحث عن بيانات قريبة من التاريخ المحدد
          ...(date && time ? {
            gte: new Date(targetDate.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
          } : {
            gte: new Date(now.getTime() - 2 * 60 * 60 * 1000), // آخر ساعتين
          }),
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    })

    if (weatherData) {
      // تحويل بيانات قاعدة البيانات إلى تنسيق موحد
      weather = {
        current: {
          temperature: weatherData.temperature,
          humidity: weatherData.humidity,
          windSpeed: weatherData.windSpeed,
          windDirection: weatherData.windDirection,
          visibility: weatherData.visibility,
          pressure: weatherData.pressure,
          precipitation: weatherData.precipitation,
          precipitationProbability: weatherData.precipitationProbability || 0,
          rainRate: weatherData.rainRate,
          condition: weatherData.condition,
          cloudCover: weatherData.cloudCover || 50,
          timestamp: weatherData.timestamp,
        },
        source: 'database',
      }

      // إذا كان هناك توقعات ساعية في البيانات
      if (weatherData.hourlyForecast) {
        const hourly = weatherData.hourlyForecast as any
        weather.hourly = Array.isArray(hourly) ? hourly : []
      }

      // إذا كان هناك توقعات يومية في البيانات
      if (weatherData.dailyForecast) {
        const daily = weatherData.dailyForecast as any
        weather.daily = Array.isArray(daily) ? daily : []
      }

      // إذا كان هناك تنبيهات طقس في البيانات
      if (weatherData.alerts) {
        const alerts = weatherData.alerts as any
        weather.alerts = Array.isArray(alerts) ? alerts : []
      }
    } else {
      // إذا لم نجد بيانات، نستخدم بيانات افتراضية واقعية
      const cityCoordinates: Record<string, { lat: number; lng: number; temp: number; humidity: number }> = {
        'الرياض': { lat: 24.7136, lng: 46.6753, temp: 25, humidity: 30 },
        'جدة': { lat: 21.4858, lng: 39.1925, temp: 30, humidity: 60 },
        'الدمام': { lat: 26.4207, lng: 50.0888, temp: 28, humidity: 50 },
      }

      // تحديد المدينة الأقرب
      let closestCity = 'الرياض'
      let minDistance = Infinity
      for (const [city, coords] of Object.entries(cityCoordinates)) {
        const distance = Math.sqrt(
          Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2)
        )
        if (distance < minDistance) {
          minDistance = distance
          closestCity = city
        }
      }

      const defaultWeather = cityCoordinates[closestCity]
      weather = {
        current: {
          temperature: defaultWeather.temp + (Math.random() - 0.5) * 5,
          humidity: defaultWeather.humidity + (Math.random() - 0.5) * 20,
          windSpeed: 10 + Math.random() * 15,
          windDirection: Math.random() * 360,
          visibility: 8000 + Math.random() * 2000,
          pressure: 1010 + Math.random() * 10,
          precipitation: 0,
          precipitationProbability: 0,
          rainRate: 0,
          condition: 'clear',
          cloudCover: 20 + Math.random() * 30,
          timestamp: targetDate,
        },
        source: 'default',
      }
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
        condition: currentWeather.condition || 'غير محدد',
        temperature: currentWeather.temperature || null,
        precipitation: currentWeather.precipitation || 0,
        precipitationProbability: currentWeather.precipitationProbability || 0,
        visibility: currentWeather.visibility || null,
        windSpeed: currentWeather.windSpeed || null,
        windDirection: currentWeather.windDirection || null,
        humidity: currentWeather.humidity || null,
        pressure: currentWeather.pressure || null,
        cloudCover: currentWeather.cloudCover || null,
        timestamp: currentWeather.timestamp || new Date(),
        // بيانات إضافية
        source: weather.source || 'database',
        hourlyForecast: weather.hourly || null,
        dailyForecast: weather.daily || null,
        alerts: weather.alerts || null,
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

