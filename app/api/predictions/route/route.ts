/**
 * Route Predictions API
 */

import { NextRequest, NextResponse } from 'next/server'
import { predictionEngine } from '@/lib/engines/prediction-engine'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeId, segments } = body

    if (!segments || segments.length === 0) {
      return NextResponse.json(
        { error: 'Segments are required' },
        { status: 400 }
      )
    }

    const predictions = []

    for (const segment of segments) {
      // Get weather for segment
      const weather = await weatherService.getCurrentWeather({
        lat: segment.lat,
        lng: segment.lng,
      })

      // Get traffic data (placeholder)
      const traffic = {
        congestionIndex: 50,
        avgSpeed: 60,
        density: 30,
      }

      // Make prediction
      const prediction = predictionEngine.predict({
        weather: weather.current,
        traffic,
        vehicle: segment.vehicle,
        location: {
          lat: segment.lat,
          lng: segment.lng,
        },
      })

      predictions.push({
        segment,
        ...prediction,
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId,
        predictions,
      },
    })
  } catch (error: any) {
    console.error('Error generating predictions:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}

