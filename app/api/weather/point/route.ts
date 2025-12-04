/**
 * Weather API - استعلام الطقس لنقطة محددة
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')
    const units = (searchParams.get('units') as 'metric' | 'imperial') || 'metric'

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Get weather data
    let weather
    try {
      weather = await weatherService.getCurrentWeather({
        lat,
        lng,
        units,
      })
    } catch (error: any) {
      console.error('Weather service error:', error)
      // No mock data - return error if API fails
      return NextResponse.json(
        { 
          error: 'Failed to fetch weather data from API. No fake data will be returned.',
          details: error.message 
        },
        { status: 500 }
      )
    }

    // Check for alerts
    const alerts = weatherService.checkWeatherAlerts(weather.current)

    // Save to database (optional, for historical tracking)
    try {
      await prisma.weatherData.create({
        data: {
          lat,
          lng,
          timestamp: weather.current.timestamp,
          temperature: weather.current.temperature,
          humidity: weather.current.humidity,
          windSpeed: weather.current.windSpeed,
          windDirection: weather.current.windDirection,
          visibility: weather.current.visibility,
          pressure: weather.current.pressure,
          precipitation: weather.current.precipitation,
          rainRate: weather.current.rainRate,
          snowRate: weather.current.snowRate || 0,
          condition: weather.current.condition,
          cloudCover: weather.current.cloudCover,
          alerts: alerts,
          forecast: {
            hourly: weather.hourly || [],
            daily: weather.daily || [],
          },
        },
      })
    } catch (dbError) {
      console.warn('Failed to save weather data to database:', dbError)
      // Continue even if database save fails
    }

    return NextResponse.json({
      success: true,
      data: {
        current: weather.current,
        hourly: weather.hourly || [],
        daily: weather.daily || [],
        alerts: alerts,
        source: weather.source,
      },
    })
  } catch (error: any) {
    console.error('Error fetching weather:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}

