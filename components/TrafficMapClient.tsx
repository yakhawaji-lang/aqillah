'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapMarker } from '@/types'
import { CongestionIndicator } from './CongestionIndicator'
import { getCongestionColor } from '@/lib/utils'

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

interface TrafficMapProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
}

function MapController({ center, zoom }: { center?: [number, number], zoom?: number }) {
  const map = useMap()
  const prevCenterRef = useRef<[number, number] | undefined>(center)
  const prevZoomRef = useRef<number | undefined>(zoom)
  
  useEffect(() => {
    if (map && map.getContainer() && center) {
      const centerChanged = 
        !prevCenterRef.current ||
        prevCenterRef.current[0] !== center[0] || 
        prevCenterRef.current[1] !== center[1]
      const zoomChanged = prevZoomRef.current !== zoom
      
      if (centerChanged || zoomChanged) {
        try {
          map.setView(center, zoom || 13, { animate: false })
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

export default function TrafficMapClient({ 
  markers, 
  center = [24.7136, 46.6753], // الرياض
  zoom = 11,
  onMarkerClick 
}: TrafficMapProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapKey] = useState(() => `traffic-map-${Math.random().toString(36).substr(2, 9)}`)
  
  // تثبيت center و zoom الأولي - مرة واحدة فقط عند التحميل
  const initialCenterRef = useRef<[number, number] | undefined>(undefined)
  const initialZoomRef = useRef<number | undefined>(undefined)
  
  if (!initialCenterRef.current) {
    initialCenterRef.current = center
  }
  if (!initialZoomRef.current) {
    initialZoomRef.current = zoom
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getMarkerColor = (index: number) => {
    const color = getCongestionColor(index)
    const colorMap: Record<string, string> = {
      'traffic-green': '#10B981',
      'traffic-yellow': '#F59E0B',
      'traffic-orange': '#F97316',
      'traffic-red': '#EF4444',
      'traffic-dark': '#991B1B',
    }
    return colorMap[color] || '#10B981'
  }

  // إنشاء أيقونات Marker مرة واحدة فقط لكل index
  const iconCache = useMemo(() => {
    const cache: Record<number, L.DivIcon> = {}
    const indices = new Set(markers.map(m => m.congestionIndex))
    indices.forEach(index => {
      const color = getMarkerColor(index)
      cache[index] = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            background-color: ${color};
            width: 20px;
            height: 20px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      })
    })
    return cache
  }, [markers])

  if (!isMounted) {
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
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200">
      <MapContainer
        key={mapKey}
        center={initialCenterRef.current}
        zoom={initialZoomRef.current}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        preferCanvas={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        
        {markers.map((marker) => (
          <Marker
            key={`marker-${marker.id}`}
            position={marker.position}
            icon={iconCache[marker.congestionIndex] || iconCache[0]}
            eventHandlers={{
              click: () => onMarkerClick?.(marker),
            }}
          >
            <Popup>
              <div className="text-right">
                <h3 className="font-bold text-gray-900 mb-2">{marker.roadName}</h3>
                <p className="text-sm text-gray-600 mb-2">الاتجاه: {marker.direction || 'غير محدد'}</p>
                <CongestionIndicator index={marker.congestionIndex} />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

