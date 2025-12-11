/**
 * Google Maps Service
 * خدمة Google Maps
 */

import axios from 'axios'
import { googleMapsConfig } from '@/config/google-maps'

export interface RouteRequest {
  origin: { lat: number; lng: number } | string
  destination: { lat: number; lng: number } | string
  waypoints?: Array<{ lat: number; lng: number }>
  departureTime?: Date | 'now'
  avoid?: ('tolls' | 'highways' | 'ferries')[]
  optimizeWaypoints?: boolean
  alternatives?: boolean
}

export interface RouteResponse {
  routes: Array<{
    distance: number // meters
    duration: number // seconds
    durationInTraffic?: number // seconds
    polyline: string
    steps: Array<{
      distance: number
      duration: number
      startLocation: { lat: number; lng: number }
      endLocation: { lat: number; lng: number }
      instructions: string
      maneuver?: string
    }>
    trafficLevel?: 'LIGHT' | 'MODERATE' | 'HEAVY' | 'EXTREME'
    warnings?: string[]
  }>
  geocodedWaypoints?: Array<{
    geocoderStatus: string
    placeId?: string
  }>
}

export interface GeocodeRequest {
  address?: string
  latlng?: { lat: number; lng: number }
  placeId?: string
}

export interface GeocodeResponse {
  results: Array<{
    formattedAddress: string
    geometry: {
      location: { lat: number; lng: number }
      locationType: string
    }
    placeId: string
    types: string[]
  }>
}

class GoogleMapsService {
  private apiKey: string
  private routesApiKey: string
  private placesApiKey: string
  private androidApiKey: string

  constructor() {
    this.apiKey = googleMapsConfig.apiKey
    this.routesApiKey = googleMapsConfig.routesApiKey
    this.placesApiKey = googleMapsConfig.placesApiKey
    this.androidApiKey = googleMapsConfig.androidApiKey

    if (!this.apiKey) {
      console.warn('Google Maps API key not configured')
    }
  }

  /**
   * Get the appropriate API key based on client type
   */
  private getApiKey(isAndroid: boolean = false): string {
    if (isAndroid && this.androidApiKey) {
      return this.androidApiKey
    }
    return this.placesApiKey || this.apiKey
  }

  /**
   * Calculate route using Google Routes API
   */
  async calculateRoute(request: RouteRequest): Promise<RouteResponse> {
    if (!this.routesApiKey) {
      throw new Error('Google Routes API key not configured')
    }

    try {
      // Format waypoints
      const waypoints = request.waypoints?.map(
        (wp) => `${wp.lat},${wp.lng}`
      )

      // Format origin and destination
      const origin =
        typeof request.origin === 'string'
          ? request.origin
          : `${request.origin.lat},${request.origin.lng}`
      const destination =
        typeof request.destination === 'string'
          ? request.destination
          : `${request.destination.lat},${request.destination.lng}`

      // Build request body for Routes API
      const body = {
        origin: {
          location: {
            latLng: {
              latitude:
                typeof request.origin === 'string'
                  ? undefined
                  : request.origin.lat,
              longitude:
                typeof request.origin === 'string'
                  ? undefined
                  : request.origin.lng,
            },
          },
        },
        destination: {
          location: {
            latLng: {
              latitude:
                typeof request.destination === 'string'
                  ? undefined
                  : request.destination.lat,
              longitude:
                typeof request.destination === 'string'
                  ? undefined
                  : request.destination.lng,
            },
          },
        },
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        computeAlternativeRoutes: request.alternatives || false,
        ...(request.departureTime && {
          departureTime:
            request.departureTime === 'now'
              ? new Date().toISOString()
              : request.departureTime.toISOString(),
        }),
      }

      const response = await axios.post(
        `${googleMapsConfig.routesApiUrl}/directions/v2:computeRoutes`,
        body,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.routesApiKey,
            'X-Goog-FieldMask':
              'routes.duration,routes.distanceMeters,routes.polyline,routes.legs.steps,routes.legs.duration,routes.legs.distanceMeters',
          },
        }
      )

