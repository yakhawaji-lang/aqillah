'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { CongestionIndicator } from '@/components/CongestionIndicator'
import { MapMarker } from '@/types'
import axios from 'axios'
import { Search, Filter, Navigation } from 'lucide-react'

export default function MapPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الرياض')
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showWeatherLayer, setShowWeatherLayer] = useState(false)
  const [showVisibilityLayer, setShowVisibilityLayer] = useState(false)
  const [showVisibilityForecast, setShowVisibilityForecast] = useState(false)
  const [selectedForecastDay, setSelectedForecastDay] = useState<number>(0) // 0-15 for 16 days
  const [weatherAlerts, setWeatherAlerts] = useState<{
    safeRoutes: any[]
    unsafeRoutes: any[]
  } | null>(null)
  const [manuallyAddedMarkers, setManuallyAddedMarkers] = useState<MapMarker[]>([])

  // جلب تنبيهات الطقس للطرق الآمنة وغير الآمنة
  const { data: weatherSafetyData, isLoading: isLoadingWeatherSafety, error: weatherSafetyError } = useQuery({
    queryKey: ['weather-safety', selectedCity],
    queryFn: async () => {
      try {
        const res = await axios.get(`/api/weather/safe-routes?city=${selectedCity}`)
        console.log('🌤️ Weather safety data received:', res.data)
        return res.data.data
      } catch (error: any) {
        console.error('❌ Error fetching weather safety data:', error)
        // إرجاع بيانات فارغة بدلاً من إرجاع خطأ
        return {
          safeRoutes: [],
          unsafeRoutes: [],
        }
      }
    },
    refetchInterval: 15 * 60 * 1000, // تحديث كل 15 دقيقة
    retry: 2, // إعادة المحاولة مرتين
  })

  useEffect(() => {
    if (weatherSafetyData) {
      console.log('📊 Setting weather alerts:', weatherSafetyData)
      setWeatherAlerts(weatherSafetyData)
    } else {
      console.log('⚠️ No weather safety data available')
      // تعيين بيانات فارغة عند عدم وجود بيانات
      setWeatherAlerts({
        safeRoutes: [],
        unsafeRoutes: [],
      })
    }
  }, [weatherSafetyData])

  // جلب البيانات من قاعدة البيانات فقط (بدون النقاط الثابتة من Google API)
  const { data: trafficData } = useQuery({
    queryKey: ['traffic', selectedCity],
    queryFn: async () => {
      try {
        const dbRes = await axios.get(`/api/traffic?city=${selectedCity}`)
        return dbRes.data.data || []
      } catch (dbError) {
        console.error('Database traffic API failed:', dbError)
        return []
      }
    },
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (trafficData) {
      const markers: MapMarker[] = trafficData
        .filter((item: any) => 
          !searchQuery || 
          item.roadName.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .map((item: any) => ({
          id: item.id,
          position: item.position,
          congestionIndex: item.congestionIndex,
          roadName: item.roadName,
          direction: item.direction,
          // حفظ البيانات الكاملة للعرض في قسم الطرق المراقبة
          fullData: item,
        }))
      setMapMarkers(markers)
    }
  }, [trafficData, searchQuery])

  // دالة لإضافة موقع مزدحم من الخريطة
  const handleTrafficPointClick = (data: {
    lat: number
    lng: number
    congestionIndex: number
    roadName: string
    city: string
    avgSpeed: number
    deviceCount: number
    timestamp: string
  }) => {
    // التحقق من عدم وجود الموقع مسبقاً
    const exists = manuallyAddedMarkers.some(
      (m) => Math.abs(m.position[0] - data.lat) < 0.001 && Math.abs(m.position[1] - data.lng) < 0.001
    )
    
    if (!exists) {
      const newMarker: MapMarker = {
        id: `manual-${Date.now()}`,
        position: [data.lat, data.lng],
        congestionIndex: data.congestionIndex,
        roadName: data.roadName,
        direction: 'ذهاب وإياب',
        fullData: {
          city: data.city,
          deviceCount: data.deviceCount,
          avgSpeed: data.avgSpeed,
          timestamp: data.timestamp,
        },
      }
      setManuallyAddedMarkers((prev) => [...prev, newMarker])
    }
  }

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']

  const getCityCenter = (city: string): [number, number] => {
    const centers: Record<string, [number, number]> = {
      'الرياض': [24.7136, 46.6753],
      'جدة': [21.4858, 39.1925],
      'الدمام': [26.4207, 50.0888],
      'المدينة المنورة': [24.5247, 39.5692],
      'الخبر': [26.2794, 50.2080],
      'أبها': [18.2164, 42.5042],
      'خميس مشيط': [18.3000, 42.7333],
    }
    return centers[city] || [24.7136, 46.6753]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-full mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 p-4">
          {/* الشريط الجانبي */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">التحكم</h3>
              
              {/* البحث */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  البحث عن طريق
                </label>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن طريق..."
                    className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* اختيار المدينة */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* طبقة الطقس */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWeatherLayer}
                    onChange={(e) => setShowWeatherLayer(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🌤️ عرض بيانات الطقس
                  </span>
                </label>
                {showWeatherLayer && (
                  <p className="text-xs text-gray-500 mt-1 mr-6">
                    انقر على الخريطة أو على marker لعرض بيانات الطقس
                  </p>
                )}
              </div>

              {/* طبقة الرؤية السيئة الحالية */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showVisibilityLayer}
                    onChange={(e) => setShowVisibilityLayer(e.target.checked)}
                    className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    🌫️ الطرق ذات الرؤية السيئة حالياً
                  </span>
                </label>
                {showVisibilityLayer && (
                  <p className="text-xs text-gray-500 mt-1 mr-6">
                    عرض الطرق التي فيها الرؤية أقل من 500 متر
                  </p>
                )}
              </div>

              {/* طبقة تنبؤات الرؤية */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    🔮 تنبؤات الرؤية السيئة (16 يوم قادمة)
                  </span>
                  <button
                    onClick={() => {
                      setShowVisibilityForecast(!showVisibilityForecast)
                      if (!showVisibilityForecast) {
                        setSelectedForecastDay(0) // Reset to first day
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded ${
                      showVisibilityForecast
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {showVisibilityForecast ? 'إخفاء' : 'عرض'}
                  </button>
                </div>
                
                {showVisibilityForecast && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    {/* Navigation Controls */}
                    <div className="flex items-center justify-between mb-3">
                      <button
                        onClick={() => setSelectedForecastDay(Math.max(0, selectedForecastDay - 1))}
                        disabled={selectedForecastDay === 0}
                        className={`p-2 rounded ${
                          selectedForecastDay === 0
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 text-center mx-3">
                        <div className="text-sm font-bold text-gray-900">
                          {(() => {
                            const date = new Date()
                            date.setDate(date.getDate() + selectedForecastDay)
                            return date.toLocaleDateString('ar-SA', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                          })()}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          اليوم {selectedForecastDay + 1} من 16
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setSelectedForecastDay(Math.min(15, selectedForecastDay + 1))}
                        disabled={selectedForecastDay === 15}
                        className={`p-2 rounded ${
                          selectedForecastDay === 15
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                    
                    <p className="text-xs text-gray-500 text-center">
                      عرض الطرق المتوقع أن تكون الرؤية فيها سيئة في هذا اليوم
                    </p>
                  </div>
                )}
              </div>

              {/* تنبيهات الطقس */}
              {weatherAlerts && (
                <div className="mb-4 space-y-3">
                  {/* تنبيه الطرق الآمنة */}
                  {weatherAlerts.safeRoutes && weatherAlerts.safeRoutes.length > 0 && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">✅</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-green-800 mb-1">
                            الطرق الآمنة لجميع أحوال الطقس
                          </h3>
                          <p className="text-sm text-green-700 mb-2">
                            {weatherAlerts.safeRoutes.length} طريق آمن خلال 16 يوم القادمة
                          </p>
                          <div className="text-xs text-green-600 space-y-1 max-h-32 overflow-y-auto">
                            {weatherAlerts.safeRoutes.slice(0, 5).map((route: any) => (
                              <div key={route.segmentId} className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                <span>{route.roadName}</span>
                                <span className="text-green-500">({route.city})</span>
                              </div>
                            ))}
                            {weatherAlerts.safeRoutes.length > 5 && (
                              <div className="text-green-600 font-medium">
                                + {weatherAlerts.safeRoutes.length - 5} طريق آخر
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* تنبيه الطرق غير الآمنة */}
                  {weatherAlerts.unsafeRoutes && weatherAlerts.unsafeRoutes.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="flex-1">
                          <h3 className="font-bold text-red-800 mb-1">
                            الطرق غير الآمنة لبعض أحوال الطقس
                          </h3>
                          <p className="text-sm text-red-700 mb-2">
                            {weatherAlerts.unsafeRoutes.length} طريق يحتاج إلى حذر خلال 16 يوم القادمة
                          </p>
                          <div className="text-xs text-red-600 space-y-2 max-h-48 overflow-y-auto">
                            {weatherAlerts.unsafeRoutes.slice(0, 5).map((route: any) => (
                              <div key={route.segmentId} className="border-b border-red-200 pb-2 last:border-0">
                                <div className="font-medium mb-1">
                                  {route.roadName} ({route.city})
                                </div>
                                <div className="text-red-700">
                                  {route.totalDangerousDays} يوم خطير من أصل 16 يوم
                                </div>
                                <div className="mt-1 space-y-1">
                                  {route.dangerousDays.slice(0, 2).map((day: any, idx: number) => {
                                    const date = new Date(day.date)
                                    const criticalHazards = day.hazards.filter((h: any) => h.severity === 'critical')
                                    const highHazards = day.hazards.filter((h: any) => h.severity === 'high')
                                    
                                    return (
                                      <div key={idx} className="text-red-600 pl-2 border-r-2 border-red-300">
                                        <div className="font-medium">
                                          {date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="space-y-0.5">
                                          {criticalHazards.map((hazard: any, hIdx: number) => (
                                            <div key={hIdx} className="text-red-800 font-medium">
                                              🔴 {hazard.message}
                                            </div>
                                          ))}
                                          {highHazards.map((hazard: any, hIdx: number) => (
                                            <div key={hIdx} className="text-red-700">
                                              🟠 {hazard.message}
                                            </div>
                                          ))}
                                          {day.hazards.filter((h: any) => h.severity !== 'critical' && h.severity !== 'high').slice(0, 1).map((hazard: any, hIdx: number) => (
                                            <div key={hIdx} className="text-red-600">
                                              🟡 {hazard.message}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )
                                  })}
                                  {route.dangerousDays.length > 2 && (
                                    <div className="text-red-600 text-xs mt-1">
                                      + {route.dangerousDays.length - 2} يوم آخر
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                            {weatherAlerts.unsafeRoutes.length > 5 && (
                              <div className="text-red-600 font-medium pt-2 border-t border-red-200">
                                + {weatherAlerts.unsafeRoutes.length - 5} طريق آخر
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* معلومات المحدد */}
              {selectedMarker && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-2">{selectedMarker.roadName}</h4>
                  <p className="text-sm text-gray-600 mb-2">الاتجاه: {selectedMarker.direction}</p>
                  <CongestionIndicator index={selectedMarker.congestionIndex} />
                  <button className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium">
                    <Navigation className="h-4 w-4" />
                    فتح في الملاح
                  </button>
                </div>
              )}
            </div>

            {/* قائمة الطرق */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 max-h-[500px] overflow-y-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-4">الطرق المراقبة 111</h3>
              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 text-center">
                  💡 انقر على أي موقع مزدحم (أحمر) على الخريطة لإضافته إلى القائمة
                </p>
              </div>
              <div className="space-y-2">
                {(mapMarkers.length === 0 && manuallyAddedMarkers.length === 0) ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>لا توجد طرق مراقبة حالياً</p>
                    <p className="text-xs mt-2 text-gray-400">
                      انقر على الخريطة لإضافة مواقع مزدحمة
                    </p>
                  </div>
                ) : (
                  <>
                    {/* المواقع المضافة يدوياً */}
                    {manuallyAddedMarkers.map((marker) => (
                      <div
                        key={marker.id}
                        className={`w-full text-right p-3 rounded-lg border transition ${
                          selectedMarker?.id === marker.id
                            ? 'bg-primary-50 border-primary-300'
                            : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">جديد</span>
                              <p className="font-medium text-gray-900">{marker.roadName}</p>
                              {marker.fullData?.city && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  {marker.fullData.city}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{marker.direction}</p>
                            
                            {/* بيانات مواقع الزحام */}
                            <div className="space-y-1 mt-2 pt-2 border-t border-blue-200">
                              {/* الموقع */}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="text-gray-400">📍</span>
                                <span>
                                  {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                                </span>
                              </div>
                              
                              {/* عدد الأجهزة */}
                              {marker.fullData?.deviceCount !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400">📱</span>
                                  <span>
                                    {marker.fullData.deviceCount} جهاز مراقب
                                  </span>
                                </div>
                              )}
                              
                              {/* متوسط السرعة */}
                              {marker.fullData?.avgSpeed !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400">🚗</span>
                                  <span>
                                    متوسط السرعة: {marker.fullData.avgSpeed.toFixed(0)} كم/س
                                  </span>
                                </div>
                              )}
                              
                              {/* وقت آخر تحديث */}
                              {marker.fullData?.timestamp && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="text-gray-400">🕐</span>
                                  <span>
                                    {(() => {
                                      const timestamp = new Date(marker.fullData.timestamp)
                                      const now = new Date()
                                      const diffMs = now.getTime() - timestamp.getTime()
                                      const diffMins = Math.floor(diffMs / 60000)
                                      
                                      if (diffMins < 1) return 'الآن'
                                      if (diffMins < 60) return `منذ ${diffMins} دقيقة`
                                      const diffHours = Math.floor(diffMins / 60)
                                      if (diffHours < 24) return `منذ ${diffHours} ساعة`
                                      const diffDays = Math.floor(diffHours / 24)
                                      return `منذ ${diffDays} يوم`
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <CongestionIndicator index={marker.congestionIndex} showLabel={false} />
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setManuallyAddedMarkers((prev) => prev.filter((m) => m.id !== marker.id))
                              }}
                              className="mt-2 text-xs text-red-600 hover:text-red-800"
                              title="إزالة"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* المواقع من API */}
                    {mapMarkers.map((marker) => (
                      <button
                        key={marker.id}
                        onClick={() => setSelectedMarker(marker)}
                        className={`w-full text-right p-3 rounded-lg border transition ${
                          selectedMarker?.id === marker.id
                            ? 'bg-primary-50 border-primary-300'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900">{marker.roadName}</p>
                              {marker.fullData?.city && (
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                                  {marker.fullData.city}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mb-2">{marker.direction}</p>
                            
                            {/* بيانات مواقع الزحام */}
                            <div className="space-y-1 mt-2 pt-2 border-t border-gray-100">
                              {/* الموقع */}
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span className="text-gray-400">📍</span>
                                <span>
                                  {marker.position[0].toFixed(4)}, {marker.position[1].toFixed(4)}
                                </span>
                              </div>
                              
                              {/* عدد الأجهزة */}
                              {marker.fullData?.deviceCount !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400">📱</span>
                                  <span>
                                    {marker.fullData.deviceCount} جهاز مراقب
                                  </span>
                                </div>
                              )}
                              
                              {/* متوسط السرعة */}
                              {marker.fullData?.avgSpeed !== undefined && (
                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                  <span className="text-gray-400">🚗</span>
                                  <span>
                                    متوسط السرعة: {marker.fullData.avgSpeed.toFixed(0)} كم/س
                                  </span>
                                </div>
                              )}
                              
                              {/* وقت آخر تحديث */}
                              {marker.fullData?.timestamp && (
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  <span className="text-gray-400">🕐</span>
                                  <span>
                                    {(() => {
                                      const timestamp = new Date(marker.fullData.timestamp)
                                      const now = new Date()
                                      const diffMs = now.getTime() - timestamp.getTime()
                                      const diffMins = Math.floor(diffMs / 60000)
                                      
                                      if (diffMins < 1) return 'الآن'
                                      if (diffMins < 60) return `منذ ${diffMins} دقيقة`
                                      const diffHours = Math.floor(diffMins / 60)
                                      if (diffHours < 24) return `منذ ${diffHours} ساعة`
                                      const diffDays = Math.floor(diffHours / 24)
                                      return `منذ ${diffDays} يوم`
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0">
                            <CongestionIndicator index={marker.congestionIndex} showLabel={false} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* الخريطة */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="h-[calc(100vh-120px)]">
                <GoogleTrafficMap
                  center={{
                    lat: getCityCenter(selectedCity)[0],
                    lng: getCityCenter(selectedCity)[1],
                  }}
                  zoom={selectedCity === 'الرياض' ? 11 : 12}
                  markers={[...mapMarkers, ...manuallyAddedMarkers].map(m => ({
                    lat: m.position[0],
                    lng: m.position[1],
                    title: m.roadName,
                    congestionIndex: m.congestionIndex,
                  }))}
                  showTrafficLayer={true}
                  showWeatherLayer={showWeatherLayer}
                  showVisibilityLayer={showVisibilityLayer}
                  showVisibilityForecast={showVisibilityForecast}
                  selectedForecastDay={selectedForecastDay}
                  weatherSafetyData={weatherAlerts}
                  onMapClick={(location) => {
                    // يمكن إضافة وظيفة للنقر على الخريطة
                  }}
                  onTrafficPointClick={handleTrafficPointClick}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

