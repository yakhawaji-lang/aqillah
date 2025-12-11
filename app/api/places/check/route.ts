import { NextRequest, NextResponse } from 'next/server'
import { googleMapsConfig } from '@/config/google-maps'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const apiKey = googleMapsConfig.placesApiKey || googleMapsConfig.apiKey
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'API key not configured',
        details: {
          placesApiKey: !!googleMapsConfig.placesApiKey,
          apiKey: !!googleMapsConfig.apiKey,
          envVars: {
            AQILLAH_PLACES_KEY: !!process.env.AQILLAH_PLACES_KEY,
            AQILLAH_MAPS_WEB_KEY: !!process.env.AQILLAH_MAPS_WEB_KEY,
            GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
          }
        }
      }, { status: 400 })
    }

    // Test Places API with a simple query
    const testUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=الرياض&key=${apiKey}&language=ar&region=sa`
    
    try {
      const response = await axios.get(testUrl, {
        timeout: 5000,
      })

      const status = response.data.status
      const isOk = status === 'OK' || status === 'ZERO_RESULTS'
      
      return NextResponse.json({
        success: isOk,
        status,
        errorMessage: response.data.error_message,
        apiKeyConfigured: true,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        billingRequired: status === 'REQUEST_DENIED' && (
          response.data.error_message?.includes('Billing') || 
          response.data.error_message?.includes('billing')
        ),
        apiNotEnabled: status === 'REQUEST_DENIED' && (
          response.data.error_message?.includes('API') || 
          response.data.error_message?.includes('not enabled')
        ),
        links: {
          billing: 'https://console.cloud.google.com/project/_/billing/enable',
          placesApi: 'https://console.cloud.google.com/apis/library/places-backend.googleapis.com',
          credentials: 'https://console.cloud.google.com/apis/credentials',
        }
      })
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: 'Failed to connect to Places API',
        details: error.message,
        apiKeyConfigured: true,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
    }, { status: 500 })
  }
}

