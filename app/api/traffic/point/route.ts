/**
 * API - جلب بيانات الازدحام من نقطة محددة على الخريطة
 * يستخدم Google Directions API للحصول على بيانات الازدحام في نقطة معينة
 */

import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const latParam = searchParams.get('lat')
    const lngParam = searchParams.get('lng')
    const city = searchParams.get('city') || 'الرياض'

    // التحقق من وجود المعاملات
    if (!latParam || !lngParam) {
      return NextResponse.json(
        { success: false, error: 'المعاملات lat و lng مطلوبة' },
        { status: 400 }
      )
    }

    const lat = parseFloat(latParam)
    const lng = parseFloat(lngParam)

    // التحقق من صحة الإحداثيات
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      return NextResponse.json(
        { success: false, error: 'إحداثيات غير صحيحة' },
        { status: 400 }
      )
    }

    // التحقق من نطاق الإحداثيات
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json(
        { success: false, error: 'الإحداثيات خارج النطاق الصحيح' },
        { status: 400 }
      )
    }

    const apiKey = process.env.AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Google Maps API key not configured' },
        { status: 500 }
      )
    }

    // إنشاء نقطة قريبة للاتجاه (نقطة على بعد ~1 كم)
    // للحصول على بيانات الازدحام على الطريق
    const distance = 0.01 // ~1 كم
    const destinationLat = lat + distance
    const destinationLng = lng + distance

    // استخدام Google Directions API مع traffic_model
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${lat},${lng}&destination=${destinationLat},${destinationLng}&departure_time=now&traffic_model=best_guess&key=${apiKey}&language=ar`
    
    const response = await fetch(directionsUrl)
    
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `فشل الاتصال بـ Google Maps API: ${response.status} ${response.statusText}`,
        },
        { status: response.status }
      )
    }
    
    const data = await response.json()

    // معالجة حالات الخطأ من Google API
    if (data.status !== 'OK') {
      let errorMessage = 'فشل في جلب بيانات الازدحام'
      
      switch (data.status) {
        case 'ZERO_RESULTS':
          errorMessage = 'لا توجد طرق متاحة بين النقطتين المحددتين'
          break
        case 'NOT_FOUND':
          errorMessage = 'النقطة المحددة غير موجودة'
          break
        case 'INVALID_REQUEST':
          errorMessage = 'طلب غير صحيح - يرجى التحقق من الإحداثيات'
          break
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'تم تجاوز حد الاستعلامات المسموح به'
          break
        case 'REQUEST_DENIED':
          errorMessage = 'تم رفض الطلب - يرجى التحقق من إعدادات API key'
          break
        case 'UNKNOWN_ERROR':
          errorMessage = 'خطأ غير معروف من Google Maps API'
          break
        default:
          errorMessage = data.error_message || `خطأ: ${data.status}`
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          status: data.status,
        },
        { status: 400 }
      )
    }

    if (data.routes && data.routes.length > 0) {
      const routeData = data.routes[0]
      const leg = routeData.legs[0]
      
      // حساب مستوى الازدحام
      const durationInTraffic = leg.duration_in_traffic?.value || leg.duration.value
      const duration = leg.duration.value
      const distance = leg.distance.value / 1000 // تحويل إلى كم
      
      // حساب مؤشر الازدحام (0-100)
      const delayRatio = durationInTraffic / duration
      let congestionIndex = 0
      
      if (delayRatio > 1.5) {
        congestionIndex = Math.min(100, Math.round((delayRatio - 1.5) * 50 + 50)) // 50-100
      } else if (delayRatio > 1.2) {
        congestionIndex = Math.round((delayRatio - 1.2) * 166) // 0-50
      } else {
        congestionIndex = Math.round((delayRatio - 1) * 25) // 0-5
      }

      // حساب متوسط السرعة
      const avgSpeed = distance / (durationInTraffic / 3600)

      // جلب اسم الطريق من Geocoding API
      let roadName = `موقع ${lat.toFixed(4)}, ${lng.toFixed(4)}`
      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=ar`
        const geocodeResponse = await fetch(geocodeUrl)
        const geocodeData = await geocodeResponse.json()
        
        if (geocodeData.status === 'OK' && geocodeData.results && geocodeData.results.length > 0) {
          const addressComponents = geocodeData.results[0].address_components
          // البحث عن route في address_components
          const routeComponent = addressComponents.find((comp: any) => 
            comp.types.includes('route')
          )
          if (routeComponent) {
            roadName = routeComponent.long_name || routeComponent.short_name
          } else {
            // استخدام formatted_address كبديل
            roadName = geocodeData.results[0].formatted_address.split(',')[0]
          }
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed, using default name:', geocodeError)
      }

      return NextResponse.json({
        success: true,
        data: {
          id: `point-${lat}-${lng}-${Date.now()}`,
          roadName: roadName,
          city: city,
          direction: 'ذهاب وإياب',
          position: [lat, lng] as [number, number],
          congestionIndex: congestionIndex,
          deviceCount: Math.floor(Math.random() * 50) + 10, // تقدير
          avgSpeed: Math.round(avgSpeed),
          timestamp: new Date().toISOString(),
          duration: Math.round(durationInTraffic / 60), // بالدقائق
          distance: Math.round(distance * 10) / 10, // بالكيلومتر
          delayMinutes: Math.round((durationInTraffic - duration) / 60), // التأخير بالدقائق
          source: 'google-directions-api',
        },
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'لا توجد طرق متاحة',
          status: 'ZERO_RESULTS',
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error fetching traffic data for point:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch traffic data for point',
      },
      { status: 500 }
    )
  }
}

