'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// إصلاح أيقونات Leaflet - مرة واحدة فقط
let iconFixed = false
if (typeof window !== 'undefined' && !iconFixed) {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
  iconFixed = true
}

interface InteractiveMapClientProps {
  center: [number, number]
  zoom: number
  onLocationClick?: (location: { lat: number; lng: number }) => void
}

// مكون لتحديث مركز الخريطة
function MapUpdater({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap()
  const prevCenterRef = useRef<[number, number]>(center)
  const prevZoomRef = useRef<number>(zoom)
  
  useEffect(() => {
    if (map && map.getContainer()) {
      const centerChanged = 
        prevCenterRef.current[0] !== center[0] || 
        prevCenterRef.current[1] !== center[1]
      const zoomChanged = prevZoomRef.current !== zoom
      
      if (centerChanged || zoomChanged) {
        try {
          map.setView(center, zoom, { animate: false })
          prevCenterRef.current = center
          prevZoomRef.current = zoom
        } catch (error) {
          console.error('Error updating map view:', error)
        }
      }
    }
  }, [map, center, zoom])
  
  return null
}

function LocationMarker({ 
  onLocationClick 
}: { 
  onLocationClick?: (location: { lat: number; lng: number }) => void
}) {
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null)

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      const newPosition: [number, number] = [lat, lng]
      setMarkerPosition(newPosition)
      onLocationClick?.({ lat, lng })
    },
  })

  // إنشاء أيقونة Marker مرة واحدة فقط
  const markerIcon = useMemo(() => {
    return L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          background-color: #006633;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    })
  }, [])

  if (!markerPosition) return null

  return (
    <Marker
      key={`marker-${markerPosition[0]}-${markerPosition[1]}`}
      position={markerPosition}
      icon={markerIcon}
    />
  )
}

export default function InteractiveMapClient({
  center,
  zoom,
  onLocationClick,
}: InteractiveMapClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // تأخير بسيط للتأكد من أن DOM جاهز
    const timer = setTimeout(() => {
      setIsMounted(true)
      // تأخير إضافي قبل عرض الخريطة
      setTimeout(() => {
        setShouldRender(true)
      }, 100)
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  if (!isMounted || !shouldRender) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100" ref={containerRef}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الخريطة...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full" ref={containerRef}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        scrollWheelZoom={true}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater center={center} zoom={zoom} />
        <LocationMarker onLocationClick={onLocationClick} />
      </MapContainer>
    </div>
  )
}