      // Transform response to our format
      return this.transformRoutesResponse(response.data)
    } catch (error: any) {
      console.error('Error calculating route:', error)
      throw new Error(
        `Failed to calculate route: ${error.response?.data?.error?.message || error.message}`
      )
    }
  }

  /**
   * Transform Google Routes API response to our format
   */
  private transformRoutesResponse(data: any): RouteResponse {
    const routes = data.routes?.map((route: any) => {
      const leg = route.legs?.[0]
      return {
        distance: leg?.distanceMeters || 0,
        duration: leg?.duration?.seconds || 0,
        durationInTraffic: leg?.durationInTraffic?.seconds,
        polyline: route.polyline?.encodedPolyline || '',
        steps: leg?.steps?.map((step: any) => ({
          distance: step.distanceMeters || 0,
          duration: step.staticDuration?.seconds || 0,
          startLocation: {
            lat: step.startLocation?.latLng?.latitude || 0,
            lng: step.startLocation?.latLng?.longitude || 0,
          },
          endLocation: {
            lat: step.endLocation?.latLng?.latitude || 0,
            lng: step.endLocation?.latLng?.longitude || 0,
          },
          instructions: step.navigationInstruction?.instructions || '',
          maneuver: step.navigationInstruction?.maneuver,
        })) || [],
        trafficLevel: this.getTrafficLevel(leg?.duration, leg?.durationInTraffic),
        warnings: route.warnings || [],
      }
    }) || []

    return { routes }
  }

  /**
   * Get traffic level based on duration difference
   */
  private getTrafficLevel(
    duration?: { seconds: number },
    durationInTraffic?: { seconds: number }
  ): 'LIGHT' | 'MODERATE' | 'HEAVY' | 'EXTREME' | undefined {
    if (!duration || !durationInTraffic) return undefined

    const delay = durationInTraffic.seconds - duration.seconds
    const delayPercent = (delay / duration.seconds) * 100

    if (delayPercent < 10) return 'LIGHT'
    if (delayPercent < 30) return 'MODERATE'
    if (delayPercent < 60) return 'HEAVY'
    return 'EXTREME'
  }

  /**
   * Geocode address or reverse geocode coordinates
   */
  async geocode(request: GeocodeRequest & { isAndroid?: boolean }): Promise<GeocodeResponse> {
    const apiKeyToUse = this.getApiKey(request.isAndroid || false)
    
    if (!apiKeyToUse) {
      throw new Error('Google Maps API key not configured')
    }

    try {
      let url = `${googleMapsConfig.mapsApiUrl}/geocode/json`

      if (request.address) {
        url += `?address=${encodeURIComponent(request.address)}`
      } else if (request.latlng) {
        url += `?latlng=${request.latlng.lat},${request.latlng.lng}`
      } else if (request.placeId) {
        url += `?place_id=${request.placeId}`
      } else {
        throw new Error('Invalid geocode request')
      }

      url += `&key=${apiKeyToUse}&language=${googleMapsConfig.defaultLanguage}&region=${googleMapsConfig.defaultRegion}`

      const response = await axios.get(url)

      return {
        results: response.data.results.map((result: any) => ({
          formattedAddress: result.formatted_address,
          geometry: {
            location: {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            },
            locationType: result.geometry.location_type,
          },
          placeId: result.place_id,
          types: result.types,
        })),
      }
    } catch (error: any) {
      console.error('Error geocoding:', error)
      throw new Error(`Failed to geocode: ${error.message}`)
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string, isAndroid: boolean = false) {
    const apiKeyToUse = this.getApiKey(isAndroid)
    
    if (!apiKeyToUse) {
      throw new Error('Google Maps API key not configured')
    }

    console.log('🔑 Using API key for place details:', {
      type: isAndroid ? 'Android' : 'Web',
      keyPrefix: apiKeyToUse.substring(0, 10) + '...',
    })

    try {
      const url = `${googleMapsConfig.mapsApiUrl}/place/details/json?place_id=${placeId}&key=${apiKeyToUse}&language=${googleMapsConfig.defaultLanguage}&fields=geometry,formatted_address,name`

      const response = await axios.get(url)
      
      if (response.data.status !== 'OK') {
        throw new Error(`Places API error: ${response.data.status} - ${response.data.error_message || 'Unknown error'}`)
      }
      
      if (!response.data.result) {
        throw new Error('No result returned from Places API')
      }
      
      return response.data.result
    } catch (error: any) {
      console.error('Error getting place details:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      })
      throw new Error(`Failed to get place details: ${error.message}`)
    }
  }

  /**
   * Autocomplete places (Places API)
   */
  async autocomplete(request: {
    input: string
    location?: { lat: number; lng: number; radius?: number }
    language?: string
    region?: string
    types?: string[]
    isAndroid?: boolean // Flag to indicate Android client
  }): Promise<{ predictions: any[] }> {
    const apiKeyToUse = this.getApiKey(request.isAndroid || false)
    
    if (!apiKeyToUse) {
      console.error('Places API Key check:', {
        placesApiKey: this.placesApiKey ? 'exists' : 'missing',
        androidApiKey: this.androidApiKey ? 'exists' : 'missing',
        apiKey: this.apiKey ? 'exists' : 'missing',
        isAndroid: request.isAndroid,
        envVars: {
          AQILLAH_PLACES_KEY: !!process.env.AQILLAH_PLACES_KEY,
          AQILLAH_Andriod_KEY: !!process.env.AQILLAH_Andriod_KEY,
          AQILLAH_ANDROID_KEY: !!process.env.AQILLAH_ANDROID_KEY,
          AQILLAH_MAPS_WEB_KEY: !!process.env.AQILLAH_MAPS_WEB_KEY,
          GOOGLE_MAPS_API_KEY: !!process.env.GOOGLE_MAPS_API_KEY,
        },
      })
      throw new Error('Google Maps Places API key not configured. Please set AQILLAH_PLACES_KEY, AQILLAH_MAPS_WEB_KEY, or GOOGLE_MAPS_API_KEY in .env file. Also ensure Places API is enabled in Google Cloud Console.')
    }

    console.log('🔑 Using API key:', {
      type: request.isAndroid ? 'Android' : 'Web',
      keyPrefix: apiKeyToUse.substring(0, 10) + '...',
    })

    try {
      let url = `${googleMapsConfig.mapsApiUrl}/place/autocomplete/json`
      const params = new URLSearchParams({
        input: request.input,
        key: apiKeyToUse,
        language: request.language || googleMapsConfig.defaultLanguage,
        region: request.region || googleMapsConfig.defaultRegion,
      })

      // Add location bias if provided
      if (request.location) {
        params.append('location', `${request.location.lat},${request.location.lng}`)
        params.append('radius', String(request.location.radius || 50000))
      }

      // Add types filter if provided
      if (request.types && request.types.length > 0) {
        params.append('types', request.types.join('|'))
      }

      url += `?${params.toString()}`
      
      console.log('Places Autocomplete Request:', {
        url: url.replace(apiKeyToUse, '***'),
        input: request.input,
        hasLocation: !!request.location,
      })

      const response = await axios.get(url, {
        timeout: 10000, // 10 seconds timeout
      })
      
      console.log('Places Autocomplete Response:', {
        status: response.data.status,
        predictionsCount: response.data.predictions?.length || 0,
      })
      
      if (response.data.status === 'OK' || response.data.status === 'ZERO_RESULTS') {
        return {
          predictions: response.data.predictions || []
        }
      } else {
        const errorMsg = response.data.error_message || 'Unknown error'
        const status = response.data.status
        
        console.error('Places API error response:', {
          status,
          error_message: errorMsg,
          fullResponse: response.data,
        })
        
        // Create user-friendly error messages
        let friendlyError = errorMsg
        
        if (status === 'REQUEST_DENIED') {
          if (errorMsg.includes('Billing') || errorMsg.includes('billing')) {
            friendlyError = 'يجب تفعيل Billing في Google Cloud Console. Places API يتطلب تفعيل الفوترة. اذهب إلى: https://console.cloud.google.com/project/_/billing/enable'
          } else if (errorMsg.includes('API key') || errorMsg.includes('API not enabled')) {
            friendlyError = 'Places API غير مفعلة أو API key غير صحيحة. تأكد من تفعيل Places API في Google Cloud Console: https://console.cloud.google.com/apis/library/places-backend.googleapis.com'
          } else {
            friendlyError = 'تم رفض الطلب. تأكد من تفعيل Places API وإعدادات API key في Google Cloud Console.'
          }
        } else if (status === 'OVER_QUERY_LIMIT') {
          friendlyError = 'تم تجاوز حد الاستعلامات المسموح به. يرجى المحاولة لاحقاً أو تفعيل Billing.'
        } else if (status === 'INVALID_REQUEST') {
          friendlyError = 'طلب غير صحيح. يرجى التحقق من معاملات البحث.'
        }
        
        const error = new Error(friendlyError) as any
        error.status = status
        error.originalMessage = errorMsg
        error.billingRequired = status === 'REQUEST_DENIED' && (errorMsg.includes('Billing') || errorMsg.includes('billing'))
        throw error
      }
    } catch (error: any) {
      console.error('Error in autocomplete service:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url?.replace(apiKeyToUse, '***'),
      })
      
      // If error already has status and friendly message, re-throw it
      if (error.status && error.billingRequired !== undefined) {
        throw error
      }
      
      if (error.response?.data) {
        const apiError = error.response.data
        const status = apiError.status || 'UNKNOWN'
        const errorMsg = apiError.error_message || error.message
        
        // Create user-friendly error
        let friendlyError = errorMsg
        
        if (status === 'REQUEST_DENIED') {
          if (errorMsg.includes('Billing') || errorMsg.includes('billing')) {
            friendlyError = 'يجب تفعيل Billing في Google Cloud Console. Places API يتطلب تفعيل الفوترة.'
          } else if (errorMsg.includes('API key') || errorMsg.includes('API not enabled')) {
            friendlyError = 'Places API غير مفعلة أو API key غير صحيحة. تأكد من تفعيل Places API في Google Cloud Console.'
          } else {
            friendlyError = 'تم رفض الطلب. تأكد من تفعيل Places API وإعدادات API key.'
          }
        }
        
        const newError = new Error(friendlyError) as any
        newError.status = status
        newError.originalMessage = errorMsg
        newError.billingRequired = status === 'REQUEST_DENIED' && (errorMsg.includes('Billing') || errorMsg.includes('billing'))
        throw newError
      }
      
      throw new Error(`Failed to autocomplete: ${error.message}`)
    }
  }
}

export const googleMapsService = new GoogleMapsService()

