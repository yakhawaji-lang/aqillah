/**
 * Risk Engine API - حساب درجة المخاطر
 */

import { NextRequest, NextResponse } from 'next/server'
import { riskEngine } from '@/lib/engines/risk-engine'
import { weatherService } from '@/lib/services/weather'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      location,
      weather,
      traffic,
      vehicle,
      routeId,
    } = body

    // Validate input
    if (!location || !location.lat || !location.lng) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    // Get weather if not provided
    let weatherData = weather
    if (!weatherData) {
      const weatherResponse = await weatherService.getCurrentWeather({
        lat: location.lat,
        lng: location.lng,
      })
      weatherData = weatherResponse.current
    }

    // Default traffic data if not provided
    const trafficData = traffic || {
      congestionIndex: 50,
      avgSpeed: 60,
      density: 30,
    }

    // Calculate risk
    const risk = riskEngine.calculateRisk({
      weather: weatherData,
      traffic: trafficData,
      vehicle: vehicle,
      location: {
        lat: location.lat,
        lng: location.lng,
      },
      timestamp: new Date(),
    })

    // Save to database
    try {
      await prisma.riskScore.create({
        data: {
          lat: location.lat,
          lng: location.lng,
          routeId: routeId || null,
          timestamp: new Date(),
          weatherData: weatherData,
          trafficData: trafficData,
          vehicleData: vehicle || {},
          riskScore: risk.riskScore,
          riskLevel: risk.riskLevel,
          riskCategory: risk.riskCategory,
          recommendedAction: risk.recommendedAction,
          confidence: risk.confidence,
          factors: risk.factors,
          modelVersion: '1.0',
        },
      })
    } catch (dbError) {
      console.warn('Failed to save risk score to database:', dbError)
    }

    return NextResponse.json({
      success: true,
      data: risk,
    })
  } catch (error: any) {
    console.error('Error calculating risk:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to calculate risk' },
      { status: 500 }
    )
  }
}

