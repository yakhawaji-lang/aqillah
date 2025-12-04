import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const apiKey = process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  
  return NextResponse.json({
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    apiKeyPrefix: apiKey?.substring(0, 10) || 'N/A',
    envVars: {
      NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY: !!process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY,
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      AQILLAH_MAPS_WEB_KEY: !!process.env.AQILLAH_MAPS_WEB_KEY,
    },
  })
}

