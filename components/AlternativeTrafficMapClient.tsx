'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapMarker } from '@/types'
import { CongestionIndicator } from './CongestionIndicator'
import { getCongestionColor } from '@/lib/utils'
import { CloudRain, Cloud, AlertTriangle, Navigation } from 'lucide-react'

// إصلاح أيقونات Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface AlternativeTrafficMapClientProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  route?: Array<[number, number]>
  currentLocation?: [number, number]
  onMapClick?: (location: { lat: number; lng: number }) => void
  showTrafficLayer?: boolean
}

function MapController({ 
  center, 
  zoom,
  onMapClick 
}: { 
  center?: [number, number]
  zoom?: number
  onMapClick?: (location: { lat: number; lng: number }) => void
}) {
  const map = useMap()
  const prevCenterRef = useRef(center)
  const prevZoomRef = useRef(zoom)
  
  useEffect(() => {
    if (map && center && zoom) {
      const centerChanged = !prevCenterRef.current || 
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
  
  // إضافة مستمع للنقر على الخريطة
  useEffect(() => {
    if (!map || !onMapClick) return
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onMapClick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      })
    }
    
    map.on('click', handleClick)
    
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onMapClick])
  
  return null
}

// مكون لعرض موقع المستخدم الحالي
function CurrentLocationMarker({ location }: { location?: [number, number] }) {
  if (!location) return null
  
  const icon = L.divIcon({
    className: 'current-location-marker',
    html: `
      <div style="
        background-color: #3B82F6;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
      </style>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
  
  return (
    <Marker position={location} icon={icon}>
      <Popup>
        <div className="text-right">
          <p className="font-bold text-blue-600">موقعك الحالي</p>
        </div>
      </Popup>
    </Marker>
  )
}

export default function AlternativeTrafficMapClient({
  markers,
  center = [24.7136, 46.6753],
  zoom = 12,
  route,
  currentLocation,
  onMapClick,
  showTrafficLayer = true,
}: AlternativeTrafficMapClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapKey] = useState(() => `alt-map-${Math.random().toString(36).substr(2, 9)}`)

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

  const getMarkerIcon = (marker: MapMarker) => {
    const color = getMarkerColor(marker.congestionIndex)
    const type = marker.fullData?.type
    
    // أيقونة خاصة للطقس
    if (type === 'weather') {
      const weatherType = marker.fullData?.weatherType
      return L.divIcon({
        className: 'weather-marker',
        html: `
          <div style="
            background-color: ${weatherType === 'rain' ? '#3B82F6' : '#94A3B8'};
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
          ">
            ${weatherType === 'rain' ? '🌧️' : '🌫️'}
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    }
    
    // أيقونة خاصة للتنبيهات
    if (type === 'alert') {
      return L.divIcon({
        className: 'alert-marker',
        html: `
          <div style="
            background-color: #EF4444;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
          ">
            ⚠️
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      })
    }
    
    // أيقونة عادية للازدحام
    return L.divIcon({
      className: 'traffic-marker',
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
  }

  const initialCenter = useMemo(() => center, [])
  const initialZoom = useMemo(() => zoom, [])

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
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 relative">
      <MapContainer
        key={mapKey}
        center={initialCenter}
        zoom={initialZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        preferCanvas={true}
      >
        {/* طبقة الخريطة الأساسية - OpenStreetMap */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* طبقة بديلة - CartoDB Positron (أكثر وضوحاً) */}
        {/* يمكن تفعيلها بدلاً من OpenStreetMap */}
        {/* <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        /> */}
        
        <MapController center={center} zoom={zoom} onMapClick={onMapClick} />
        
        {/* موقع المستخدم الحالي */}
        {currentLocation && <CurrentLocationMarker location={currentLocation} />}
        
        {/* علامات الازدحام والطقس */}
        {markers.map((marker) => (
          <Marker
            key={`marker-${marker.id}`}
            position={marker.position}
            icon={getMarkerIcon(marker)}
          >
            <Popup>
              <div className="text-right min-w-[200px]">
                <h3 className="font-bold text-gray-900 mb-2">{marker.roadName}</h3>
                {marker.fullData?.type === 'weather' && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600">
                      {marker.fullData.weatherType === 'rain' ? '🌧️ أمطار' : '🌫️ ضباب'}
                    </p>
                  </div>
                )}
                {marker.fullData?.type === 'alert' && (
                  <div className="mb-2">
                    <p className="text-sm text-red-600">⚠️ تنبيه</p>
                  </div>
                )}
                {marker.congestionIndex > 0 && (
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 mb-1">الاتجاه: {marker.direction || 'غير محدد'}</p>
                    <CongestionIndicator index={marker.congestionIndex} />
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* رسم المسار */}
        {route && route.length > 0 && (
          <Polyline
            positions={route}
            pathOptions={{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.8,
            }}
          />
        )}
      </MapContainer>
      
      {/* مفتاح الألوان */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] text-sm border border-gray-200">
        <div className="space-y-1">
          <p className="font-bold text-gray-900 mb-2">مفتاح الألوان</p>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs">حركة سلسة (0-20%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs">ازدحام خفيف (20-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span className="text-xs">ازدحام متوسط (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span className="text-xs">ازدحام شديد (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-900"></div>
            <span className="text-xs">ازدحام شديد جداً (80%+)</span>
          </div>
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="text-xs">🌧️ أمطار</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gray-400"></div>
              <span className="text-xs">🌫️ ضباب</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500"></div>
              <span className="text-xs">⚠️ تنبيه</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

