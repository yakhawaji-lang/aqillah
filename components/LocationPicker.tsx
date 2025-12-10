'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Search, X, Navigation, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { googleMapsService } from '@/lib/services/google-maps'
import toast from 'react-hot-toast'

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; name?: string }) => void
  currentLocation?: [number, number]
  placeholder?: string
  id?: string
  initialLocation?: [number, number] | null
}

interface PlacePrediction {
  description: string
  place_id: string
  structured_formatting?: {
    main_text: string
    secondary_text: string
  }
}

export function LocationPicker({
  onLocationSelect,
  currentLocation,
  placeholder = 'ابحث عن موقع أو اختر من الخريطة...',
  id,
  initialLocation,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showMap, setShowMap] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name?: string
  } | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    currentLocation || initialLocation || [24.7136, 46.6753]
  )

  // Fetch autocomplete suggestions from Google Places API
  const { data: autocompleteData, isLoading: isSearching, error: searchError } = useQuery({
    queryKey: ['places-autocomplete', searchQuery, mapCenter],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) {
        return { predictions: [] }
      }

      try {
        const locationParam = mapCenter ? `${mapCenter[0]},${mapCenter[1]}` : undefined
        console.log('🔍 Fetching autocomplete for:', searchQuery, 'location:', locationParam)
        
        // Detect if running in Capacitor (Android/iOS app)
        const isCapacitor = typeof window !== 'undefined' && (
          (window as any).Capacitor || 
          (window as any).Android || 
          (window as any).Capacitor?.getPlatform() === 'android' ||
          navigator.userAgent.includes('Capacitor') ||
          navigator.userAgent.includes('Android') ||
          window.location.protocol === 'capacitor:' ||
          window.location.hostname === 'localhost'
        )
        
        // Use full URL for Android app (Capacitor), relative URL for web
        const apiUrl = isCapacitor
          ? 'https://aqillah.vercel.app/api/places/autocomplete'
          : '/api/places/autocomplete'
        
        console.log('🌐 API URL:', apiUrl, 'isCapacitor:', isCapacitor, 'userAgent:', navigator.userAgent.substring(0, 50))
        
        const response = await axios.get(apiUrl, {
          params: {
            input: searchQuery,
            ...(locationParam && { location: locationParam }),
            radius: 50000, // 50km
          },
          timeout: 15000, // 15 seconds timeout
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Type': isCapacitor ? 'android' : 'web', // إضافة header للتمييز بين Android والويب
          },
        })

        console.log('✅ Autocomplete response:', response.data)
        
        // Ensure we return the correct format
        if (response.data && response.data.success !== undefined) {
          // API route format: { success: true, data: [...] }
          return response.data
        } else if (response.data && Array.isArray(response.data)) {
          // Direct array format
          return { data: response.data }
        } else if (response.data && response.data.predictions) {
          // Google API format
          return { data: response.data.predictions }
        } else {
          console.warn('⚠️ Unexpected response format:', response.data)
          return { data: [] }
        }
      } catch (error: any) {
        console.error('❌ Error fetching autocomplete:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
        throw error
      }
    },
    enabled: Boolean(searchQuery && searchQuery.length >= 2), // تأكد من أن searchQuery موجود
    staleTime: 30000, // Cache for 30 seconds
    retry: 2, // Retry twice on failure
    refetchOnWindowFocus: false, // لا تعيد الجلب عند التركيز على النافذة
  })

  const predictions: PlacePrediction[] = autocompleteData?.data || []

  // Handle selecting a place from autocomplete
  const handleSelectPlace = async (prediction: PlacePrediction) => {
      try {
        console.log('📍 Getting place details for:', prediction.place_id)
        
        // Detect if running in Capacitor (Android/iOS app)
        const isCapacitor = typeof window !== 'undefined' && (
          (window as any).Capacitor || 
          (window as any).Android || 
          (window as any).Capacitor?.getPlatform() === 'android' ||
          navigator.userAgent.includes('Capacitor') ||
          navigator.userAgent.includes('Android') ||
          window.location.protocol === 'capacitor:' ||
          window.location.hostname === 'localhost'
        )
        
        // Use full URL for Android app (Capacitor), relative URL for web
        const apiUrl = isCapacitor
          ? 'https://aqillah.vercel.app/api/places/details'
          : '/api/places/details'
        
        console.log('🌐 Place Details API URL:', apiUrl, 'isCapacitor:', isCapacitor, 'userAgent:', navigator.userAgent.substring(0, 50))
      
      // استخدام API route للحصول على تفاصيل المكان
      const response = await axios.get(apiUrl, {
        params: {
          place_id: prediction.place_id,
        },
        timeout: 15000, // 15 seconds timeout
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Type': isCapacitor ? 'android' : 'web', // إضافة header للتمييز بين Android والويب
        },
      })

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to get place details from API')
      }

      const placeDetails = response.data.data
      
      // التحقق من وجود البيانات المطلوبة
      if (!placeDetails.geometry || !placeDetails.geometry.location) {
        throw new Error('Invalid place details response')
      }
      
      const location = {
        lat: placeDetails.geometry.location.lat,
        lng: placeDetails.geometry.location.lng,
        name: prediction.description || prediction.structured_formatting?.main_text || 'موقع مختار',
      }
      
      console.log('✅ Location from place details API:', location)
      
      setSelectedLocation(location)
      setMapCenter([location.lat, location.lng])
      setSearchQuery(prediction.description)
      onLocationSelect(location)
    } catch (error: any) {
      console.error('❌ Error getting place details:', error)
      console.log('🔄 Trying geocoding API as fallback...')
      
      // محاولة استخدام Geocoding API للحصول على الإحداثيات من العنوان
      try {
        // Detect if running in Capacitor (Android/iOS app)
        const isCapacitor = typeof window !== 'undefined' && (
          (window as any).Capacitor || 
          (window as any).Android || 
          (window as any).Capacitor?.getPlatform() === 'android' ||
          navigator.userAgent.includes('Capacitor') ||
          navigator.userAgent.includes('Android') ||
          window.location.protocol === 'capacitor:' ||
          window.location.hostname === 'localhost'
        )
        
        const geocodeApiUrl = isCapacitor
          ? 'https://aqillah.vercel.app/api/places/geocode'
          : '/api/places/geocode'
        
        console.log('🌐 Geocode API URL:', geocodeApiUrl, 'isCapacitor:', isCapacitor, 'userAgent:', navigator.userAgent.substring(0, 50))
        
        const geocodeResponse = await axios.get(geocodeApiUrl, {
          params: {
            address: prediction.description,
          },
          timeout: 15000, // 15 seconds timeout
          headers: {
            'Content-Type': 'application/json',
            'X-Client-Type': isCapacitor ? 'android' : 'web', // إضافة header للتمييز بين Android والويب
          },
        })

        if (!geocodeResponse.data.success || !geocodeResponse.data.data) {
          throw new Error('Failed to geocode address')
        }

        const geocodeResult = geocodeResponse.data.data
        
        if (geocodeResult.results && geocodeResult.results.length > 0) {
          const firstResult = geocodeResult.results[0]
          
          // التحقق من وجود الإحداثيات
          if (!firstResult.geometry || !firstResult.geometry.location) {
            throw new Error('Invalid geocoding response')
          }
          
          const location = {
            lat: firstResult.geometry.location.lat,
            lng: firstResult.geometry.location.lng,
            name: prediction.description || prediction.structured_formatting?.main_text || 'موقع مختار',
          }
          
          console.log('✅ Location from geocoding API:', location)
          
          setSelectedLocation(location)
          setMapCenter([location.lat, location.lng])
          setSearchQuery(prediction.description)
          onLocationSelect(location)
        } else {
          throw new Error('No geocoding results found')
        }
      } catch (geocodeError: any) {
        console.error('❌ Error geocoding address:', geocodeError)
        console.error('Full error details:', {
          message: geocodeError.message,
          response: geocodeError.response?.data,
          status: geocodeError.response?.status,
        })
        
        // عرض رسالة خطأ واضحة
        const errorMessage = geocodeError.response?.data?.error || geocodeError.message || 'فشل في جلب إحداثيات المكان'
        toast.error(errorMessage)
        
        // إذا كان الخطأ متعلق بالـ billing، عرض رسالة خاصة
        if (geocodeError.response?.data?.billingRequired) {
          toast.error('يجب تفعيل Billing في Google Cloud Console', {
            duration: 5000,
          })
        }
      }
    }
  }

  const handleMapClick = (e: any) => {
    const { lat, lng } = e.latlng
    setSelectedLocation({
      lat,
      lng,
      name: `موقع مختار: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    })
    setMapCenter([lat, lng])
  }

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation)
      setShowMap(false)
    }
  }

  const handleUseCurrentLocation = () => {
    const defaultLocation = {
      lat: mapCenter[0],
      lng: mapCenter[1],
      name: `موقع مختار: ${mapCenter[0].toFixed(4)}, ${mapCenter[1].toFixed(4)}`,
    }
    setSelectedLocation(defaultLocation)
    onLocationSelect(defaultLocation)
  }

  return (
    <div className="space-y-4">
      {/* البحث - تصميم محسّن */}
      <div className="relative">
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowMap(false)}
          placeholder={placeholder}
          className="w-full pr-12 pl-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white shadow-sm hover:border-gray-300"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedLocation(null)
            }}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded-lg transition"
            title="مسح البحث"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* اقتراحات البحث من Google Places API - تصميم محسّن */}
      {searchQuery && searchQuery.length >= 2 && !showMap && (
        <div className="bg-white border-2 border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-y-auto z-50">
          {isSearching ? (
            <div className="flex items-center justify-center px-4 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600 ml-3" />
              <span className="text-gray-700 font-medium">جاري البحث...</span>
            </div>
          ) : searchError ? (
            <div className="px-4 py-8 text-center">
              <p className="text-red-600 mb-2 font-bold">⚠️ خطأ في البحث</p>
              <p className="text-sm text-gray-700 mb-3">
                {(() => {
                  const errorMsg = searchError instanceof Error ? searchError.message : String(searchError)
                  if (errorMsg.includes('Billing') || errorMsg.includes('REQUEST_DENIED')) {
                    return 'يجب تفعيل Billing في Google Cloud Console لاستخدام Places API'
                  }
                  return 'فشل الاتصال بخدمة البحث. تأكد من تفعيل Places API في Google Cloud Console.'
                })()}
              </p>
              {(searchError instanceof Error && searchError.message.includes('Billing')) || 
               (typeof searchError === 'object' && searchError !== null && 'message' in searchError && String(searchError.message).includes('Billing')) ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-3">
                  <p className="text-xs text-yellow-800 mb-2">
                    <strong>الحل:</strong> اذهب إلى Google Cloud Console وفعّل Billing
                  </p>
                  <a 
                    href="https://console.cloud.google.com/project/_/billing/enable" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    🔗 تفعيل Billing الآن
                  </a>
                  <p className="text-xs text-gray-600 mt-2">
                    ملاحظة: Google تعطي $200 مجاناً شهرياً لخدمات Maps Platform
                  </p>
                </div>
              ) : (
                <p className="text-xs text-gray-400 mt-2">
                  تحقق من Console (F12) لمزيد من التفاصيل
                </p>
              )}
            </div>
          ) : predictions.length > 0 ? (
            predictions.map((prediction, index) => (
              <button
                key={prediction.place_id || index}
                onClick={() => handleSelectPlace(prediction)}
                className="w-full text-right px-5 py-4 hover:bg-primary-50 transition-all duration-200 flex items-center gap-4 border-b border-gray-100 last:border-b-0 group"
              >
                <div className="p-2 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition">
                  <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
                </div>
                <div className="flex-1 text-right">
                  <div className="text-gray-900 font-semibold text-base mb-1">
                    {prediction.structured_formatting?.main_text || prediction.description}
                  </div>
                  {prediction.structured_formatting?.secondary_text && (
                    <div className="text-sm text-gray-500">
                      {prediction.structured_formatting.secondary_text}
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : searchQuery.length >= 2 ? (
            <div className="px-4 py-10 text-center">
              <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium mb-2">لا توجد نتائج للبحث</p>
              <p className="text-xs text-gray-500">
                جرب بحث آخر أو تحقق من تفعيل Places API
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* زر استخدام الموقع الحالي - تصميم محسّن */}
      {!showMap && !selectedLocation && (
        <div className="space-y-3">
          <button
            onClick={handleUseCurrentLocation}
            className="w-full py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 font-semibold flex items-center justify-center gap-3 shadow-lg"
          >
            <Navigation className="h-5 w-5" />
            استخدام الموقع الحالي
          </button>
          <p className="text-xs text-gray-500 text-center">
            يمكنك البحث عن موقع من القائمة أعلاه أو استخدام الموقع الحالي
          </p>
        </div>
      )}

      {/* الموقع المحدد - تصميم محسّن */}
      {selectedLocation && !showMap && (
        <div className="p-5 bg-gradient-to-r from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary-600 rounded-lg">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg mb-1">{selectedLocation.name}</p>
                <p className="text-sm text-gray-600 font-mono">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null)
                setSearchQuery('')
              }}
              className="p-2 hover:bg-primary-200 rounded-lg transition"
              title="إلغاء الاختيار"
            >
              <X className="h-5 w-5 text-gray-600 hover:text-gray-900" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

