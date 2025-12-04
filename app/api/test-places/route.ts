import { NextRequest, NextResponse } from 'next/server'
import { googleMapsConfig } from '@/config/google-maps'

export async function GET(request: NextRequest) {
  try {
    const placesApiKey = googleMapsConfig.placesApiKey
    const mapsApiKey = googleMapsConfig.apiKey
    
    return NextResponse.json({
      success: true,
      config: {
        placesApiKey: placesApiKey ? `${placesApiKey.substring(0, 10)}...` : 'NOT SET',
        mapsApiKey: mapsApiKey ? `${mapsApiKey.substring(0, 10)}...` : 'NOT SET',
        placesApiKeyExists: !!placesApiKey,
        mapsApiKeyExists: !!mapsApiKey,
        mapsApiUrl: googleMapsConfig.mapsApiUrl,
        defaultLanguage: googleMapsConfig.defaultLanguage,
        defaultRegion: googleMapsConfig.defaultRegion,
      },
      env: {
        AQILLAH_PLACES_KEY: process.env.AQILLAH_PLACES_KEY ? 'SET' : 'NOT SET',
        AQILLAH_MAPS_WEB_KEY: process.env.AQILLAH_MAPS_WEB_KEY ? 'SET' : 'NOT SET',
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 })
  }
}

