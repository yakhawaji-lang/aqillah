'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { WeatherInfoWindow } from './WeatherInfoWindow'
import { Navigation2 } from 'lucide-react'

// Declare google namespace for TypeScript
declare global {
  interface Window {
    google: any
  }
}

interface GoogleTrafficMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    lat: number
    lng: number
    title?: string
    icon?: string
    congestionIndex?: number
  }>
  route?: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
    waypoints?: Array<{ lat: number; lng: number }>
    polyline?: string
  } | Array<[number, number]> // Support both route object and coordinate array
  currentLocation?: [number, number] | null // Current user location for navigation
  showTrafficLayer?: boolean
  showWeatherLayer?: boolean
  showVisibilityLayer?: boolean
  showVisibilityForecast?: boolean
  selectedForecastDay?: number
  weatherSafetyData?: {
    safeRoutes?: any[]
    unsafeRoutes?: any[]
  } | null
  onMapClick?: (location: { lat: number; lng: number }) => void
  onTrafficPointClick?: (data: {
    lat: number
    lng: number
    congestionIndex: number
    roadName: string
    city: string
    avgSpeed: number
    deviceCount: number
    timestamp: string
  }) => void
  className?: string
}

export default function GoogleTrafficMap({
  center = { lat: 24.7136, lng: 46.6753 },
  zoom = 12,
  markers = [],
  route,
  currentLocation,
  showTrafficLayer = true,
  showWeatherLayer = false,
  showVisibilityLayer = false,
  showVisibilityForecast = false,
  selectedForecastDay = 0,
  weatherSafetyData = null,
  onMapClick,
  onTrafficPointClick,
  className = 'w-full h-96',
}: GoogleTrafficMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsRendererRef = useRef<any>(null)
  const routePolylineRef = useRef<any>(null)
  const currentLocationMarkerRef = useRef<any>(null)
  const originMarkerRef = useRef<any>(null)
  const destinationMarkerRef = useRef<any>(null)
  const directionMarkersRef = useRef<any[]>([])
  const weatherInfoWindowRef = useRef<any>(null)
  const weatherClickListenerRef = useRef<any>(null)
  const visibilityMarkersRef = useRef<any[]>([])
  const visibilityForecastMarkersRef = useRef<any[]>([])
  const unsafeRoutesMarkersRef = useRef<any[]>([])
  const lastRenderedRouteRef = useRef<string>('') // لتتبع آخر route تم رسمه
  const lastCenterRef = useRef<{ lat: number; lng: number } | null>(null)
  const lastZoomRef = useRef<number | null>(null)
  const [map, setMap] = useState<any>(null)
  const [directionsService, setDirectionsService] = useState<any>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<any>(null)
  const [trafficLayer, setTrafficLayer] = useState<any>(null)
  const [weatherMarkers, setWeatherMarkers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMapRefReady, setIsMapRefReady] = useState(false)
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Memoize markers to prevent unnecessary re-renders
  const memoizedMarkers = useMemo(() => markers, [JSON.stringify(markers)])

  // First effect: Wait for mapRef to be ready
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    const checkRef = () => {
      if (mapRef.current) {
        console.log('✅ Map ref is ready')
        setIsMapRefReady(true)
      } else {
        // Retry after a short delay
        requestAnimationFrame(() => {
          setTimeout(checkRef, 50)
        })
      }
    }
    // Start checking after a small delay to ensure component is mounted
    setTimeout(checkRef, 100)
  }, [])

  // Second effect: Load Google Maps when ref is ready
  useEffect(() => {
    if (!isMapRefReady) return

    const apiKey = process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error('Google Maps API key not found. Check .env file.')
      setError('مفتاح Google Maps غير موجود. تأكد من إضافة NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY في ملف .env')
      setIsLoading(false)
      return
    }

    console.log('🚀 Loading Google Maps with API key:', apiKey.substring(0, 10) + '...')

    // Check if Loader is available
    if (typeof Loader === 'undefined') {
      console.error('@googlemaps/js-api-loader not loaded')
      setError('فشل تحميل مكتبة Google Maps. تأكد من تثبيت @googlemaps/js-api-loader')
      setIsLoading(false)
      return
    }

    if (!mapRef.current) {
      console.error('❌ Map ref is null')
      setError('فشل تحميل الخريطة: العنصر غير موجود')
      setIsLoading(false)
      return
    }

    console.log('✅ Map ref is ready, loading Google Maps...')

      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'routes', 'geometry'],
      })

      loader
        .load()
        .then((google) => {
          console.log('✅ Google Maps loaded successfully')
          // Store google in window for TypeScript
          ;(window as any).google = google
          
          if (!mapRef.current) {
            console.error('❌ Map ref is null after load')
            setError('فشل إنشاء الخريطة: العنصر غير موجود')
            setIsLoading(false)
            return
          }

        // Create map
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
          },
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
        })

        console.log('Map instance created')
        mapInstanceRef.current = mapInstance
        setMap(mapInstance)

        // Enable Traffic Layer (طبقة المرور)
        if (showTrafficLayer) {
          try {
            const trafficLayerInstance = new google.maps.TrafficLayer()
            trafficLayerInstance.setMap(mapInstance)
            setTrafficLayer(trafficLayerInstance)
            console.log('Traffic layer enabled')
          } catch (err) {
            console.error('Error enabling traffic layer:', err)
          }
        }

        // Create directions service
        const directionsServiceInstance = new google.maps.DirectionsService()
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: false,
          preserveViewport: false,
          polylineOptions: {
            strokeColor: '#006633',
            strokeWeight: 5,
            strokeOpacity: 0.8,
          },
        })

        directionsRendererRef.current = directionsRendererInstance
        setDirectionsService(directionsServiceInstance)
        setDirectionsRenderer(directionsRendererInstance)

        // Add click listener for map clicks
        if (onMapClick || onTrafficPointClick) {
          mapInstance.addListener('click', async (e: any) => {
            if (!e.latLng) return
            
            const clickedLat = e.latLng.lat()
            const clickedLng = e.latLng.lng()
            
            // Call basic map click handler
            if (onMapClick) {
              onMapClick({
                lat: clickedLat,
                lng: clickedLng,
              })
            }
            
            // If traffic point click handler exists, fetch traffic data
            if (onTrafficPointClick) {
              try {
                // Show loading indicator
                const loadingInfoWindow = new google.maps.InfoWindow({
                  content: '<div style="padding: 10px; text-align: center; direction: rtl;">⏳ جاري جلب بيانات الازدحام...</div>',
                  position: { lat: clickedLat, lng: clickedLng },
                })
                loadingInfoWindow.open(mapInstance)
                
                // Fetch traffic data for this point
                const response = await fetch(`/api/traffic/point?lat=${clickedLat}&lng=${clickedLng}&city=${center.lat > 20 ? 'الرياض' : 'جدة'}`)
                const result = await response.json()
                
                loadingInfoWindow.close()
                
                if (result.success && result.data) {
                  // Call the handler with traffic data
                  onTrafficPointClick({
                    lat: result.data.position[0],
                    lng: result.data.position[1],
                    congestionIndex: result.data.congestionIndex,
                    roadName: result.data.roadName,
                    city: result.data.city,
                    avgSpeed: result.data.avgSpeed,
                    deviceCount: result.data.deviceCount,
                    timestamp: result.data.timestamp,
                  })
                  
                  // Show success message
                  const successInfoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 12px; direction: rtl; text-align: right;">
                        <div style="font-weight: bold; color: #10b981; margin-bottom: 8px;">
                          ✅ تم إضافة الموقع
                        </div>
                        <div style="font-size: 14px; color: #374151;">
                          <div><strong>الطريق:</strong> ${result.data.roadName}</div>
                          <div><strong>مستوى الازدحام:</strong> ${result.data.congestionIndex}%</div>
                          <div style="margin-top: 8px; font-size: 12px; color: #6b7280;">
                            تمت إضافته إلى قائمة الطرق المراقبة 111
                          </div>
                        </div>
                      </div>
                    `,
                    position: { lat: clickedLat, lng: clickedLng },
                  })
                  successInfoWindow.open(mapInstance)
                  
                  // Auto-close after 3 seconds
                  setTimeout(() => {
                    successInfoWindow.close()
                  }, 3000)
                } else {
                  // Show error message
                  const errorInfoWindow = new google.maps.InfoWindow({
                    content: `
                      <div style="padding: 12px; direction: rtl; text-align: right;">
                        <div style="font-weight: bold; color: #ef4444; margin-bottom: 8px;">
                          ⚠️ فشل جلب البيانات
                        </div>
                        <div style="font-size: 12px; color: #6b7280;">
                          ${result.error || 'لا توجد بيانات ازدحام في هذا الموقع'}
                        </div>
                      </div>
                    `,
                    position: { lat: clickedLat, lng: clickedLng },
                  })
                  errorInfoWindow.open(mapInstance)
                  
                  setTimeout(() => {
                    errorInfoWindow.close()
                  }, 3000)
                }
              } catch (error: any) {
                console.error('Error fetching traffic data for clicked point:', error)
                const errorInfoWindow = new google.maps.InfoWindow({
                  content: `
                    <div style="padding: 12px; direction: rtl; text-align: right;">
                      <div style="font-weight: bold; color: #ef4444;">
                        ⚠️ خطأ في الاتصال
                      </div>
                    </div>
                  `,
                  position: { lat: clickedLat, lng: clickedLng },
                })
                errorInfoWindow.open(mapInstance)
                setTimeout(() => {
                  errorInfoWindow.close()
                }, 3000)
              }
            }
          })
        }

        setIsLoading(false)
        console.log('✅ Map setup complete')
      })
      .catch((err) => {
        console.error('❌ Error loading Google Maps:', err)
        console.error('Error details:', {
          message: err.message,
          stack: err.stack,
          name: err.name,
        })
        
        let errorMessage = 'فشل تحميل Google Maps'
        if (err.message) {
          if (err.message.includes('InvalidKeyMapError')) {
            errorMessage = 'مفتاح API غير صحيح. تحقق من Google Cloud Console'
          } else if (err.message.includes('RefererNotAllowedMapError')) {
            errorMessage = 'المفتاح غير مصرح به لهذا الموقع. أضف localhost:3000/* في القيود'
          } else if (err.message.includes('not authorized')) {
            errorMessage = 'المفتاح غير مصرح به. فعل Maps JavaScript API في Google Cloud Console'
          } else {
            errorMessage = `خطأ: ${err.message}`
          }
        }
        
        setError(errorMessage)
        setIsLoading(false)
      })

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up map component')
      // Clean up markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.setMap) {
            marker.setMap(null)
          }
        })
        markersRef.current = []
      }
      // Clean up directions renderer
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null)
        directionsRendererRef.current = null
      }
      // Clean up route markers
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null)
        originMarkerRef.current = null
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null)
        destinationMarkerRef.current = null
      }
      if (routePolylineRef.current) {
        routePolylineRef.current.setMap(null)
        routePolylineRef.current = null
      }
      directionMarkersRef.current.forEach((marker) => {
        if (marker) marker.setMap(null)
      })
      directionMarkersRef.current = []
      // Clean up map instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null
      }
    }
  }, [isMapRefReady])

  // Update map center - فقط عند تغيير center أو zoom بشكل فعلي
  useEffect(() => {
    if (mapInstanceRef.current && map && center) {
      // تجنب التحديث إذا كان نفس المركز والزوم
      const centerChanged = !lastCenterRef.current || 
        lastCenterRef.current.lat !== center.lat || 
        lastCenterRef.current.lng !== center.lng
      const zoomChanged = lastZoomRef.current !== zoom
      
      if (centerChanged || zoomChanged) {
        try {
          mapInstanceRef.current.setCenter(center)
          mapInstanceRef.current.setZoom(zoom)
          lastCenterRef.current = center
          lastZoomRef.current = zoom
        } catch (err) {
          console.error('Error updating map center:', err)
        }
      }
    }
  }, [map, center, zoom])

  // Add markers with congestion colors
  useEffect(() => {
    if (!map || !(window as any).google || !mapInstanceRef.current) return

    // Clean up existing markers first
    if (markersRef.current.length > 0) {
      markersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      markersRef.current = []
    }

    const googleMarkers: any[] = []

    markers.forEach((marker) => {
      // Determine marker color based on congestion
      let iconColor = '#4CAF50' // Green (low congestion)
      if (marker.congestionIndex !== undefined) {
        if (marker.congestionIndex >= 80) {
          iconColor = '#F44336' // Red (high congestion)
        } else if (marker.congestionIndex >= 50) {
          iconColor = '#FF9800' // Orange (medium congestion)
        } else if (marker.congestionIndex >= 30) {
          iconColor = '#FFEB3B' // Yellow (low-medium congestion)
        }
      }

      const icon = marker.icon
        ? undefined
        : (window as any).google
          ? {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: iconColor,
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
            }
          : undefined

      try {
        const googleMarker = new (window as any).google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          map: mapInstanceRef.current,
          title: marker.title,
          icon: icon,
        })

        // Add info window for congestion
        if (marker.congestionIndex !== undefined) {
          const infoWindow = new (window as any).google.maps.InfoWindow({
            content: `
              <div style="padding: 8px;">
                <strong>${marker.title || 'موقع'}</strong><br/>
                مؤشر الازدحام: ${marker.congestionIndex}/100
              </div>
            `,
          })

          googleMarker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current, googleMarker)
          })
        }

        googleMarkers.push(googleMarker)
      } catch (err) {
        console.error('Error creating marker:', err)
      }
    })

    markersRef.current = googleMarkers

    return () => {
      // Clean up markers
      if (markersRef.current.length > 0) {
        markersRef.current.forEach((marker) => {
          if (marker && marker.setMap) {
            try {
              marker.setMap(null)
            } catch (err) {
              console.error('Error removing marker:', err)
            }
          }
        })
        markersRef.current = []
      }
    }
  }, [map, memoizedMarkers])

  // Render route
  useEffect(() => {
    if (!(window as any).google || !mapInstanceRef.current) return

    // Clear previous route polyline
    if (routePolylineRef.current) {
      routePolylineRef.current.setMap(null)
      routePolylineRef.current = null
    }

    // Handle route as coordinate array
    if (Array.isArray(route) && route.length > 0) {
      // بناء المسار: إذا كان هناك موقع حالي، ابدأ منه، وإلا ابدأ من نقطة البداية
      let path: Array<{ lat: number; lng: number }> = []
      
      // إذا كان هناك موقع حالي، أضفه في البداية
      if (currentLocation && currentLocation.length === 2) {
        path.push({
          lat: currentLocation[0],
          lng: currentLocation[1],
        })
      }
      
      // إضافة باقي نقاط المسار
      route.forEach((coord) => {
        path.push({
          lat: coord[0],
          lng: coord[1],
        })
      })

      // Clear previous markers
      if (originMarkerRef.current) {
        originMarkerRef.current.setMap(null)
        originMarkerRef.current = null
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setMap(null)
        destinationMarkerRef.current = null
      }
      directionMarkersRef.current.forEach((marker) => {
        if (marker) marker.setMap(null)
      })
      directionMarkersRef.current = []

      // رسم المسار كخط متصل يتبع الطريق
      routePolylineRef.current = new (window as any).google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#4285F4',
        strokeOpacity: 0.9,
        strokeWeight: 8,
        map: mapInstanceRef.current,
      })

      // إضافة علامة البداية (الأخضر) - من موقع المستخدم الحالي إذا كان متاحاً
      if (path.length > 0) {
        const startPosition = currentLocation && currentLocation.length === 2
          ? { lat: currentLocation[0], lng: currentLocation[1] }
          : path[0]
        
        originMarkerRef.current = new (window as any).google.maps.Marker({
          position: startPosition,
          map: mapInstanceRef.current,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          title: currentLocation ? 'موقعك الحالي' : 'نقطة البداية',
          zIndex: 1000,
        })
      }

      // إضافة علامة النهاية (الأحمر)
      if (path.length > 1) {
        destinationMarkerRef.current = new (window as any).google.maps.Marker({
          position: path[path.length - 1],
          map: mapInstanceRef.current,
          icon: {
            path: (window as any).google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
          },
          title: 'الوجهة',
          zIndex: 1000,
        })
      }

      // لا حاجة لأسهم الاتجاه - الخط المتصل يتبع الطريق

      // Fit bounds to show entire route
      const bounds = new (window as any).google.maps.LatLngBounds()
      path.forEach((point) => bounds.extend(point))
      mapInstanceRef.current.fitBounds(bounds)

      return () => {
        if (routePolylineRef.current) {
          routePolylineRef.current.setMap(null)
          routePolylineRef.current = null
        }
        if (originMarkerRef.current) {
          originMarkerRef.current.setMap(null)
          originMarkerRef.current = null
        }
        if (destinationMarkerRef.current) {
          destinationMarkerRef.current.setMap(null)
          destinationMarkerRef.current = null
        }
        directionMarkersRef.current.forEach((marker) => {
          if (marker) marker.setMap(null)
        })
        directionMarkersRef.current = []
      }
    }

    // Handle route as object (original format) - استخدام Directions API
    if (route && typeof route === 'object' && 'origin' in route && directionsService && directionsRendererRef.current) {
      // Clear previous route first
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setDirections({ routes: [] })
      }

      // إنشاء مفتاح فريد للمسار لتجنب إعادة الرسم غير الضرورية
      const routeKey = `${route.origin.lat},${route.origin.lng}-${route.destination.lat},${route.destination.lng}`
      
      // إذا كان نفس المسار، لا تعيد الرسم
      if (lastRenderedRouteRef.current === routeKey) {
        return
      }
      
      lastRenderedRouteRef.current = routeKey
      
      // A: دائماً استخدام الموقع الحالي كـ origin (موقعك الحالي)
      const originToUse = currentLocation && currentLocation.length === 2
        ? { lat: currentLocation[0], lng: currentLocation[1] } // A: موقعك الحالي دائماً
        : { lat: route.origin.lat, lng: route.origin.lng } // A: نقطة البداية إذا لم يكن هناك موقع حالي
      
      // B: الوجهة المحددة
      const destinationToUse = { lat: route.destination.lat, lng: route.destination.lng } // B: الوجهة

      const request: any = {
        origin: originToUse, // A: موقعك الحالي
        destination: destinationToUse, // B: الوجهة المحددة
        travelMode: (window as any).google.maps.TravelMode.DRIVING,
        ...(route.waypoints && route.waypoints.length > 0 && {
          waypoints: route.waypoints.map((wp: any) => ({
            location: { lat: wp.lat, lng: wp.lng },
            stopover: false,
          })),
        }),
        provideRouteAlternatives: false,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: (window as any).google.maps.TrafficModel.BEST_GUESS,
        },
      }

      directionsService.route(request, (result: any, status: any) => {
        if (status === (window as any).google.maps.DirectionsStatus.OK && result && directionsRendererRef.current && mapInstanceRef.current) {
          try {
            // تحديث DirectionsRenderer لعرض المسار الفعلي على الطرق
            directionsRendererRef.current.setDirections(result)
            
            // تحديث خيارات الخط ليكون أكثر وضوحاً
            directionsRendererRef.current.setOptions({
              polylineOptions: {
                strokeColor: '#4285F4',
                strokeWeight: 8,
                strokeOpacity: 0.9,
              },
              suppressMarkers: false, // إظهار العلامات (A و B)
              preserveViewport: false,
            })
            
            // Fit bounds to show entire route
            const bounds = new (window as any).google.maps.LatLngBounds()
            result.routes[0].legs.forEach((leg: any) => {
              bounds.extend(leg.start_location) // A: نقطة البداية
              bounds.extend(leg.end_location) // B: نقطة النهاية
            })
            mapInstanceRef.current.fitBounds(bounds)
            
            // جلب بيانات الطقس للمسار لحساب التأخير الإضافي
            const fetchWeatherDelay = async () => {
              try {
                // حساب نقطة المنتصف للمسار
                const midPoint = {
                  lat: (originToUse.lat + route.destination.lat) / 2,
                  lng: (originToUse.lng + route.destination.lng) / 2,
                }
                
                const weatherResponse = await fetch(`/api/weather/point?lat=${midPoint.lat}&lng=${midPoint.lng}`)
                const weatherData = await weatherResponse.json()
                
                // حساب التأخير بسبب الطقس
                let weatherDelay = 0
                if (weatherData.success && weatherData.data?.current) {
                  const weather = weatherData.data.current
                  // زيادة الوقت بنسبة 10-30% حسب حالة الطقس
                  if (weather.condition?.toLowerCase().includes('rain') || weather.condition?.toLowerCase().includes('storm')) {
                    weatherDelay = 0.3 // 30% زيادة
                  } else if (weather.condition?.toLowerCase().includes('fog') || weather.condition?.toLowerCase().includes('mist')) {
                    weatherDelay = 0.2 // 20% زيادة
                  } else if (weather.condition?.toLowerCase().includes('cloud')) {
                    weatherDelay = 0.1 // 10% زيادة
                  }
                }
                
                // إرسال بيانات المسار المحدثة مع تأثير الطقس
                const baseDuration = result.routes[0].legs[0].duration?.value / 60 || 0
                const trafficDuration = result.routes[0].legs[0].duration_in_traffic?.value / 60 || baseDuration
                const finalDuration = trafficDuration * (1 + weatherDelay)
                
                const routeData = {
                  distance: result.routes[0].legs[0].distance?.value / 1000, // بالكيلومتر
                  duration: baseDuration, // بالدقائق بدون ازدحام
                  durationInTraffic: trafficDuration, // بالدقائق مع الازدحام
                  durationWithWeather: finalDuration, // بالدقائق مع الازدحام والطقس
                  weatherDelay: weatherDelay * 100, // نسبة التأخير بسبب الطقس
                }
                
                // إرسال حدث مخصص لتحديث البيانات في صفحة التوجيه
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('routeUpdated', { detail: routeData }))
                }
                
                console.log('✅ Route rendered using Directions API', {
                  origin: originToUse, // A: موقعك الحالي
                  destination: { lat: route.destination.lat, lng: route.destination.lng }, // B: الوجهة
                  distance: result.routes[0].legs[0].distance?.text,
                  duration: result.routes[0].legs[0].duration?.text,
                  durationInTraffic: result.routes[0].legs[0].duration_in_traffic?.text,
                  weatherDelay: `${(weatherDelay * 100).toFixed(0)}%`,
                })
              } catch (error) {
                console.error('Error fetching weather data:', error)
                // إرسال البيانات بدون تأثير الطقس في حالة الخطأ
                const routeData = {
                  distance: result.routes[0].legs[0].distance?.value / 1000,
                  duration: result.routes[0].legs[0].duration?.value / 60,
                  durationInTraffic: result.routes[0].legs[0].duration_in_traffic?.value / 60,
                }
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('routeUpdated', { detail: routeData }))
                }
              }
            }
            
            fetchWeatherDelay()
          } catch (err) {
            console.error('Error rendering route:', err)
          }
        } else {
          console.error('Directions request failed:', status)
        }
      })

      return () => {
        // Clear route on cleanup
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setDirections({ routes: [] })
        }
      }
    }
  }, [directionsService, route, map, currentLocation])

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }, [])

  // Function to center map on user location
  const centerOnUserLocation = useCallback(() => {
    if (!mapInstanceRef.current) return

    if (userLocation && userLocation.length === 2) {
      mapInstanceRef.current.setCenter({ lat: userLocation[0], lng: userLocation[1] })
      mapInstanceRef.current.setZoom(16)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [position.coords.latitude, position.coords.longitude]
          setUserLocation(location)
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setCenter({ lat: location[0], lng: location[1] })
            mapInstanceRef.current.setZoom(16)
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('فشل في الحصول على موقعك. تأكد من تفعيل صلاحيات الموقع.')
        }
      )
    }
  }, [userLocation])

  // Render current location marker
  useEffect(() => {
    if (!(window as any).google || !mapInstanceRef.current) return

    // Clear previous current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null)
      currentLocationMarkerRef.current = null
    }

    // Use currentLocation prop if available, otherwise use userLocation
    const locationToShow = currentLocation || userLocation

    if (locationToShow && locationToShow.length === 2) {
      currentLocationMarkerRef.current = new (window as any).google.maps.Marker({
        position: { lat: locationToShow[0], lng: locationToShow[1] },
        map: mapInstanceRef.current,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 4,
        },
        title: 'موقعك الحالي',
        zIndex: 1000,
      })

      // Center map on current location if currentLocation prop is provided
      if (currentLocation) {
        mapInstanceRef.current.setCenter({ lat: currentLocation[0], lng: currentLocation[1] })
        mapInstanceRef.current.setZoom(16)
      }
    }

    return () => {
      if (currentLocationMarkerRef.current) {
        currentLocationMarkerRef.current.setMap(null)
        currentLocationMarkerRef.current = null
      }
    }
  }, [currentLocation, userLocation, map])

  // Toggle traffic layer
  useEffect(() => {
    if (trafficLayer && mapInstanceRef.current) {
      try {
        if (showTrafficLayer) {
          trafficLayer.setMap(mapInstanceRef.current)
        } else {
          trafficLayer.setMap(null)
        }
      } catch (err) {
        console.error('Error toggling traffic layer:', err)
      }
    }
  }, [trafficLayer, showTrafficLayer])

  // Add/remove weather click listener
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google) {
      return
    }

    // Remove previous listener if exists
    if (weatherClickListenerRef.current) {
      (window as any).google.maps.event.removeListener(weatherClickListenerRef.current)
      weatherClickListenerRef.current = null
    }

    // Add new listener if weather layer is enabled
    if (showWeatherLayer) {
      const handleMapClick = async (e: any) => {
        if (!e.latLng) return

        const location = {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        }

        try {
          console.log('🌤️ Fetching weather for:', location)
          const response = await fetch(`/api/weather/point?lat=${location.lat}&lng=${location.lng}`)
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }
          
          const data = await response.json()
          console.log('🌤️ Weather data received:', data)
          
          if (data.success && data.data) {
            // Close previous info window
            if (weatherInfoWindowRef.current) {
              weatherInfoWindowRef.current.close()
            }
            
            // Create weather info window content
            const content = WeatherInfoWindow({ 
              weather: data.data.current,
              alerts: data.data.alerts 
            })
            
            const infoWindow = new (window as any).google.maps.InfoWindow({
              content,
              position: location,
            })
            
            infoWindow.open(mapInstanceRef.current)
            weatherInfoWindowRef.current = infoWindow
            console.log('✅ Weather info window opened')
          } else {
            console.error('❌ Weather API returned unsuccessful response:', data)
            // Show error message
            const errorContent = `
              <div style="padding: 12px; direction: rtl; min-width: 200px;">
                <p style="color: #dc2626; font-weight: bold; margin-bottom: 8px;">⚠️ خطأ في جلب بيانات الطقس</p>
                <p style="color: #6b7280; font-size: 12px;">
                  ${data.error || 'فشل الاتصال بخادم الطقس'}
                </p>
              </div>
            `
            const errorWindow = new (window as any).google.maps.InfoWindow({
              content: errorContent,
              position: location,
            })
            errorWindow.open(mapInstanceRef.current)
          }
        } catch (err: any) {
          console.error('❌ Error fetching weather:', err)
          // Show error message to user
          const errorContent = `
            <div style="padding: 12px; direction: rtl; min-width: 200px;">
              <p style="color: #dc2626; font-weight: bold; margin-bottom: 8px;">⚠️ خطأ في جلب بيانات الطقس</p>
              <p style="color: #6b7280; font-size: 12px; margin-bottom: 4px;">
                ${err.message || 'فشل الاتصال بخادم الطقس'}
              </p>
              <p style="color: #9ca3af; font-size: 11px;">
                تأكد من إضافة OPENWEATHER_API_KEY في ملف .env
              </p>
            </div>
          `
          const errorWindow = new (window as any).google.maps.InfoWindow({
            content: errorContent,
            position: location,
          })
          errorWindow.open(mapInstanceRef.current)
        }
      }

      weatherClickListenerRef.current = (window as any).google.maps.event.addListener(
        mapInstanceRef.current,
        'click',
        handleMapClick
      )
    }

    return () => {
      if (weatherClickListenerRef.current) {
        (window as any).google.maps.event.removeListener(weatherClickListenerRef.current)
        weatherClickListenerRef.current = null
      }
      if (weatherInfoWindowRef.current) {
        weatherInfoWindowRef.current.close()
        weatherInfoWindowRef.current = null
      }
    }
  }, [showWeatherLayer, map])

  // Add weather markers when weather layer is enabled
  useEffect(() => {
    if (!showWeatherLayer || !mapInstanceRef.current || !(window as any).google || !markers.length) {
      // Clean up weather markers when disabled
      weatherMarkers.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      if (weatherMarkers.length > 0) {
        setWeatherMarkers([])
      }
      return
    }

    // Clean up previous weather markers
    weatherMarkers.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
    setWeatherMarkers([])

    // Fetch weather for each marker
    const fetchWeatherForMarkers = async () => {
      const newWeatherMarkers: any[] = []
      
      for (const marker of markers) {
        try {
          const response = await fetch(`/api/weather/point?lat=${marker.lat}&lng=${marker.lng}`)
          const data = await response.json()
          
          if (data.success && data.data) {
            const weather = data.data.current
            
            // Create weather icon based on condition
            const getWeatherIcon = (condition: string) => {
              const conditionLower = condition.toLowerCase()
              if (conditionLower.includes('rain')) return '🌧️'
              if (conditionLower.includes('fog')) return '🌫️'
              if (conditionLower.includes('cloud')) return '☁️'
              if (conditionLower.includes('sun')) return '☀️'
              if (conditionLower.includes('storm')) return '⛈️'
              return '🌤️'
            }
            
            // Determine color based on weather alerts
            let iconColor = '#4CAF50' // Green (good weather)
            if (data.data.alerts && data.data.alerts.length > 0) {
              const hasCritical = data.data.alerts.some((a: any) => a.level === 'critical')
              const hasHigh = data.data.alerts.some((a: any) => a.level === 'high')
              iconColor = hasCritical ? '#F44336' : hasHigh ? '#FF9800' : '#FFEB3B'
            }
            
            const weatherMarker = new (window as any).google.maps.Marker({
              position: { lat: marker.lat, lng: marker.lng },
              map: mapInstanceRef.current,
              icon: {
                path: (window as any).google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: iconColor,
                fillOpacity: 0.7,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              title: `${getWeatherIcon(weather.condition)} ${weather.temperature.toFixed(0)}°م`,
            })
            
            // Add click listener to show weather info
            weatherMarker.addListener('click', () => {
              // Close previous info window
              if (weatherInfoWindowRef.current) {
                weatherInfoWindowRef.current.close()
              }
              
              const content = WeatherInfoWindow({ 
                weather: weather,
                alerts: data.data.alerts 
              })
              
              const infoWindow = new (window as any).google.maps.InfoWindow({
                content,
                position: { lat: marker.lat, lng: marker.lng },
              })
              
              infoWindow.open(mapInstanceRef.current, weatherMarker)
              weatherInfoWindowRef.current = infoWindow
            })
            
            newWeatherMarkers.push(weatherMarker)
          }
        } catch (err) {
          console.error('Error fetching weather for marker:', err)
        }
      }
      
      setWeatherMarkers(newWeatherMarkers)
    }
    
    fetchWeatherForMarkers()
    
    return () => {
      weatherMarkers.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      setWeatherMarkers([])
    }
  }, [showWeatherLayer, map, markers])

  // Add visibility markers for poor visibility roads
  useEffect(() => {
    if (!showVisibilityLayer || !mapInstanceRef.current || !(window as any).google) {
      // Clean up markers when disabled
      visibilityMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      visibilityMarkersRef.current = []
      return
    }

    // Clean up previous markers
    visibilityMarkersRef.current.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
    visibilityMarkersRef.current = []

    // Fetch poor visibility segments
    const fetchPoorVisibilitySegments = async () => {
      try {
        const response = await fetch('/api/visibility/current')
        const data = await response.json()

        if (data.success && data.data) {
          const newMarkers: any[] = []

          data.data.forEach((segment: any) => {
            // Determine marker color based on visibility
            let iconColor = '#FF9800' // Orange (moderate)
            if (segment.visibility < 100) {
              iconColor = '#F44336' // Red (critical)
            } else if (segment.visibility < 200) {
              iconColor = '#FF5722' // Deep Orange (high)
            }

            const visibilityMarker = new (window as any).google.maps.Marker({
              position: { lat: segment.position[0], lng: segment.position[1] },
              map: mapInstanceRef.current,
              icon: {
                path: (window as any).google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: iconColor,
                fillOpacity: 0.8,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              title: `رؤية سيئة: ${segment.roadName} - ${segment.visibility.toFixed(0)}م`,
            })

            // Add click listener
            visibilityMarker.addListener('click', () => {
              const content = `
                <div style="padding: 12px; direction: rtl; min-width: 250px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                    <span style="font-size: 32px;">🌫️</span>
                    <div>
                      <div style="font-size: 18px; font-weight: bold; color: #111827;">
                        ${segment.roadName}
                      </div>
                      <div style="font-size: 14px; color: #dc2626; font-weight: 500;">
                        رؤية سيئة: ${segment.visibility.toFixed(0)} متر
                      </div>
                    </div>
                  </div>
                  <div style="font-size: 12px; color: #374151;">
                    <div style="margin-bottom: 6px;">
                      <strong>المدينة:</strong> ${segment.city}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <strong>الحالة:</strong> ${segment.condition}
                    </div>
                    ${segment.alerts && segment.alerts.length > 0 ? `
                      <div style="margin-top: 8px;">
                        <strong>تحذيرات:</strong>
                        ${segment.alerts.map((alert: any) => `
                          <div style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 4px; margin-top: 4px; font-size: 11px;">
                            ⚠️ ${alert.message}
                          </div>
                        `).join('')}
                      </div>
                    ` : ''}
                  </div>
                </div>
              `

              const infoWindow = new (window as any).google.maps.InfoWindow({
                content,
                position: { lat: segment.position[0], lng: segment.position[1] },
              })

              infoWindow.open(mapInstanceRef.current, visibilityMarker)
            })

            newMarkers.push(visibilityMarker)
          })

          visibilityMarkersRef.current = newMarkers
        }
      } catch (err) {
        console.error('Error fetching poor visibility segments:', err)
      }
    }

    fetchPoorVisibilitySegments()

    return () => {
      visibilityMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      visibilityMarkersRef.current = []
    }
  }, [showVisibilityLayer, map])

  // Add visibility forecast markers
  useEffect(() => {
    if (!showVisibilityForecast || !mapInstanceRef.current || !(window as any).google) {
      // Clean up markers when disabled
      visibilityForecastMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      visibilityForecastMarkersRef.current = []
      return
    }

    // Clean up previous markers
    visibilityForecastMarkersRef.current.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
    visibilityForecastMarkersRef.current = []

    // Fetch forecasted poor visibility segments
    const fetchForecastedPoorVisibility = async () => {
      try {
        const response = await fetch(`/api/visibility/forecast?days=16&dayIndex=${selectedForecastDay}`)
        const data = await response.json()

        if (data.success && data.data) {
          const newMarkers: any[] = []

          data.data.forEach((segment: any) => {
            // Filter forecasted dates for the selected day only
            const selectedDayDate = (() => {
              const date = new Date()
              date.setDate(date.getDate() + selectedForecastDay)
              return date.toISOString().split('T')[0] // Get YYYY-MM-DD format
            })()
            
            const matchingDates = segment.forecastedDates.filter((fd: any) => {
              const forecastDate = new Date(fd.date).toISOString().split('T')[0]
              return forecastDate === selectedDayDate
            })

            // Only show marker if there's a match for the selected day
            if (matchingDates.length === 0) return

            const matchingDate = matchingDates[0]
            const date = new Date(matchingDate.date)
            const dateStr = date.toLocaleDateString('ar-SA', {
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
            
            // Use purple color for forecast markers
            const forecastMarker = new (window as any).google.maps.Marker({
              position: { lat: segment.position[0], lng: segment.position[1] },
              map: mapInstanceRef.current,
              icon: {
                path: (window as any).google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#9C27B0', // Purple
                fillOpacity: 0.7,
                strokeColor: '#FFFFFF',
                strokeWeight: 2,
              },
              title: `تنبؤ رؤية سيئة: ${segment.roadName} - ${dateStr}`,
            })

            // Add click listener
            forecastMarker.addListener('click', () => {
              const fullDateStr = date.toLocaleDateString('ar-SA', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })

              const content = `
                <div style="padding: 12px; direction: rtl; min-width: 280px;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                    <span style="font-size: 32px;">🔮</span>
                    <div>
                      <div style="font-size: 18px; font-weight: bold; color: #111827;">
                        ${segment.roadName}
                      </div>
                      <div style="font-size: 14px; color: #9c27b0; font-weight: 500;">
                        تنبؤ رؤية سيئة
                      </div>
                      <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                        ✅ بيانات من OpenWeatherMap API
                      </div>
                    </div>
                  </div>
                  <div style="font-size: 12px; color: #374151; margin-bottom: 8px;">
                    <strong>المدينة:</strong> ${segment.city}
                  </div>
                  <div style="margin-top: 12px; padding: 12px; background: #fef3c7; border-radius: 8px; border-right: 4px solid #f59e0b;">
                    <div style="font-size: 13px; font-weight: bold; color: #92400e; margin-bottom: 8px;">
                      📅 التاريخ المحدد:
                    </div>
                    <div style="font-size: 14px; color: #78350f; margin-bottom: 8px;">
                      ${fullDateStr}
                    </div>
                    <div style="font-size: 12px; color: #92400e;">
                      <strong>الرؤية:</strong> ${matchingDate.visibility.toFixed(0)} متر
                    </div>
                    <div style="font-size: 12px; color: #92400e; margin-top: 4px;">
                      <strong>الحالة:</strong> ${matchingDate.condition}
                    </div>
                  </div>
                </div>
              `

              const infoWindow = new (window as any).google.maps.InfoWindow({
                content,
                position: { lat: segment.position[0], lng: segment.position[1] },
              })

              infoWindow.open(mapInstanceRef.current, forecastMarker)
            })

            newMarkers.push(forecastMarker)
          })

          visibilityForecastMarkersRef.current = newMarkers
        }
      } catch (err) {
        console.error('Error fetching visibility forecast:', err)
      }
    }

    fetchForecastedPoorVisibility()

    return () => {
      visibilityForecastMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      visibilityForecastMarkersRef.current = []
    }
  }, [showVisibilityForecast, selectedForecastDay, map])

  // Add unsafe routes markers with comprehensive weather alerts
  useEffect(() => {
    if (!mapInstanceRef.current || !(window as any).google || !weatherSafetyData?.unsafeRoutes) {
      // Clean up markers when disabled
      unsafeRoutesMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      unsafeRoutesMarkersRef.current = []
      return
    }

    // Clean up previous markers
    unsafeRoutesMarkersRef.current.forEach((marker) => {
      if (marker && marker.setMap) {
        marker.setMap(null)
      }
    })
    unsafeRoutesMarkersRef.current = []

    // Add markers for unsafe routes
    weatherSafetyData.unsafeRoutes.forEach((route: any) => {
      // Determine marker color based on highest severity
      let iconColor = '#F59E0B' // Orange (medium)
      let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
      
      route.dangerousDays.forEach((day: any) => {
        day.hazards.forEach((hazard: any) => {
          if (hazard.severity === 'critical') {
            highestSeverity = 'critical'
            iconColor = '#DC2626' // Red
          } else if (hazard.severity === 'high' && highestSeverity !== 'critical') {
            highestSeverity = 'high'
            iconColor = '#EF4444' // Light Red
          } else if (hazard.severity === 'medium' && highestSeverity === 'low') {
            highestSeverity = 'medium'
            iconColor = '#F59E0B' // Orange
          } else if (hazard.severity === 'low' && highestSeverity === 'low') {
            highestSeverity = 'low'
            iconColor = '#10B981' // Green (low severity)
          }
        })
      })

      const unsafeMarker = new (window as any).google.maps.Marker({
        position: { lat: route.position[0], lng: route.position[1] },
        map: mapInstanceRef.current,
        icon: {
          path: (window as any).google.maps.SymbolPath.CIRCLE,
          scale: 12,
          fillColor: iconColor,
          fillOpacity: 0.8,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
        title: `⚠️ ${route.roadName} - ${route.totalDangerousDays} يوم خطير`,
      })

      // Add click listener to show comprehensive alerts
      unsafeMarker.addListener('click', () => {
        // Group hazards by day
        const hazardsByDay = route.dangerousDays.map((day: any) => {
          const date = new Date(day.date)
          const dateStr = date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
          
          return {
            date: dateStr,
            dateISO: day.date,
            hazards: day.hazards,
          }
        })

        // Create content with all alerts grouped by day
        const hazardsHTML = hazardsByDay.map((dayData: any) => {
          const hazardsList = dayData.hazards.map((hazard: any) => {
            const severityColor = hazard.severity === 'critical' ? '#DC2626' :
                                 hazard.severity === 'high' ? '#EF4444' :
                                 hazard.severity === 'medium' ? '#F59E0B' : '#10B981'
            
            return `
              <div style="background: ${severityColor}15; border-right: 3px solid ${severityColor}; padding: 8px; margin-top: 6px; border-radius: 4px;">
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                  <span style="font-size: 18px;">${hazard.icon || '⚠️'}</span>
                  <span style="font-size: 12px; font-weight: bold; color: ${severityColor};">
                    ${hazard.message}
                  </span>
                </div>
                ${hazard.value !== undefined && hazard.value !== 1 ? `
                  <div style="font-size: 11px; color: #6b7280; margin-top: 4px;">
                    القيمة: ${typeof hazard.value === 'number' && hazard.value < 100 ? hazard.value.toFixed(1) : hazard.value.toFixed(0)}
                  </div>
                ` : ''}
              </div>
            `
          }).join('')

          return `
            <div style="margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-size: 13px; font-weight: bold; color: #374151; margin-bottom: 8px;">
                📅 ${dayData.date}
              </div>
              ${hazardsList}
            </div>
          `
        }).join('')

        const content = `
          <div style="padding: 16px; direction: rtl; min-width: 320px; max-height: 500px; overflow-y: auto;">
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">
              <span style="font-size: 36px;">⚠️</span>
              <div>
                <div style="font-size: 20px; font-weight: bold; color: #111827;">
                  ${route.roadName}
                </div>
                <div style="font-size: 14px; color: #dc2626; font-weight: 500;">
                  ${route.totalDangerousDays} يوم خطير من أصل 16 يوم
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
                  <strong>المدينة:</strong> ${route.city}
                </div>
              </div>
            </div>
            <div style="margin-top: 12px;">
              <div style="font-size: 14px; font-weight: bold; color: #374151; margin-bottom: 12px;">
                📋 التحذيرات حسب التاريخ:
              </div>
              ${hazardsHTML}
            </div>
          </div>
        `

        const infoWindow = new (window as any).google.maps.InfoWindow({
          content,
          position: { lat: route.position[0], lng: route.position[1] },
        })

        infoWindow.open(mapInstanceRef.current, unsafeMarker)
      })

      unsafeRoutesMarkersRef.current.push(unsafeMarker)
    })

    return () => {
      unsafeRoutesMarkersRef.current.forEach((marker) => {
        if (marker && marker.setMap) {
          marker.setMap(null)
        }
      })
      unsafeRoutesMarkersRef.current = []
    }
  }, [weatherSafetyData, map])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg border-2 border-red-300`}>
        <div className="text-center p-4">
          <p className="text-red-600 mb-2 font-bold">⚠️ {error}</p>
          <p className="text-sm text-gray-600 mb-4">
            تأكد من إضافة NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY في ملف .env
          </p>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="mb-1">للتحقق من المفتاح:</p>
            <code className="block bg-white p-2 rounded border">
              http://localhost:3000/api/test-maps
            </code>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Always render the map container so mapRef is available */}
      <div 
        ref={mapRef} 
        className={className} 
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        key="map-container"
      />
      
      {/* Show loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-90 rounded-lg z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل الخريطة...</p>
          </div>
        </div>
      )}
      
      {/* Show error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-95 rounded-lg z-20 border-2 border-red-300">
          <div className="text-center p-4">
            <p className="text-red-600 mb-2 font-bold">⚠️ {error}</p>
            <p className="text-sm text-gray-600 mb-4">
              تأكد من إضافة NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY في ملف .env
            </p>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              <p className="mb-1">للتحقق من المفتاح:</p>
              <code className="block bg-white p-2 rounded border">
                http://localhost:3000/api/test-maps
              </code>
            </div>
          </div>
        </div>
      )}
      {showTrafficLayer && (
        <div className="absolute bottom-4 right-4 bg-white px-3 py-2 rounded-lg shadow-md text-sm z-10">
          <span className="text-green-600">🟢</span> سلس
          <span className="text-yellow-600 ml-2">🟡</span> متوسط
          <span className="text-orange-600 ml-2">🟠</span> مزدحم
          <span className="text-red-600 ml-2">🔴</span> شديد
        </div>
      )}

      {/* زر العودة إلى موقع المستخدم */}
      {(userLocation || currentLocation) && (
        <button
          onClick={centerOnUserLocation}
          className="absolute bottom-4 left-4 bg-white hover:bg-gray-50 p-3 rounded-full shadow-lg border border-gray-200 z-10 transition-all hover:scale-110"
          title="العودة إلى موقعك"
        >
          <Navigation2 className="w-6 h-6 text-primary-600" />
        </button>
      )}
    </div>
  )
}

