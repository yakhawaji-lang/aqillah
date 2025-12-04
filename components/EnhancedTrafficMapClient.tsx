'use client'

import { useEffect, useRef, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { MapMarker, Alert } from '@/types'
import { CongestionIndicator } from './CongestionIndicator'
import { getCongestionColor } from '@/lib/utils'

// إصلاح أيقونات Leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface EnhancedTrafficMapClientProps {
  markers: MapMarker[]
  center?: [number, number]
  zoom?: number
  onMarkerClick?: (marker: MapMarker) => void
  route?: Array<[number, number]>
  alerts?: Alert[]
  showCongestionPaths?: boolean
}

function MapController({ center, zoom }: { center?: [number, number], zoom?: number }) {
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
  
  return null
}

// مكون لعرض مسار الازدحام
function CongestionPath({ markers }: { markers: MapMarker[] }) {
  // تجميع المقاطع حسب الطريق
  const paths = useMemo(() => {
    const pathMap = new Map<string, MapMarker[]>()
    
    markers.forEach(marker => {
      const key = `${marker.roadName}-${marker.direction}`
      if (!pathMap.has(key)) {
        pathMap.set(key, [])
      }
      pathMap.get(key)!.push(marker)
    })

    return Array.from(pathMap.values())
  }, [markers])

  return (
    <>
      {paths.map((pathMarkers, idx) => {
        if (pathMarkers.length < 2) return null

        // ترتيب المقاطع حسب الموقع
        const sortedMarkers = [...pathMarkers].sort((a, b) => {
          const distA = a.position[0] + a.position[1]
          const distB = b.position[0] + b.position[1]
          return distA - distB
        })

        const positions = sortedMarkers.map(m => m.position)
        const avgCongestion = Math.round(
          sortedMarkers.reduce((sum, m) => sum + m.congestionIndex, 0) / sortedMarkers.length
        )

        // تحديد لون الخط بناءً على الازدحام
        const getPathColor = (index: number) => {
          if (index >= 80) return '#991B1B' // أحمر داكن
          if (index >= 60) return '#EF4444' // أحمر
          if (index >= 40) return '#F97316' // برتقالي
          if (index >= 20) return '#F59E0B' // أصفر
          return '#10B981' // أخضر
        }

        return (
          <Polyline
            key={`path-${idx}`}
            positions={positions}
            color={getPathColor(avgCongestion)}
            weight={6}
            opacity={0.8}
            dashArray={avgCongestion >= 70 ? '10, 5' : undefined}
          />
        )
      })}
    </>
  )
}

// مكون لعرض الحوادث والتنبيهات
function AlertMarkers({ alerts }: { alerts?: Alert[] }) {
  if (!alerts || alerts.length === 0) return null

  return (
    <>
      {alerts.map((alert) => {
        // الحصول على موقع المقطع
        const position: [number, number] = [24.7136, 46.6753] // افتراضي
        
        const getAlertIcon = (type: string, severity: string) => {
          const size = severity === 'critical' ? 30 : severity === 'high' ? 25 : 20
          const color = severity === 'critical' ? '#991B1B' :
                       severity === 'high' ? '#EF4444' :
                       severity === 'medium' ? '#F59E0B' : '#10B981'
          
          const icon = type === 'accident' ? '🚨' :
                      type === 'construction' ? '🚧' :
                      type === 'event' ? '🎪' :
                      type === 'weather' ? '🌧️' : '⚠️'

          return L.divIcon({
            className: 'alert-marker',
            html: `
              <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: ${size * 0.6}px;
                animation: pulse 2s infinite;
              ">${icon}</div>
              <style>
                @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.2); opacity: 0.8; }
                }
              </style>
            `,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          })
        }

        return (
          <Marker
            key={alert.id}
            position={position}
            icon={getAlertIcon(alert.type, alert.severity)}
          >
            <Popup>
              <div className="text-right">
                <h3 className="font-bold text-gray-900 mb-2">{alert.type === 'accident' ? 'حادث مروري' :
                                                             alert.type === 'construction' ? 'أعمال بناء' :
                                                             alert.type === 'event' ? 'فعالية' :
                                                             alert.type === 'weather' ? 'ظروف جوية' : 'تنبيه'}</h3>
                <p className="text-sm text-gray-700 mb-2">{alert.message}</p>
                <p className="text-xs text-gray-500">
                  الخطورة: {alert.severity === 'critical' ? 'حرجة' :
                            alert.severity === 'high' ? 'عالية' :
                            alert.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                </p>
              </div>
            </Popup>
          </Marker>
        )
      })}
    </>
  )
}

export default function EnhancedTrafficMapClient({
  markers,
  center = [24.7136, 46.6753],
  zoom = 11,
  onMarkerClick,
  route,
  alerts,
  showCongestionPaths = true,
}: EnhancedTrafficMapClientProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [mapKey] = useState(() => `enhanced-map-${Math.random().toString(36).substr(2, 9)}`)

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
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController center={center} zoom={zoom} />
        
        {/* مسارات الازدحام */}
        {showCongestionPaths && <CongestionPath markers={markers} />}
        
        {/* مسار المستخدم */}
        {route && route.length > 1 && (
          <Polyline
            positions={route}
            color="#3B82F6"
            weight={5}
            opacity={0.8}
            dashArray="15, 10"
          />
        )}
        
        {/* علامات المرور */}
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
        
        {/* علامات الحوادث والتنبيهات */}
        <AlertMarkers alerts={alerts} />
      </MapContainer>
      
      {/* مفتاح الألوان */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] text-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>سلس (0-20)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span>متوسط (20-40)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>مزدحم (40-60)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>شديد (60-80)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-900"></div>
            <span>حرج (80+)</span>
          </div>
        </div>
      </div>
    </div>
  )
}

