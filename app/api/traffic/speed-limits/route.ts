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
      console.error('Speed Limits API: Google Maps API key not configured')
      return NextResponse.json(
        {
          success: false,
          error: 'Google Maps API key not configured',
          data: [],
        },
        { status: 500 }
      )
    }

    // تحويل النقاط إلى التنسيق المطلوب
    const pointArray = points.split('|').map(point => {
      const trimmedPoint = point.trim()
      const [lat, lng] = trimmedPoint.split(',')
      const latitude = parseFloat(lat?.trim() || '0')
      const longitude = parseFloat(lng?.trim() || '0')
      
      if (isNaN(latitude) || isNaN(longitude)) {
        throw new Error(`Invalid point format: ${trimmedPoint}`)
      }
      
      return { latitude, longitude }
    })

    if (pointArray.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid points provided' },
        { status: 400 }
      )
    }

    const speedLimitsUrl = `https://roads.googleapis.com/v1/speedLimits?key=${apiKey}`
    
    console.log('Speed Limits API Request:', {
      url: speedLimitsUrl.replace(apiKey, '***'),
      pointsCount: pointArray.length,
      firstPoint: pointArray[0],
    })
    
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
      console.error('Speed Limits API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
      
      // محاولة تحليل الخطأ كـ JSON
      let errorMessage = `Speed Limits API error (${response.status}): ${response.statusText}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorJson.error || errorMessage
      } catch {
        // إذا لم يكن JSON، استخدم النص كما هو
        errorMessage = errorText || errorMessage
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          data: [],
        },
        { status: response.status >= 400 && response.status < 500 ? response.status : 500 }
      )
    }

    const data = await response.json()
    
    console.log('Speed Limits API Success:', {
      speedLimitsCount: data.speedLimits?.length || 0,
    })

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

