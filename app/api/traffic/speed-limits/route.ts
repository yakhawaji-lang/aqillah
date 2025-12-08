/**
 * API - جلب بيانات السرعة القصوى من Google Speed Limits API
 * يستخدم Google Roads API للحصول على السرعة القصوى المسموحة لكل طريق
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const points = searchParams.get('points') // format: "lat1,lng1|lat2,lng2|..."
    
    if (!points) {
      return NextResponse.json(
        { success: false, error: 'Points parameter is required' },
        { status: 400 }
      )
    }

    const apiKey = process.env.AQILLAH_MAPS_WEB_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    // تحويل النقاط إلى التنسيق المطلوب
    const pointArray = points.split('|').map(point => {
      const [lat, lng] = point.split(',')
      return { latitude: parseFloat(lat), longitude: parseFloat(lng) }
    })

    const speedLimitsUrl = `https://roads.googleapis.com/v1/speedLimits?key=${apiKey}`
    
    const response = await fetch(speedLimitsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        places: pointArray,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Speed Limits API error: ${errorText}`)
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      data: data.speedLimits || [],
      source: 'google-speed-limits-api',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error fetching Speed Limits API data:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Speed Limits API data',
        data: [],
      },
      { status: 500 }
    )
  }
}

