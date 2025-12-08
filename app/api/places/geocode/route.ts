import { NextRequest, NextResponse } from 'next/server'
import { googleMapsService } from '@/lib/services/google-maps'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const address = searchParams.get('address')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    // Detect if request is from Android app
    const userAgent = request.headers.get('user-agent') || ''
    const clientType = request.headers.get('x-client-type') || ''
    const isAndroid = userAgent.includes('Android') || 
                      userAgent.includes('Capacitor') || 
                      clientType.toLowerCase() === 'android'

    console.log('🌍 Geocode API called:', {
      address,
      lat,
      lng,
      isAndroid,
      userAgent: userAgent.substring(0, 50),
      timestamp: new Date().toISOString(),
    })

    if (!address && (!lat || !lng)) {
      return NextResponse.json({ 
        success: false,
        error: 'Either address or lat/lng is required',
      }, { status: 400 })
    }

    let geocodeRequest: any = {}
    if (address) {
      geocodeRequest.address = address
    } else if (lat && lng) {
      geocodeRequest.latlng = { lat: parseFloat(lat), lng: parseFloat(lng) }
    }

    console.log('📞 Calling googleMapsService.geocode with:', geocodeRequest)

    // Use Geocoding API with Android flag
    const geocodeResult = await googleMapsService.geocode({
      ...geocodeRequest,
      isAndroid: isAndroid, // Pass Android flag to use Android API key
    })

    console.log('✅ Geocode results:', {
      resultsCount: geocodeResult.results?.length || 0,
    })

    return NextResponse.json({ 
      success: true,
      data: geocodeResult
    })
  } catch (error: any) {
    console.error('❌ Error in geocode API route:', error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: error.config?.url ? error.config.url.replace(/key=[^&]+/, 'key=***') : 'N/A',
    })
    
    // Check for specific billing error
    const errorMessage = error.message || ''
    let userFriendlyError = errorMessage
    
    if (errorMessage.includes('Billing') || errorMessage.includes('REQUEST_DENIED')) {
      userFriendlyError = 'يجب تفعيل Billing في Google Cloud Console. Geocoding API يتطلب تفعيل الفوترة.'
    }
    
    // Return more detailed error information
    return NextResponse.json({ 
      success: false,
      error: userFriendlyError,
      originalError: errorMessage,
      details: error.response?.data || (error.stack ? error.stack.substring(0, 500) : 'No details'),
      billingRequired: errorMessage.includes('Billing') || errorMessage.includes('REQUEST_DENIED'),
      billingLink: 'https://console.cloud.google.com/project/_/billing/enable',
    }, { status: 500 })
  }
}

