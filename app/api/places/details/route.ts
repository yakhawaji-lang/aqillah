import { NextRequest, NextResponse } from 'next/server'
import { googleMapsService } from '@/lib/services/google-maps'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const placeId = searchParams.get('place_id')
    
    // Detect if request is from Android app
    const userAgent = request.headers.get('user-agent') || ''
    const clientType = request.headers.get('x-client-type') || ''
    const isAndroid = userAgent.includes('Android') || 
                      userAgent.includes('Capacitor') || 
                      clientType.toLowerCase() === 'android'

    console.log('📍 Place Details API called:', {
      placeId,
      isAndroid,
      userAgent: userAgent.substring(0, 50),
      timestamp: new Date().toISOString(),
    })

    if (!placeId) {
      return NextResponse.json({ 
        success: false,
        error: 'place_id is required',
      }, { status: 400 })
    }

    console.log('📞 Calling googleMapsService.getPlaceDetails with:', {
      placeId,
    })

    // Use Places API Details with Android flag
    const placeDetails = await googleMapsService.getPlaceDetails(placeId, isAndroid)

    console.log('✅ Place details retrieved:', {
      hasGeometry: !!placeDetails.geometry,
      hasLocation: !!placeDetails.geometry?.location,
    })

    return NextResponse.json({ 
      success: true,
      data: placeDetails
    })
  } catch (error: any) {
    console.error('❌ Error in place details API route:', error)
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
      userFriendlyError = 'يجب تفعيل Billing في Google Cloud Console. Places API يتطلب تفعيل الفوترة.'
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

