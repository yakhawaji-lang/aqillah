/**
 * Driving Decision API
 */

import { NextRequest, NextResponse } from 'next/server'
import { drivingDecisionEngine } from '@/lib/engines/driving-decision-engine'
import { predictionEngine } from '@/lib/engines/prediction-engine'
import { riskEngine } from '@/lib/engines/risk-engine'
import { weatherService } from '@/lib/services/weather'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      location,
      route,
      vehicle,
      traffic,
    } = body

    if (!location || !route) {
      return NextResponse.json(
        { error: 'Location and route are required' },
        { status: 400 }
      )
    }

    // Get weather
    const weather = await weatherService.getCurrentWeather({
      lat: location.lat,
      lng: location.lng,
    })

    // Calculate risk
    const riskScore = riskEngine.calculateRisk({
      weather: weather.current,
      traffic: traffic || {
        congestionIndex: 50,
        avgSpeed: 60,
        density: 30,
      },
      vehicle,
      location,
      timestamp: new Date(),
    })

    // Make predictions
    const predictions = predictionEngine.predict({
      weather: weather.current,
      traffic: traffic || {
        congestionIndex: 50,
        avgSpeed: 60,
        density: 30,
      },
      vehicle,
      location,
    })

    // Make decision
    const decision = drivingDecisionEngine.decide({
      weather: weather.current,
      traffic: traffic || {
        congestionIndex: 50,
        avgSpeed: 60,
      },
      vehicle,
      route,
      riskScore,
      predictions,
    })

    return NextResponse.json({
      success: true,
      data: decision,
    })
  } catch (error: any) {
    console.error('Error making driving decision:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to make driving decision' },
      { status: 500 }
    )
  }
}

