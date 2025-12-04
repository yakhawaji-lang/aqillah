/**
 * Routes API - حساب المسار مع مراعاة المرور والطقس
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleMapsService } from '@/lib/services/google-maps'
import { weatherService } from '@/lib/services/weather'
import { riskEngine } from '@/lib/engines/risk-engine'
import { notificationService } from '@/lib/services/notifications'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      origin,
      destination,
      waypoints,
      departureTime,
      avoid,
      preferences,
    } = body

    // Validate input
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      )
    }

    // Calculate route using Google Maps
    const routeResponse = await googleMapsService.calculateRoute({
      origin: typeof origin === 'string' ? origin : { lat: origin.lat, lng: origin.lng },
      destination: typeof destination === 'string' ? destination : { lat: destination.lat, lng: destination.lng },
      waypoints: waypoints?.map((wp: any) => ({ lat: wp.lat, lng: wp.lng })),
      departureTime: departureTime || 'now',
      avoid: avoid || [],
      optimizeWaypoints: preferences?.optimizeWaypoints || false,
      alternatives: preferences?.alternatives || false,
    })

    if (!routeResponse.routes || routeResponse.routes.length === 0) {
      return NextResponse.json(
        { error: 'No routes found' },
        { status: 404 }
      )
    }

    const primaryRoute = routeResponse.routes[0]

    // Get weather data for key points along the route
    const weatherData = await getWeatherAlongRoute(primaryRoute)

    // Calculate risk scores for each segment
    const riskScores = await calculateRouteRisks(primaryRoute, weatherData)

    // Find maximum risk level
    const maxRisk = Math.max(...riskScores.map((r: any) => r.riskScore))
    const maxRiskLevel = getRiskLevel(maxRisk)

    // Save route to database if userId provided
    let routeId: string | undefined
    if (userId) {
      const route = await prisma.route.create({
        data: {
          userId,
          origin: typeof origin === 'string' ? { address: origin } : origin,
          destination: typeof destination === 'string' ? { address: destination } : destination,
          waypoints: waypoints || null,
          routeGeometry: {
            polyline: primaryRoute.polyline,
            steps: primaryRoute.steps,
          },
          distance: primaryRoute.distance / 1000, // Convert to km
          duration: primaryRoute.duration / 60, // Convert to minutes
          durationInTraffic: primaryRoute.durationInTraffic
            ? primaryRoute.durationInTraffic / 60
            : null,
          weatherData: weatherData,
          riskScores: riskScores,
          maxRiskLevel: maxRiskLevel,
          status: 'planned',
        },
      })
      routeId = route.id
    }

    // Send notification if high risk detected
    if (maxRiskLevel === 'high' || maxRiskLevel === 'critical') {
      if (userId) {
        await notificationService.sendNotification({
          userId,
          type: 'push',
          category: maxRiskLevel === 'critical' ? 'critical' : 'warning',
          title: 'تحذير: مخاطر على المسار',
          message: `تم اكتشاف ${maxRiskLevel === 'critical' ? 'مخاطر حرجة' : 'مخاطر عالية'} على مسارك. يُنصح بمراجعة المسار البديل.`,
          routeId,
          priority: maxRiskLevel,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        routeId,
        routes: routeResponse.routes.map((route, index) => ({
          ...route,
          weather: index === 0 ? weatherData : null,
          risks: index === 0 ? riskScores : null,
          maxRiskLevel: index === 0 ? maxRiskLevel : null,
        })),
        summary: {
          distance: primaryRoute.distance / 1000, // km
          duration: primaryRoute.duration / 60, // minutes
          durationInTraffic: primaryRoute.durationInTraffic
            ? primaryRoute.durationInTraffic / 60
            : null,
          maxRiskLevel,
          weatherAlerts: weatherData.alerts || [],
        },
      },
    })
  } catch (error: any) {
    console.error('Error computing route:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to compute route' },
      { status: 500 }
    )
  }
}

/**
 * Get weather data for key points along route
 */
async function getWeatherAlongRoute(route: any): Promise<any> {
  const weatherPoints: any[] = []

  // Sample points along route (every 5km or at major steps)
  const steps = route.steps || []
  const sampleInterval = Math.max(1, Math.floor(steps.length / 10)) // Sample ~10 points

  for (let i = 0; i < steps.length; i += sampleInterval) {
    const step = steps[i]
    if (step.endLocation) {
      try {
        const weather = await weatherService.getCurrentWeather({
          lat: step.endLocation.lat,
          lng: step.endLocation.lng,
        })
        weatherPoints.push({
          location: step.endLocation,
          weather: weather.current,
          alerts: weather.alerts || [],
        })
      } catch (error) {
        console.warn('Failed to get weather for point:', error)
      }
    }
  }

  return {
    points: weatherPoints,
    alerts: weatherPoints.flatMap((p) => p.alerts || []),
  }
}

/**
 * Calculate risk scores for route segments
 */
async function calculateRouteRisks(route: any, weatherData: any): Promise<any[]> {
  const risks: any[] = []

  const steps = route.steps || []
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    
    // Find weather data for this step
    const stepWeather = weatherData.points.find(
      (p: any) =>
        Math.abs(p.location.lat - step.endLocation.lat) < 0.01 &&
        Math.abs(p.location.lng - step.endLocation.lng) < 0.01
    )?.weather

    if (stepWeather) {
      const risk = riskEngine.calculateRisk({
        weather: stepWeather,
        traffic: {
          congestionIndex: route.trafficLevel === 'EXTREME' ? 90 : 
                          route.trafficLevel === 'HEAVY' ? 70 :
                          route.trafficLevel === 'MODERATE' ? 50 : 30,
          avgSpeed: route.duration ? (route.distance / route.duration) * 3.6 : 60,
          density: 30,
        },
        location: {
          lat: step.endLocation.lat,
          lng: step.endLocation.lng,
        },
        timestamp: new Date(),
      })

      risks.push({
        segmentIndex: i,
        location: step.endLocation,
        ...risk,
      })
    }
  }

  return risks
}

/**
 * Get risk level from score
 */
function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 80) return 'critical'
  if (score >= 60) return 'high'
  if (score >= 30) return 'medium'
  return 'low'
}

