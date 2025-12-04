'use client'

import { useState, useEffect, useCallback } from 'react'
import { MapPin, Search, X, Navigation, Loader2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { googleMapsService } from '@/lib/services/google-maps'

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
        
        const response = await axios.get('/api/places/autocomplete', {
          params: {
            input: searchQuery,
            location: locationParam,
            radius: 50000, // 50km
          },
        })

        console.log('✅ Autocomplete response:', response.data)
        return response.data
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
    enabled: searchQuery.length >= 2,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1, // Retry once on failure
  })

  const predictions: PlacePrediction[] = autocompleteData?.data || []

  // Handle selecting a place from autocomplete
  const handleSelectPlace = async (prediction: PlacePrediction) => {
    try {
      // Get place details to get coordinates
      const placeDetails = await googleMapsService.getPlaceDetails(prediction.place_id)
      
      const location = {
        lat: placeDetails.geometry.location.lat,
        lng: placeDetails.geometry.location.lng,
        name: prediction.description || prediction.structured_formatting?.main_text || 'موقع مختار',
      }
      
      setSelectedLocation(location)
      setMapCenter([location.lat, location.lng])
      setSearchQuery(prediction.description)
      onLocationSelect(location)
    } catch (error: any) {
      console.error('Error getting place details:', error)
      // Fallback: use description as name
      const location = {
        lat: mapCenter[0],
        lng: mapCenter[1],
        name: prediction.description,
      }
      setSelectedLocation(location)
      setSearchQuery(prediction.description)
      onLocationSelect(location)
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
      {/* البحث */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowMap(false)}
          placeholder={placeholder}
          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('')
              setSelectedLocation(null)
            }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* اقتراحات البحث من Google Places API */}
      {searchQuery && searchQuery.length >= 2 && !showMap && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center px-4 py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600 ml-2" />
              <span className="text-gray-600">جاري البحث...</span>
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
                className="w-full text-right px-4 py-3 hover:bg-gray-50 transition flex items-center gap-3 border-b border-gray-100 last:border-b-0"
              >
                <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
                <div className="flex-1 text-right">
                  <div className="text-gray-900 font-medium">
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
            <div className="px-4 py-8 text-center text-gray-500">
              <p>لا توجد نتائج للبحث</p>
              <p className="text-xs text-gray-400 mt-2">
                جرب بحث آخر أو تحقق من تفعيل Places API
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* زر استخدام الموقع الحالي */}
      {!showMap && !selectedLocation && (
        <div className="space-y-2">
          <button
            onClick={handleUseCurrentLocation}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium flex items-center justify-center gap-2"
          >
            <MapPin className="h-5 w-5" />
            استخدام الموقع الحالي
          </button>
          <p className="text-xs text-gray-500 text-center">
            يمكنك البحث عن موقع من القائمة أعلاه أو استخدام الموقع الحالي
          </p>
        </div>
      )}

      {/* الموقع المحدد */}
      {selectedLocation && !showMap && (
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary-600" />
              <div>
                <p className="font-medium text-gray-900">{selectedLocation.name}</p>
                <p className="text-sm text-gray-600">
                  {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedLocation(null)
                setSearchQuery('')
              }}
              className="p-2 hover:bg-primary-100 rounded-lg transition"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

