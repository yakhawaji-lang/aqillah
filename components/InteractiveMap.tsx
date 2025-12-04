'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const DynamicMap = dynamic(
  () => import('./InteractiveMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }
)

interface InteractiveMapProps {
  center: [number, number]
  zoom?: number
  onLocationClick?: (location: { lat: number; lng: number }) => void
}

export function InteractiveMap({ center, zoom = 13, onLocationClick }: InteractiveMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return <DynamicMap center={center} zoom={zoom} onLocationClick={onLocationClick} />
}

