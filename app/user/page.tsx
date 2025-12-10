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
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import RoutePlanner from '@/components/user/RoutePlanner'
import WeatherLayer from '@/components/user/WeatherLayer'
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
import { Volume2, VolumeX } from 'lucide-react'
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
    timeout: 20000, // 20 ثانية
    maximumAge: 300000, // 5 دقائق - استخدام آخر موقع إذا كان حديثاً
    watch: false, // لا نراقب الموقع بشكل مستمر في صفحة اختيار المسار
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
    const R = 6371000 // نصف قطر الأرض بالمتر
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
    return Math.sqrt(dx * dx + dy * dy) * 111000 // تحويل إلى متر تقريباً
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

    const MAX_DISTANCE_FROM_ROUTE = 500 // متر - التنبيهات ضمن 500 متر من المسار

    const nearbyAlerts = allAlerts
      .map((alert: any) => {
        // استخراج الإحداثيات من التنبيه
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
          // حساب موضع التنبيه على المسار
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

  // استخدام routeAlerts إذا كان هناك مسار محدد، وإلا قائمة فارغة
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">عَقِلْها</h1>
            <p className="text-sm opacity-90">نظام تحليل الازدحام المروري</p>
          </div>
          <div className="flex items-center gap-3">
            <RealtimeIndicator isConnected={isConnected} lastUpdate={lastUpdate} />
            <button
              onClick={() => {
                console.log('📍 Manual location refresh requested from header')
                refreshLocation()
                toast('جاري تحديد موقعك...', { icon: '📍' })
              }}
              disabled={locationLoading}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
              title="تحديد موقعي"
            >
              {locationLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Navigation className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => window.location.reload()}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/user/predictions')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title="التنبؤات"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={() => router.push('/user/planned-route')}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
              title="تخطيط المسار المستقبلي"
            >
              <Calendar className="h-5 w-5" />
            </button>
            <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* البحث عن وجهة */}
        <div className="bg-white/20 rounded-lg p-3 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('route')}
            className="w-full flex items-center gap-3 text-right"
          >
            <div className="flex-1 text-right">
              <p className="text-sm opacity-90">إلى أين تريد الذهاب؟</p>
              <p className="font-medium">
                {destination ? `${destination[0].toFixed(4)}, ${destination[1].toFixed(4)}` : 'حدد الوجهة'}
              </p>
            </div>
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-[140px] z-40">
        <div className="flex">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'map'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <MapPin className="h-4 w-4" />
              الخريطة
            </div>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'alerts'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Bell className="h-4 w-4" />
              التنبيهات
              {alerts && alerts.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-3 text-center font-medium transition ${
              activeTab === 'route'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Route className="h-4 w-4" />
              المسار
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'map' && (
          <div className="space-y-4">
            {/* البحث والفلاتر */}
            <div className="space-y-3">
              <SearchBar
                placeholder="ابحث عن طريق..."
                onSearch={setSearchQuery}
                suggestions={trafficData?.map((item: any) => item.roadName) || []}
              />
              <AdvancedFilters
                cities={[
                  { label: 'الرياض', value: 'الرياض' },
                  { label: 'جدة', value: 'جدة' },
                  { label: 'الدمام', value: 'الدمام' },
                  { label: 'المدينة المنورة', value: 'المدينة المنورة' },
                  { label: 'الخبر', value: 'الخبر' },
                  { label: 'أبها', value: 'أبها' },
                  { label: 'خميس مشيط', value: 'خميس مشيط' },
                ]}
                onFilterChange={setFilters}
              />
            </div>

            {/* حالة الازدحام الحالية */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-gray-900">حالة الازدحام الحالية</h2>
                {trafficLoading && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                )}
              </div>
              <div className="h-[400px] rounded-lg overflow-hidden">
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
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                      {locationLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                          <p className="text-gray-600 mb-2">جاري تحديد موقعك...</p>
                          <p className="text-sm text-gray-500">يرجى السماح بالوصول إلى موقعك</p>
                        </>
                      ) : (
                        <>
                          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-600 mb-2">لم يتم تحديد موقعك</p>
                          <p className="text-sm text-gray-500 mb-4">اضغط على زر تحديد الموقع أعلاه</p>
                          <button
                            onClick={() => {
                              console.log('📍 Manual location refresh requested from map area')
                              refreshLocation()
                              toast('جاري تحديد موقعك...', { icon: '📍' })
                            }}
                            disabled={locationLoading}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                          >
                            {locationLoading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Navigation className="h-4 w-4" />
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

            {/* إحصائيات سريعة */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary-600" />
                  <span className="text-sm text-gray-600">متوسط الازدحام</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={avgCongestion} suffix="%" />
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <span className="text-sm text-gray-600">تنبيهات نشطة</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={filteredAlerts.length} />
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-gray-600">متوسط التأخير</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={avgDelay} decimals={1} suffix=" د" />
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-600">مقاطع مراقبة</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  <AnimatedCounter value={filteredTrafficData.length} />
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {!selectedRoute ? (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Route className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">حدد المسار أولاً</h3>
                <p className="text-gray-600 mb-4">يجب تحديد الوجهة وحساب المسار لعرض التنبيهات المتعلقة بالمسار</p>
                <button
                  onClick={() => setActiveTab('route')}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  الانتقال إلى تحديد المسار
                </button>
              </div>
            ) : (
              <>
                {/* البحث والفلاتر */}
                <div className="space-y-3">
                  <SearchBar
                    placeholder="ابحث في التنبيهات..."
                    onSearch={setSearchQuery}
                  />
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
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800">
                        <AlertTriangle className="h-4 w-4 inline-block mr-1" />
                        عرض {filteredAlerts.length} تنبيه متعلق بالمسار المحدد
                      </p>
                    </div>
                    {filteredAlerts.map((alert: any) => (
                      <AlertCard
                        key={alert.id}
                        alert={alert}
                        onRouteClick={() => {
                          // فتح في تطبيق الملاحة
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.segmentId}`
                          window.open(url, '_blank')
                        }}
                      />
                    ))}
                  </>
                ) : (
                  <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                    <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تنبيهات على المسار</h3>
                    <p className="text-gray-600">لا توجد تنبيهات متعلقة بالمسار المحدد حالياً</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'route' && (
          <div className="space-y-4">
            {/* تحديد الوجهة */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h2 className="font-bold text-gray-900 mb-4">تحديد المسار</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    موقعك الحالي
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-5 w-5 text-primary-600" />
                      <span className="text-sm text-gray-600 flex-1">
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
                        console.log('📍 Manual location refresh requested')
                        refreshLocation()
                        toast('جاري تحديد موقعك...', { icon: '📍' })
                      }}
                      disabled={locationLoading}
                      className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الوجهة
                  </label>
                  <LocationPicker
                    onLocationSelect={(location) => {
                      setDestination([location.lat, location.lng])
                    }}
                    currentLocation={userLocation || undefined}
                    placeholder="ابحث عن موقع أو اختر من الخريطة..."
                  />
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
                      
                      console.log('API Response:', res.data)
                      
                      if (res.data.success && res.data.data) {
                        const routeData = res.data.data
                        console.log('Route Data:', routeData)
                        
                        // التحقق من وجود البيانات المطلوبة
                        if (routeData.distance !== undefined && routeData.estimatedTime !== undefined && routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0) {
                          setSelectedRoute(routeData)
                          console.log('Route set successfully:', routeData)
                          
                          // حفظ المسار في localStorage قبل الانتقال
                          try {
                            // التأكد من أن البيانات كاملة قبل الحفظ
                            const routeToSave = {
                              ...routeData,
                              id: routeData.id || `emergency-${Date.now()}`,
                              route: routeData.route || [],
                              steps: routeData.steps || [],
                            }
                            localStorage.setItem('currentRoute', JSON.stringify(routeToSave))
                            console.log('Route saved to localStorage')
                          } catch (e) {
                            console.error('Error saving route to localStorage:', e)
                            toast.error('فشل في حفظ المسار محلياً')
                          }
                          
                          toast.success('تم حساب المسار بنجاح')
                          
                          // الانتقال إلى صفحة التوجيه مباشرة بدون تأخير
                          try {
                            const routeId = routeData.id || `emergency-${Date.now()}`
                            // استخدام window.location بدلاً من router.push لتجنب أخطاء React
                            window.location.href = `/user/navigation?routeId=${routeId}`
                          } catch (navError: any) {
                            console.error('Error navigating to navigation page:', navError)
                            // إذا فشل الانتقال، جرب router.push كبديل
                            try {
                              const routeId = routeData.id || `emergency-${Date.now()}`
                              router.push(`/user/navigation?routeId=${routeId}`)
                            } catch (e) {
                              console.error('Error with router.push:', e)
                              // إذا فشل كلاهما، أظهر رسالة للمستخدم
                              toast.error('تم حساب المسار بنجاح. سيتم الانتقال تلقائياً...', { duration: 3000 })
                              setTimeout(() => {
                                const routeId = routeData.id || `emergency-${Date.now()}`
                                window.location.href = `/user/navigation?routeId=${routeId}`
                              }, 2000)
                            }
                          }
                        } else {
                          console.error('Incomplete route data:', routeData)
                          throw new Error('البيانات المستلمة غير كاملة. تأكد من وجود المسار والإحداثيات.')
                        }
                      } else {
                        console.error('API Error:', res.data.error)
                        throw new Error(res.data.error || 'فشل في حساب المسار')
                      }
                    } catch (error: any) {
                      console.error('Error calculating route:', error)
                      console.error('Error details:', {
                        message: error.message,
                        response: error.response?.data,
                        status: error.response?.status,
                      })
                      
                      // منع إلقاء الخطأ لتجنب ظهور صفحة الخطأ
                      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء حساب المسار'
                      toast.error(errorMessage)
                      setIsCalculatingRoute(false)
                      
                      // لا نرمي الخطأ مرة أخرى لتجنب Error Boundary
                      return
                    }
                    
                    setIsCalculatingRoute(false)
                  }}
                  disabled={!userLocation || !destination || isCalculatingRoute}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCalculatingRoute ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      جاري الحساب...
                    </>
                  ) : (
                    <>
                      <Route className="h-5 w-5" />
                      حساب المسار الأسرع
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* خريطة المسار مع معلومات المسار - تصميم محسّن للجوال */}
            {selectedRoute && userLocation && destination && (
              <div className="space-y-4">
                {/* معلومات المسار المهمة - بطاقة علوية */}
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-4 shadow-lg text-white">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* الوقت */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs opacity-90">الوقت</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {selectedRoute.estimatedTimeInTraffic 
                            ? Math.round(selectedRoute.estimatedTimeInTraffic)
                            : selectedRoute.estimatedTime 
                            ? Math.round(selectedRoute.estimatedTime)
                            : 0}
                        </span>
                        <span className="text-sm opacity-90">دقيقة</span>
                      </div>
                      {selectedRoute.estimatedTimeInTraffic && selectedRoute.estimatedTime && (
                        <div className="text-xs opacity-75 mt-1">
                          مع الازدحام والطقس +{Math.round(selectedRoute.estimatedTimeInTraffic - selectedRoute.estimatedTime)} د
                        </div>
                      )}
                    </div>

                    {/* المسافة */}
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Route className="h-4 w-4" />
                        <span className="text-xs opacity-90">المسافة</span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold">
                          {selectedRoute.distance ? selectedRoute.distance.toFixed(1) : '0.0'}
                        </span>
                        <span className="text-sm opacity-90">كم</span>
                      </div>
                    </div>
                  </div>

                  {/* حالة الازدحام */}
                  {routeCongestion && (
                    <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm opacity-90">حالة الازدحام</span>
                        </div>
                        <CongestionIndicator index={Math.round(routeCongestion)} />
                      </div>
                    </div>
                  )}

                  {/* زر البدء */}
                  <button
                    onClick={() => {
                      const routeId = selectedRoute.id || `emergency-${Date.now()}`
                      router.push(`/user/navigation?routeId=${routeId}`)
                    }}
                    className="w-full mt-3 py-3 bg-white text-primary-600 rounded-lg font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Navigation className="h-5 w-5" />
                    بدء التوجيه
                  </button>
                </div>

                {/* خريطة المسار - تصميم محسّن للجوال */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="relative">
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
                </div>

                {/* معلومات إضافية */}
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 mb-3 text-sm">تفاصيل المسار</h3>
                  
                  <div className="space-y-2">
                    {selectedRoute.estimatedTime && selectedRoute.estimatedTimeInTraffic && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">الوقت بدون ازدحام</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.round(selectedRoute.estimatedTime)} دقيقة
                        </span>
                      </div>
                    )}
                    
                    {selectedRoute.weatherDelay && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-600">تأخير الطقس</span>
                        <span className="text-sm font-medium text-orange-600">
                          +{Math.round(selectedRoute.weatherDelay)} دقيقة
                        </span>
                      </div>
                    )}

                    {selectedRoute.steps && selectedRoute.steps.length > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-600">عدد الخطوات</span>
                        <span className="text-sm font-medium text-gray-900">
                          {selectedRoute.steps.length} خطوة
                        </span>
                      </div>
                    )}
                  </div>

                  {/* أزرار إضافية */}
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/${userLocation?.[0]},${userLocation?.[1]}/${destination?.[0]},${destination?.[1]}`
                        window.open(url, '_blank')
                      }}
                      className="py-2.5 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center gap-2 text-sm"
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
                      className="py-2.5 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition flex items-center justify-center gap-2 text-sm"
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

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'map' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <MapPin className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">الخريطة</span>
          </button>
          <button
            onClick={() => setActiveTab('alerts')}
            className={`flex-1 py-3 text-center transition relative ${
              activeTab === 'alerts' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Bell className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">التنبيهات</span>
            {alerts && alerts.length > 0 && (
              <span className="absolute top-2 right-1/2 translate-x-4 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`flex-1 py-3 text-center transition ${
              activeTab === 'route' ? 'text-primary-600' : 'text-gray-600'
            }`}
          >
            <Route className="h-5 w-5 mx-auto mb-1" />
            <span className="text-xs">المسار</span>
          </button>
        </div>
      </div>
    </div>
  )
}

