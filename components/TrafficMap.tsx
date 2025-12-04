'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { MapMarker } from '@/types'

// Dynamic import كامل للمكون مع تعطيل SSR
const DynamicMap = dynamic(
  () => import('./TrafficMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }
)

interface TrafficMapProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
}

export function TrafficMap(props: TrafficMapProps) {
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

  return <DynamicMap {...props} />
}
