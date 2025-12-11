'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapMarker, Alert } from '@/types'

const AlternativeTrafficMapClient = dynamic(() => import('./AlternativeTrafficMapClient'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري تحميل الخريطة...</p>
      </div>
    </div>
  ),
})

interface AlternativeTrafficMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  markers?: Array<{
    lat: number
    lng: number
    title?: string
    icon?: string
    congestionIndex?: number
    type?: 'traffic' | 'weather' | 'alert'
    weatherType?: 'rain' | 'fog'
  }>
  route?: {
    origin: { lat: number; lng: number }
    destination: { lat: number; lng: number }
    waypoints?: Array<{ lat: number; lng: number }>
    polyline?: Array<{ lat: number; lng: number }>
  } | Array<[number, number]>
  currentLocation?: [number, number] | null
  showTrafficLayer?: boolean
  onMapClick?: (location: { lat: number; lng: number }) => void
  className?: string
}

export default function AlternativeTrafficMap({
  center = { lat: 24.7136, lng: 46.6753 },
  zoom = 12,
  markers = [],
  route,
  currentLocation,
  showTrafficLayer = true,
  onMapClick,
  className = 'w-full h-96',
}: AlternativeTrafficMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // تحويل markers إلى تنسيق MapMarker
  const mapMarkers: MapMarker[] = useMemo(() => {
    return markers.map((marker, index) => ({
      id: `marker-${index}`,
      position: [marker.lat, marker.lng] as [number, number],
      congestionIndex: marker.congestionIndex || 0,
      roadName: marker.title || 'موقع',
      direction: 'غير محدد',
      fullData: {
        type: marker.type,
        weatherType: marker.weatherType,
      },
    }))
  }, [markers])

  // تحويل route إلى تنسيق Array<[number, number]>
  const routePolyline: Array<[number, number]> | undefined = useMemo(() => {
    if (!route) return undefined
    
    if (Array.isArray(route)) {
      return route
    }
    
    if (route.polyline && Array.isArray(route.polyline)) {
      return route.polyline.map(p => [p.lat, p.lng] as [number, number])
    }
    
    // إنشاء مسار بسيط من origin إلى destination
    if (route.origin && route.destination) {
      return [
        [route.origin.lat, route.origin.lng],
        [route.destination.lat, route.destination.lng],
      ]
    }
    
    return undefined
  }, [route])

  // تحويل center إلى تنسيق [number, number]
  const mapCenter: [number, number] = useMemo(() => {
    return [center.lat, center.lng]
  }, [center.lat, center.lng])

  if (!isClient) {
    return (
      <div className={`${className} rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <AlternativeTrafficMapClient
        markers={mapMarkers}
        center={mapCenter}
        zoom={zoom}
        route={routePolyline}
        currentLocation={currentLocation || undefined}
        onMapClick={onMapClick}
        showTrafficLayer={showTrafficLayer}
      />
    </div>
  )
}

