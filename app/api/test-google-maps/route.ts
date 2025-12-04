/**
 * Test Google Maps API - اختبار APIs
 */

import { NextRequest, NextResponse } from 'next/server'
import { googleMapsService } from '@/lib/services/google-maps'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const test = searchParams.get('test') || 'geocode'

    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
      apiKeys: {
        mapsWeb: !!process.env.AQILLAH_MAPS_WEB_KEY,
        routes: !!process.env.AQILLAH_ROUTES_KEY,
        places: !!process.env.AQILLAH_PLACES_KEY,
        publicMaps: !!process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY,
      },
    }

    // Test 1: Geocoding
    if (test === 'geocode' || test === 'all') {
      try {
        const geocode = await googleMapsService.geocode({
          address: 'الرياض، المملكة العربية السعودية',
        })
        results.tests.geocode = {
          success: true,
          data: geocode.results[0],
        }
      } catch (error: any) {
        results.tests.geocode = {
          success: false,
          error: error.message,
        }
      }
    }

    // Test 2: Reverse Geocoding
    if (test === 'reverse' || test === 'all') {
      try {
        const reverse = await googleMapsService.geocode({
          latlng: { lat: 24.7136, lng: 46.6753 },
        })
        results.tests.reverseGeocode = {
          success: true,
          data: reverse.results[0],
        }
      } catch (error: any) {
        results.tests.reverseGeocode = {
          success: false,
          error: error.message,
        }
      }
    }

    // Test 3: Route Calculation
    if (test === 'route' || test === 'all') {
      try {
        const route = await googleMapsService.calculateRoute({
          origin: { lat: 24.7136, lng: 46.6753 },
          destination: { lat: 24.6876, lng: 46.6879 },
          departureTime: 'now',
        })
        results.tests.route = {
          success: true,
          routes: route.routes.length,
          distance: route.routes[0]?.distance,
          duration: route.routes[0]?.duration,
        }
      } catch (error: any) {
        results.tests.route = {
          success: false,
          error: error.message,
        }
      }
    }

    // Check API Key status
    results.apiKeysConfigured = {
      mapsWeb: process.env.AQILLAH_MAPS_WEB_KEY ? '✅' : '❌',
      routes: process.env.AQILLAH_ROUTES_KEY ? '✅' : '❌',
      places: process.env.AQILLAH_PLACES_KEY ? '✅' : '❌',
      publicMaps: process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY ? '✅' : '❌',
    }

    return NextResponse.json({
      success: true,
      ...results,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}
