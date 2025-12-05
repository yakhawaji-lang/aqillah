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
  BarChart3
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
import { Volume2, VolumeX } from 'lucide-react'
import { MapMarker, Alert } from '@/types'
import axios from 'axios'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function UserAppPage() {
  const router = useRouter()
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'map' | 'alerts' | 'route'>('map')
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // جلب موقع المستخدم
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude])
        },
        (error) => {
          console.error('Error getting location:', error)
          // موقع افتراضي (الرياض)
          setUserLocation([24.7136, 46.6753])
        }
      )
    } else {
      setUserLocation([24.7136, 46.6753])
    }
  }, [])

  // Real-time traffic data
  const { data: trafficData, isLoading: trafficLoading, isConnected, lastUpdate, refetch: refetchTraffic } = useRealtimeTraffic()
  
  // Notifications
  const { alerts: apiAlerts, hasNewAlerts, soundEnabled, setSoundEnabled } = useNotifications(true)
  
  // استخدام البيانات من API فقط
  const alerts = apiAlerts || []

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
                {userLocation && (
                  <GoogleTrafficMap
                    key={`google-traffic-map-${userLocation[0]}-${userLocation[1]}-${mapMarkers.length}`}
                    center={{ lat: userLocation[0], lng: userLocation[1] }}
                    zoom={13}
                    markers={mapMarkers.map(m => ({
                      lat: m.position[0],
                      lng: m.position[1],
                      title: m.roadName,
                      congestionIndex: m.congestionIndex,
                    }))}
                    showTrafficLayer={true}
                    className="w-full h-full"
                  />
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
              filteredAlerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onRouteClick={() => {
                    // فتح في تطبيق الملاحة
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.segmentId}`
                    window.open(url, '_blank')
                  }}
                />
              ))
            ) : (
              <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تنبيهات</h3>
                <p className="text-gray-600">جميع الطرق سلسة حالياً</p>
              </div>
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
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600">
                      {userLocation
                        ? `${userLocation[0].toFixed(4)}, ${userLocation[1].toFixed(4)}`
                        : 'جاري تحديد الموقع...'}
                    </span>
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
                        if (routeData.distance !== undefined && routeData.estimatedTime !== undefined) {
                          setSelectedRoute(routeData)
                          console.log('Route set successfully:', routeData)
                          toast.success('تم حساب المسار بنجاح')
                        } else {
                          console.error('Incomplete route data:', routeData)
                          throw new Error('البيانات المستلمة غير كاملة')
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
                      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء حساب المسار'
                      toast.error(errorMessage)
                    } finally {
                      setIsCalculatingRoute(false)
                    }
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

            {/* معلومات المسار */}
            {selectedRoute && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">معلومات المسار</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Route className="h-5 w-5 text-primary-600" />
                      <span className="text-sm text-gray-600">المسافة</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {selectedRoute.distance ? selectedRoute.distance.toFixed(1) : '0.0'} كم
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary-600" />
                      <span className="text-sm text-gray-600">الوقت المتوقع</span>
                    </div>
                    <span className="font-bold text-gray-900">
                      {selectedRoute.estimatedTime ? Math.round(selectedRoute.estimatedTime) : 0} دقيقة
                    </span>
                  </div>

                  {routeCongestion && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary-600" />
                        <span className="text-sm text-gray-600">حالة الازدحام</span>
                      </div>
                      <CongestionIndicator index={Math.round(routeCongestion)} />
                    </div>
                  )}

                  <button
                    onClick={() => {
                      const url = `https://www.google.com/maps/dir/${userLocation?.[0]},${userLocation?.[1]}/${destination?.[0]},${destination?.[1]}`
                      window.open(url, '_blank')
                    }}
                    className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2"
                  >
                    <Navigation className="h-5 w-5" />
                    فتح في الملاح
                  </button>
                </div>
              </div>
            )}

            {/* خريطة المسار مع Google Maps Traffic Layer */}
            {selectedRoute && userLocation && destination && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-4">خريطة المسار مع بيانات المرور الحية</h3>
                <div className="h-[400px] rounded-lg overflow-hidden">
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
                    className="w-full h-full"
                  />
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

