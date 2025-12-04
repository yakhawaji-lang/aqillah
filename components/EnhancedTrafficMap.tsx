'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { MapMarker, Alert } from '@/types'

const TrafficMapClient = dynamic(() => import('./EnhancedTrafficMapClient'), {
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

interface EnhancedTrafficMapProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
  route?: Array<[number, number]>
  alerts?: Alert[]
  showCongestionPaths?: boolean
}

export default function EnhancedTrafficMap({
  markers,
  center,
  zoom,
  onMarkerClick,
  route,
  alerts,
  showCongestionPaths = true,
}: EnhancedTrafficMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <TrafficMapClient
      markers={markers}
      center={center}
      zoom={zoom}
      onMarkerClick={onMarkerClick}
      route={route}
      alerts={alerts}
      showCongestionPaths={showCongestionPaths}
    />
  )
}

