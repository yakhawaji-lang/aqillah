'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    lat: number
    lng: number
    title?: string
    icon?: string
  }>
  route?: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
    waypoints?: Array<{ lat: number; lng: number }>
  }
  onMapClick?: (location: { lat: number; lng: number }) => void
  className?: string
}

export default function GoogleMap({
  center = { lat: 24.7136, lng: 46.6753 },
  zoom = 12,
  markers = [],
  route,
  onMapClick,
  className = 'w-full h-96',
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null)
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_AQILLAH_MAPS_WEB_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setError('Google Maps API key not configured')
      setIsLoading(false)
      return
    }

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'routes', 'geometry'],
    })

    loader
      .load()
      .then((google) => {
        if (!mapRef.current) return

        // Create map
        const mapInstance = new google.maps.Map(mapRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        setMap(mapInstance)

        // Create directions service
        const directionsServiceInstance = new google.maps.DirectionsService()
        const directionsRendererInstance = new google.maps.DirectionsRenderer({
          map: mapInstance,
          suppressMarkers: false,
        })

        setDirectionsService(directionsServiceInstance)
        setDirectionsRenderer(directionsRendererInstance)

        // Add click listener
        if (onMapClick) {
          mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              onMapClick({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
              })
            }
          })
        }

        setIsLoading(false)
      })
      .catch((err) => {
        console.error('Error loading Google Maps:', err)
        setError('Failed to load Google Maps')
        setIsLoading(false)
      })
  }, [])

  // Update map center
  useEffect(() => {
    if (map) {
      map.setCenter(center)
      map.setZoom(zoom)
    }
  }, [map, center, zoom])

  // Add markers
  useEffect(() => {
    if (!map) return

    const googleMarkers: google.maps.Marker[] = []

    markers.forEach((marker) => {
      const googleMarker = new google.maps.Marker({
        position: { lat: marker.lat, lng: marker.lng },
        map,
        title: marker.title,
        icon: marker.icon,
      })

      googleMarkers.push(googleMarker)
    })

    return () => {
      googleMarkers.forEach((marker) => marker.setMap(null))
    }
  }, [map, markers])

  // Render route
  useEffect(() => {
    if (!directionsService || !directionsRenderer || !route) return

    const request: google.maps.DirectionsRequest = {
      origin: { lat: route.origin.lat, lng: route.origin.lng },
      destination: { lat: route.destination.lat, lng: route.destination.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      ...(route.waypoints && route.waypoints.length > 0 && {
        waypoints: route.waypoints.map((wp) => ({
          location: { lat: wp.lat, lng: wp.lng },
        })),
      }),
    }

    directionsService.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result) {
        directionsRenderer.setDirections(result)
      } else {
        console.error('Directions request failed:', status)
      }
    })
  }, [directionsService, directionsRenderer, route])

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <p className="text-red-600 mb-2">⚠️ {error}</p>
          <p className="text-sm text-gray-600">
            تأكد من إضافة NEXT_PUBLIC_GOOGLE_MAPS_API_KEY في .env
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return <div ref={mapRef} className={className} />
}

