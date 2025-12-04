/**
 * Weather Impact API - تأثير الطقس على القيادة
 */

import { NextRequest, NextResponse } from 'next/server'
import { weatherService } from '@/lib/services/weather'
import { weatherDrivingAssistant } from '@/lib/services/weather-driving-assistant'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '0')
    const lng = parseFloat(searchParams.get('lng') || '0')

    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Get weather
    const weather = await weatherService.getCurrentWeather({
      lat,
      lng,
    })

    // Analyze impact
    const impact = weatherDrivingAssistant.analyze(weather.current)

    return NextResponse.json({
      success: true,
      data: impact,
    })
  } catch (error: any) {
    console.error('Error analyzing weather impact:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze weather impact' },
      { status: 500 }
    )
  }
}

