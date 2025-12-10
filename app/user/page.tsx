'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MapPin, 
  Navigation, 
  Bell, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  Route,
  ChevronRight,
  RefreshCw,
  Settings,
  BarChart3,
  Calendar,
  X,
  Search
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { CongestionIndicator } from '@/components/CongestionIndicator'
import { AlertCard } from '@/components/AlertCard'
import { RealtimeIndicator } from '@/components/RealtimeIndicator'
import { SearchBar } from '@/components/SearchBar'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { LocationPicker } from '@/components/LocationPicker'
import { useRealtimeTraffic } from '@/lib/hooks/useRealtimeTraffic'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { MapMarker, Alert } from '@/types'
import axios from 'axios'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function UserAppPage() {
  const router = useRouter()
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'route'>('map')
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // جلب موقع المستخدم تلقائياً (مرة واحدة فقط، ليس مراقبة مستمرة)
  const { location: userLocation, loading: locationLoading, refresh: refreshLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 300000,
    watch: false,
  })

  // Real-time traffic data
  const { data: trafficData, isLoading: trafficLoading, isConnected, lastUpdate, refetch: refetchTraffic } = useRealtimeTraffic()
  
  // Notifications - فقط إذا كان هناك مسار محدد
  const { alerts: apiAlerts, hasNewAlerts, soundEnabled, setSoundEnabled } = useNotifications(!!selectedRoute)
  
  // استخدام البيانات من API فقط
  const allAlerts = apiAlerts || []

  // Search and filters
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({
    city: 'all',
    severity: 'all',
    type: 'all',
  })

  // Filtered data
  const filteredTrafficData = trafficData?.filter((item: any) => {
    if (searchQuery && !item.roadName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    if (filters.city !== 'all' && item.city !== filters.city) {
      return false
    }
    return true
  }) || []

  // حساب المسافة بين نقطتين (Haversine formula)
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    const R = 6371000
    const lat1 = point1[0] * Math.PI / 180
    const lat2 = point2[0] * Math.PI / 180
    const deltaLat = (point2[0] - point1[0]) * Math.PI / 180
    const deltaLng = (point2[1] - point1[1]) * Math.PI / 180

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) *
      Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c
  }

  // حساب المسافة من نقطة إلى قطعة مستقيمة
  const pointToLineDistance = (
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number => {
    const A = point[0] - lineStart[0]
    const B = point[1] - lineStart[1]
    const C = lineEnd[0] - lineStart[0]
    const D = lineEnd[1] - lineStart[1]

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1

    if (lenSq !== 0) {
      param = dot / lenSq
    }

    let xx: number, yy: number

    if (param < 0) {
      xx = lineStart[0]
      yy = lineStart[1]
    } else if (param > 1) {
      xx = lineEnd[0]
      yy = lineEnd[1]
    } else {
      xx = lineStart[0] + param * C
      yy = lineStart[1] + param * D
    }

    const dx = point[0] - xx
    const dy = point[1] - yy
    return Math.sqrt(dx * dx + dy * dy) * 111000
  }

  // حساب المسافة من نقطة إلى أقرب نقطة على المسار
  const distanceToRoute = (
    point: [number, number],
    route: Array<[number, number]>
  ): number => {
    if (!route || route.length === 0) return Infinity
    
    let minDistance = Infinity
    for (let i = 0; i < route.length - 1; i++) {
      const segmentStart = route[i]
      const segmentEnd = route[i + 1]
      
      const distance = pointToLineDistance(point, segmentStart, segmentEnd)
      minDistance = Math.min(minDistance, distance)
    }
    
    return minDistance
  }

  // تصفية الإشعارات المتعلقة بالمسار
  const routeAlerts = useMemo(() => {
    if (!selectedRoute || !selectedRoute.route || !allAlerts || allAlerts.length === 0) return []

    const MAX_DISTANCE_FROM_ROUTE = 500

    const nearbyAlerts = allAlerts
      .map((alert: any) => {
        let alertLat: number | null = null
        let alertLng: number | null = null

        if (alert.location) {
          if (Array.isArray(alert.location)) {
            alertLat = alert.location[0]
            alertLng = alert.location[1]
          } else if (typeof alert.location === 'object' && 'lat' in alert.location && 'lng' in alert.location) {
            alertLat = alert.location.lat
            alertLng = alert.location.lng
          }
        }

        if (!alertLat || !alertLng) return null

        const alertPoint: [number, number] = [alertLat, alertLng]
        const distance = distanceToRoute(alertPoint, selectedRoute.route)

        if (distance <= MAX_DISTANCE_FROM_ROUTE) {
          let routePosition = 0
          let cumulativeDistance = 0
          let totalDistance = 0

          for (let i = 0; i < selectedRoute.route.length - 1; i++) {
            totalDistance += calculateDistance(selectedRoute.route[i], selectedRoute.route[i + 1])
          }

          let minDistToRoute = Infinity
          let closestIndex = 0
          for (let i = 0; i < selectedRoute.route.length - 1; i++) {
            const dist = pointToLineDistance(alertPoint, selectedRoute.route[i], selectedRoute.route[i + 1])
            if (dist < minDistToRoute) {
              minDistToRoute = dist
              closestIndex = i
            }
          }

          for (let i = 0; i < closestIndex; i++) {
            cumulativeDistance += calculateDistance(selectedRoute.route[i], selectedRoute.route[i + 1])
          }

          routePosition = totalDistance > 0 ? cumulativeDistance / totalDistance : 0

          return {
            ...alert,
            distanceFromRoute: distance,
            routePosition,
            routeDistance: cumulativeDistance,
          }
        }

        return null
      })
      .filter((alert): alert is Alert & { distanceFromRoute: number; routePosition: number; routeDistance: number } => alert !== null)

    return nearbyAlerts.sort((a: any, b: any) => a.routePosition - b.routePosition)
  }, [selectedRoute, allAlerts])

  const alerts = selectedRoute ? routeAlerts : []

  const filteredAlerts = alerts?.filter((alert) => {
    if (filters.severity !== 'all' && alert.severity !== filters.severity) {
      return false
    }
    if (filters.type !== 'all' && alert.type !== filters.type) {
      return false
    }
    return true
  }) || []

  // جلب مسار الطوارئ إذا كان هناك وجهة
  const { data: emergencyRoute } = useQuery({
    queryKey: ['emergency-route', userLocation, destination],
    queryFn: async () => {
      if (!userLocation || !destination) return null
      const res = await axios.post('/api/emergency-route', {
        originLat: userLocation[0],
        originLng: userLocation[1],
        destinationLat: destination[0],
        destinationLng: destination[1],
      })
      return res.data.data
    },
    enabled: !!userLocation && !!destination,
  })

  const mapMarkers: MapMarker[] = useMemo(() => {
    return filteredTrafficData?.map((item: any) => ({
      id: item.id,
      position: item.position,
      congestionIndex: item.congestionIndex,
      roadName: item.roadName,
      direction: item.direction || 'غير محدد',
    })) || []
  }, [filteredTrafficData])

  // Calculate statistics
  const avgCongestion = filteredTrafficData.length > 0
    ? Math.round(
        filteredTrafficData.reduce((sum: number, item: any) => sum + item.congestionIndex, 0) /
          filteredTrafficData.length
      )
    : 0

  const avgDelay = filteredTrafficData.length > 0
    ? filteredTrafficData.reduce((sum: number, item: any) => sum + (item.delayMinutes || 0), 0) /
      filteredTrafficData.length
    : 0

  // حساب حالة الازدحام على المسار
  const routeCongestion = selectedRoute
    ? mapMarkers
        .filter((m) => selectedRoute.congestionAlongRoute?.some((r: any) => r.segmentId === m.id))
        .reduce((sum, m) => sum + m.congestionIndex, 0) / (mapMarkers.length || 1)
    : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 pb-20">
      {/* Header - تصميم محسّن */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-600 text-white shadow-xl">
        <div className="p-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">عَقِلْها</h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <RealtimeIndicator isConnected={isConnected} lastUpdate={lastUpdate} />
              <button
                onClick={() => {
                  refreshLocation()
                  toast('جاري تحديد موقعك...', { icon: '📍' })
                }}
                disabled={locationLoading}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition disabled:opacity-50 backdrop-blur-sm"
                title="تحديد موقعي"
              >
                {locationLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Navigation className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={() => router.push('/user/planned-route')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition backdrop-blur-sm"
                title="تخطيط المسار المستقبلي"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => router.push('/user/predictions')}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition backdrop-blur-sm"
                title="التنبؤات"
              >
                <BarChart3 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* البحث السريع عن الوجهة - تصميم محسّن */}
          <div 
            onClick={() => setActiveTab('route')}
            className="bg-white/20 backdrop-blur-md rounded-lg p-3 border border-white/30 cursor-pointer hover:bg-white/30 transition-all duration-200"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/30 rounded-lg">
                <Search className="h-4 w-4" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs opacity-90 mb-0.5">إلى أين تريد الذهاب؟</p>
                <p className="font-medium text-sm">
                  {destination 
                    ? `الوجهة محددة` 
                    : 'ابحث عن وجهة أو اختر من الخريطة'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 opacity-75" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs - تصميم محسّن */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center font-medium transition-all duration-200 relative ${
              activeTab === 'map'
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'map' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">الخريطة</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 text-center font-medium transition-all duration-200 relative ${
              activeTab === 'alerts'
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'alerts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <Bell className="h-4 w-4" />
              <span className="text-sm">التنبيهات</span>
              {alerts && alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {alerts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-3 text-center font-medium transition-all duration-200 relative ${
              activeTab === 'route'
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {activeTab === 'route' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
            )}
            <div className="flex items-center justify-center gap-1.5">
              <Route className="h-4 w-4" />
              <span className="text-sm">المسار</span>
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-7xl mx-auto">
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* حالة الازدحام الحالية - تصميم محسّن */}
            <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                  <MapPin className="h-6 w-6 text-primary-600" />
                  حالة الازدحام الحالية
                </h2>
                {trafficLoading && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                )}
              </div>
              <div className="h-[500px] rounded-xl overflow-hidden border border-gray-200 shadow-inner">
                {userLocation ? (
                  <GoogleTrafficMap
                    key={`google-traffic-map-${userLocation[0]}-${userLocation[1]}-${mapMarkers.length}`}
                    center={{ lat: userLocation[0], lng: userLocation[1] }}
                    zoom={15}
                    markers={mapMarkers.map(m => ({
                      lat: m.position[0],
                      lng: m.position[1],
                      title: m.roadName,
                      congestionIndex: m.congestionIndex,
                    }))}
                    showTrafficLayer={true}
                    currentLocation={userLocation}
                    className="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center p-8">
                      {locationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                          <p className="text-gray-700 mb-2 font-medium">جاري تحديد موقعك...</p>
                          <p className="text-sm text-gray-500">يرجى السماح بالوصول إلى موقعك</p>
                        </>
                      ) : (
                        <>
                          <div className="p-4 bg-primary-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                            <MapPin className="h-10 w-10 text-primary-600" />
                          </div>
                          <p className="text-gray-700 mb-2 font-medium text-lg">لم يتم تحديد موقعك</p>
                          <p className="text-sm text-gray-500 mb-6">اضغط على زر تحديد الموقع أعلاه</p>
                          <button
                            onClick={() => {
                              refreshLocation()
                              toast('جاري تحديد موقعك...', { icon: '📍' })
                            }}
                            disabled={locationLoading}
                            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto font-medium"
                          >
                            {locationLoading ? (
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            ) : (
                              <Navigation className="h-5 w-5" />
                            )}
                            تحديد موقعي
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* إحصائيات سريعة - تصميم محسّن ومتناسق */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 shadow-md border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-blue-500 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-900">متوسط الازدحام</span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  <AnimatedCounter value={avgCongestion} suffix="%" />
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 shadow-md border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-red-500 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-red-900">تنبيهات نشطة</span>
                </div>
                <p className="text-2xl font-bold text-red-900">
                  <AnimatedCounter value={filteredAlerts.length} />
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-md border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-purple-500 rounded-lg">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-purple-900">متوسط التأخير</span>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  <AnimatedCounter value={avgDelay} decimals={1} suffix=" د" />
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 shadow-md border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 bg-green-500 rounded-lg">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-green-900">مقاطع مراقبة</span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  <AnimatedCounter value={filteredTrafficData.length} />
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {!selectedRoute ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-gray-100">
                <div className="p-6 bg-primary-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Route className="h-12 w-12 text-primary-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">حدد المسار أولاً</h3>
                <p className="text-gray-600 mb-6 text-lg">يجب تحديد الوجهة وحساب المسار لعرض التنبيهات المتعلقة بالمسار</p>
                <button
                  onClick={() => setActiveTab('route')}
                  className="px-8 py-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition shadow-lg font-medium text-lg"
                >
                  الانتقال إلى تحديد المسار
                </button>
              </div>
            ) : (
              <>
                {/* البحث والفلاتر */}
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                    <SearchBar
                      placeholder="ابحث في التنبيهات..."
                      onSearch={setSearchQuery}
                    />
                  </div>
                  <AdvancedFilters
                    severity={[
                      { label: 'منخفض', value: 'low' },
                      { label: 'متوسط', value: 'medium' },
                      { label: 'عالي', value: 'high' },
                      { label: 'حرج', value: 'critical' },
                    ]}
                    types={[
                      { label: 'ازدحام', value: 'congestion' },
                      { label: 'حادث', value: 'accident' },
                      { label: 'فعالية', value: 'event' },
                      { label: 'طقس', value: 'weather' },
                    ]}
                    onFilterChange={setFilters}
                  />
                </div>

                {filteredAlerts && filteredAlerts.length > 0 ? (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 shadow-lg">
                      <p className="text-sm text-blue-900 font-medium flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        عرض {filteredAlerts.length} تنبيه متعلق بالمسار المحدد
                      </p>
                    </div>
                    <div className="space-y-3">
                      {filteredAlerts.map((alert: any) => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          onRouteClick={() => {
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.segmentId}`
                            window.open(url, '_blank')
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-xl border border-gray-100">
                    <div className="p-6 bg-gray-100 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                      <Bell className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">لا توجد تنبيهات على المسار</h3>
                    <p className="text-gray-600">لا توجد تنبيهات متعلقة بالمسار المحدد حالياً</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'route' && (
          <div className="space-y-4">
            {/* تحديد الوجهة - تصميم محسّن */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Route className="h-6 w-6 text-primary-600" />
                </div>
                <h2 className="font-bold text-2xl text-gray-900">تحديد المسار</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Navigation className="h-4 w-4 text-primary-600" />
                    موقعك الحالي
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                      <MapPin className="h-5 w-5 text-primary-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">
                        {locationLoading ? (
                          <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                            جاري تحديد الموقع...
                          </span>
                        ) : userLocation ? (
                          `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`
                        ) : (
                          'لم يتم تحديد الموقع'
                        )}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        refreshLocation()
                        toast('جاري تحديد موقعك...', { icon: '📍' })
                      }}
                      disabled={locationLoading}
                      className="p-4 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                      title="تحديد موقعي"
                    >
                      {locationLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <Navigation className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary-600" />
                    الوجهة
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <LocationPicker
                      onLocationSelect={(location) => {
                        setDestination([location.lat, location.lng])
                        toast.success(`تم تحديد الوجهة: ${location.name || 'موقع مختار'}`)
                      }}
                      currentLocation={userLocation || undefined}
                      placeholder="ابحث عن موقع أو اختر من الخريطة..."
                    />
                  </div>
                </div>

                <button
                  onClick={async () => {
                    if (!userLocation) {
                      toast.error('الرجاء السماح بالوصول إلى موقعك')
                      return
                    }
                    
                    if (!destination) {
                      toast.error('الرجاء تحديد الوجهة')
                      return
                    }

                    setIsCalculatingRoute(true)
                    try {
                      const res = await axios.post('/api/emergency-route', {
                        originLat: userLocation[0],
                        originLng: userLocation[1],
                        destinationLat: destination[0],
                        destinationLng: destination[1],
                      })
                      
                      if (res.data.success && res.data.data) {
                        const routeData = res.data.data
                        
                        if (routeData.distance !== undefined && routeData.estimatedTime !== undefined && routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0) {
                          setSelectedRoute(routeData)
                          
                          try {
                            const routeToSave = {
                              ...routeData,
                              id: routeData.id || `emergency-${Date.now()}`,
                              route: routeData.route || [],
                              steps: routeData.steps || [],
                            }
                            localStorage.setItem('currentRoute', JSON.stringify(routeToSave))
                          } catch (e) {
                            console.error('Error saving route to localStorage:', e)
                          }
                          
                          toast.success('تم حساب المسار بنجاح')
                          
                          try {
                            const routeId = routeData.id || `emergency-${Date.now()}`
                            window.location.href = `/user/navigation?routeId=${routeId}`
                          } catch (navError: any) {
                            console.error('Error navigating:', navError)
                            try {
                              const routeId = routeData.id || `emergency-${Date.now()}`
                              router.push(`/user/navigation?routeId=${routeId}`)
                            } catch (e) {
                              toast.error('تم حساب المسار بنجاح. سيتم الانتقال تلقائياً...', { duration: 3000 })
                              setTimeout(() => {
                                const routeId = routeData.id || `emergency-${Date.now()}`
                                window.location.href = `/user/navigation?routeId=${routeId}`
                              }, 2000)
                            }
                          }
                        } else {
                          throw new Error('البيانات المستلمة غير كاملة')
                        }
                      } else {
                        throw new Error(res.data.error || 'فشل في حساب المسار')
                      }
                    } catch (error: any) {
                      console.error('Error calculating route:', error)
                      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء حساب المسار'
                      toast.error(errorMessage)
                      setIsCalculatingRoute(false)
                      return
                    }
                    
                    setIsCalculatingRoute(false)
                  }}
                  disabled={!userLocation || !destination || isCalculatingRoute}
                  className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl text-lg"
                >
                  {isCalculatingRoute ? (
                    <>
                      <RefreshCw className="h-6 w-6 animate-spin" />
                      جاري الحساب...
                    </>
                  ) : (
                    <>
                      <Route className="h-6 w-6" />
                      حساب المسار الأسرع
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* خريطة المسار مع معلومات المسار - تصميم محسّن */}
            {selectedRoute && userLocation && destination && (
              <div className="space-y-4">
                {/* معلومات المسار المهمة - بطاقة علوية محسّنة */}
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-600 rounded-2xl p-6 shadow-2xl text-white overflow-hidden relative">
                  <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                  <div className="relative z-10">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-5 w-5" />
                          <span className="text-sm opacity-90">الوقت المتوقع</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {selectedRoute.estimatedTimeInTraffic 
                              ? Math.round(selectedRoute.estimatedTimeInTraffic)
                              : selectedRoute.estimatedTime 
                              ? Math.round(selectedRoute.estimatedTime)
                              : 0}
                          </span>
                          <span className="text-sm opacity-90">دقيقة</span>
                        </div>
                        {selectedRoute.estimatedTimeInTraffic && selectedRoute.estimatedTime && (
                          <div className="text-xs opacity-75 mt-2">
                            مع الازدحام +{Math.round(selectedRoute.estimatedTimeInTraffic - selectedRoute.estimatedTime)} د
                          </div>
                        )}
                      </div>

                      <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30">
                        <div className="flex items-center gap-2 mb-2">
                          <Route className="h-5 w-5" />
                          <span className="text-sm opacity-90">المسافة</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">
                            {selectedRoute.distance ? selectedRoute.distance.toFixed(1) : '0.0'}
                          </span>
                          <span className="text-sm opacity-90">كم</span>
                        </div>
                      </div>
                    </div>

                    {routeCongestion && (
                      <div className="bg-white/20 backdrop-blur-md rounded-xl p-4 border border-white/30 mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            <span className="text-sm opacity-90">حالة الازدحام</span>
                          </div>
                          <CongestionIndicator index={Math.round(routeCongestion)} />
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const routeId = selectedRoute.id || `emergency-${Date.now()}`
                        router.push(`/user/navigation?routeId=${routeId}`)
                      }}
                      className="w-full py-4 bg-white text-primary-600 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center gap-3 shadow-xl text-lg"
                    >
                      <Navigation className="h-6 w-6" />
                      بدء التوجيه
                    </button>
                  </div>
                </div>

                {/* خريطة المسار */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="h-[60vh] min-h-[400px] max-h-[600px]">
                    <GoogleTrafficMap
                      key={`google-route-map-${selectedRoute.id}`}
                      center={{
                        lat: (userLocation[0] + destination[0]) / 2,
                        lng: (userLocation[1] + destination[1]) / 2,
                      }}
                      zoom={12}
                      markers={mapMarkers.map(m => ({
                        lat: m.position[0],
                        lng: m.position[1],
                        title: m.roadName,
                        congestionIndex: m.congestionIndex,
                      }))}
                      route={{
                        origin: { lat: userLocation[0], lng: userLocation[1] },
                        destination: { lat: destination[0], lng: destination[1] },
                        polyline: selectedRoute.polyline,
                      }}
                      showTrafficLayer={true}
                      currentLocation={userLocation}
                      className="w-full h-full"
                    />
                  </div>
                </div>

                {/* معلومات إضافية */}
                <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary-600" />
                    تفاصيل المسار
                  </h3>
                  
                  <div className="space-y-3">
                    {selectedRoute.estimatedTime && selectedRoute.estimatedTimeInTraffic && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">الوقت بدون ازدحام</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {Math.round(selectedRoute.estimatedTime)} دقيقة
                        </span>
                      </div>
                    )}
                    
                    {selectedRoute.weatherDelay && (
                      <div className="flex items-center justify-between py-3 border-b border-gray-100">
                        <span className="text-sm text-gray-600">تأخير الطقس</span>
                        <span className="text-sm font-semibold text-orange-600">
                          +{Math.round(selectedRoute.weatherDelay)} دقيقة
                        </span>
                      </div>
                    )}

                    {selectedRoute.steps && selectedRoute.steps.length > 0 && (
                      <div className="flex items-center justify-between py-3">
                        <span className="text-sm text-gray-600">عدد الخطوات</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {selectedRoute.steps.length} خطوة
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-6">
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/${userLocation?.[0]},${userLocation?.[1]}/${destination?.[0]},${destination?.[1]}`
                        window.open(url, '_blank')
                      }}
                      className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      فتح في الخرائط
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoute(null)
                        setDestination(null)
                        toast.success('تم إلغاء المسار')
                      }}
                      className="py-3 px-4 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition flex items-center justify-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      إلغاء المسار
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Navigation - تصميم محسّن */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex max-w-7xl mx-auto">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center transition-all duration-200 ${
              activeTab === 'map' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <MapPin className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs font-medium">الخريطة</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 text-center transition-all duration-200 relative ${
              activeTab === 'alerts' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Bell className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs font-medium">التنبيهات</span>
            {alerts && alerts.length > 0 && (
              <span className="absolute top-1.5 right-1/2 translate-x-4 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-3 text-center transition-all duration-200 ${
              activeTab === 'route' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Route className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs font-medium">المسار</span>
          </button>
        </div>
      </div>
    </div>
  )
}
