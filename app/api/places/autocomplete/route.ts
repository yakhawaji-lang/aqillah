import { NextRequest, NextResponse } from 'next/server'
import { googleMapsService } from '@/lib/services/google-maps'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const input = searchParams.get('input')
    const location = searchParams.get('location') // lat,lng
    const radius = searchParams.get('radius') || '50000' // meters
    
    // Detect if request is from Android app
    const userAgent = request.headers.get('user-agent') || ''
    const clientType = request.headers.get('x-client-type') || ''
    const isAndroid = userAgent.includes('Android') || 
                      userAgent.includes('Capacitor') || 
                      clientType.toLowerCase() === 'android'

    console.log('🔍 Autocomplete API called:', {
      input,
      location,
      radius,
      isAndroid,
      userAgent: userAgent.substring(0, 50),
      timestamp: new Date().toISOString(),
    })

    if (!input || input.length < 2) {
      return NextResponse.json({ 
        success: false,
        error: 'Input query must be at least 2 characters',
        data: []
      }, { status: 400 })
    }

    // Parse location if provided
    let locationBias = undefined
    if (location) {
      const [lat, lng] = location.split(',').map(Number)
      if (!isNaN(lat) && !isNaN(lng)) {
        locationBias = { lat, lng, radius: parseInt(radius) }
      }
    }

    console.log('📞 Calling googleMapsService.autocomplete with:', {
      input,
      locationBias,
      language: 'ar',
      region: 'sa',
    })

    // Use Places API Autocomplete with Android flag
    const results = await googleMapsService.autocomplete({
      input,
      location: locationBias,
      language: 'ar',
      region: 'sa',
      isAndroid: isAndroid, // Pass Android flag to use Android API key
    })

    console.log('✅ Autocomplete results:', {
      predictionsCount: results.predictions?.length || 0,
    })

    return NextResponse.json({ 
      success: true,
      data: results.predictions || []
    })
  } catch (error: any) {
    console.error('❌ Error in autocomplete API route:', error)
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
      userFriendlyError = 'يجب تفعيل Billing في Google Cloud Console. Places API يتطلب تفعيل الفوترة. اذهب إلى: https://console.cloud.google.com/project/_/billing/enable'
    }
    
    // Return more detailed error information
    return NextResponse.json({ 
      success: false,
      error: userFriendlyError,
      originalError: errorMessage,
      details: error.response?.data || (error.stack ? error.stack.substring(0, 500) : 'No details'),
      billingRequired: errorMessage.includes('Billing') || errorMessage.includes('REQUEST_DENIED'),
      billingLink: 'https://console.cloud.google.com/project/_/billing/enable',
      data: []
    }, { status: 500 })
  }
}
