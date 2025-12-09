'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  MapPin, 
  Navigation, 
  Calendar,
  Clock,
  Route,
  AlertTriangle,
  CloudRain,
  Wind,
  Eye,
  RefreshCw,
  ChevronRight,
  Cloud,
  Sun,
  CloudSnow,
  Droplets,
  TrendingUp,
  BarChart3
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { LocationPicker } from '@/components/LocationPicker'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { AlertCard } from '@/components/AlertCard'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function PlannedRoutePage() {
  const router = useRouter()
  const [destination, setDestination] = useState<[number, number] | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<any>(null)
  const [departureDate, setDepartureDate] = useState<string>('')
  const [departureTime, setDepartureTime] = useState<string>('')
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)

  // جلب موقع المستخدم تلقائياً
  const { location: userLocation, loading: locationLoading, refresh: refreshLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 60000,
    watch: false,
  })

  // تعيين التاريخ والوقت الافتراضي (اليوم + ساعة من الآن)
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(now.getHours() + 1, 0, 0, 0)
    
    const dateStr = tomorrow.toISOString().split('T')[0]
    const timeStr = `${String(tomorrow.getHours()).padStart(2, '0')}:${String(tomorrow.getMinutes()).padStart(2, '0')}`
    
    if (!departureDate) setDepartureDate(dateStr)
    if (!departureTime) setDepartureTime(timeStr)
  }, [])

  // حساب تاريخ ووقت المغادرة الكامل
  const departureDateTime = useMemo(() => {
    if (!departureDate || !departureTime) return null
    const [year, month, day] = departureDate.split('-').map(Number)
    const [hours, minutes] = departureTime.split(':').map(Number)
    return new Date(year, month - 1, day, hours, minutes)
  }, [departureDate, departureTime])

  // التحقق من أن التاريخ في المستقبل
  const isFutureDate = useMemo(() => {
    if (!departureDateTime) return false
    return departureDateTime > new Date()
  }, [departureDateTime])

  // جلب بيانات الطقس للتاريخ المحدد
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useQuery({
    queryKey: ['weather-forecast', destination, departureDate, departureTime],
    queryFn: async () => {
      if (!destination || !departureDateTime || !isFutureDate) return null
      
      try {
        const res = await axios.get(`/api/weather/impact`, {
          params: {
            lat: destination[0],
            lng: destination[1],
            date: departureDate,
            time: departureTime,
          },
          timeout: 30000, // 30 ثانية
        })
        return res.data?.data || null
      } catch (error: any) {
        console.error('Error fetching weather:', error)
        // لا نرمي الخطأ، بل نعيد null للسماح للصفحة بالاستمرار
        return null
      }
    },
    enabled: !!destination && !!departureDateTime && isFutureDate,
    retry: 1,
    retryDelay: 1000,
  })

  // جلب تنبؤات حركة المرور للتاريخ المحدد
  const { data: trafficPredictions, isLoading: trafficPredictionsLoading } = useQuery({
    queryKey: ['traffic-predictions', userLocation, destination, departureDate, departureTime],
    queryFn: async () => {
      if (!userLocation || !destination || !departureDateTime || !isFutureDate) return null
      
      try {
        // حساب عدد الدقائق من الآن حتى وقت المغادرة
        const now = new Date()
        const minutesAhead = Math.ceil((departureDateTime.getTime() - now.getTime()) / (1000 * 60))
        
        if (minutesAhead <= 0 || minutesAhead > 1440) return null // لا تزيد عن 24 ساعة
        
        // جلب تنبؤات المرور
        const res = await axios.get(`/api/predictions/real`, {
          params: {
            city: 'الرياض', // يمكن تحسينه ليكتشف المدينة تلقائياً
            minutesAhead: Math.min(minutesAhead, 60), // الحد الأقصى 60 دقيقة للتنبؤات
          }
        })
        
        return res.data.data || null
      } catch (error) {
        console.error('Error fetching traffic predictions:', error)
        return null
      }
    },
    enabled: !!userLocation && !!destination && !!departureDateTime && isFutureDate,
  })

  // جلب تنبؤات المرور للمسار المحدد
  const { data: routePredictions, isLoading: routePredictionsLoading, error: routePredictionsError } = useQuery({
    queryKey: ['route-predictions', selectedRoute?.id, departureDate, departureTime],
    queryFn: async () => {
      if (!selectedRoute || !userLocation || !destination || !departureDateTime || !isFutureDate) return null
      
      try {
        const now = new Date()
        const minutesAhead = Math.ceil((departureDateTime.getTime() - now.getTime()) / (1000 * 60))
        
        if (minutesAhead <= 0) return null
        
        // استخدام API للتنبؤات المرورية للمسار
        const res = await axios.get(`/api/predictions/route`, {
          params: {
            originLat: userLocation[0],
            originLng: userLocation[1],
            destinationLat: destination[0],
            destinationLng: destination[1],
            minutesAhead: Math.min(minutesAhead, 60),
          },
          timeout: 30000, // 30 ثانية
        })
        
        if (res.data && res.data.success && res.data.data) {
          return res.data.data
        }
        
        return null
      } catch (error: any) {
        console.error('Error fetching route predictions:', error)
        // لا نرمي الخطأ، بل نعيد null للسماح للصفحة بالاستمرار
        return null
      }
    },
    enabled: !!selectedRoute && !!userLocation && !!destination && !!departureDateTime && isFutureDate,
    retry: 1, // إعادة المحاولة مرة واحدة فقط
    retryDelay: 1000, // انتظار ثانية واحدة قبل إعادة المحاولة
  })

  // جلب تنبيهات الطقس
  const { data: weatherAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['weather-alerts', destination, departureDate],
    queryFn: async () => {
      if (!destination || !departureDateTime || !isFutureDate) return []
      
      try {
        const alerts: any[] = []
        
        // جلب بيانات الطقس
        if (weatherData) {
          // تحذيرات الطقس بناءً على البيانات
          if (weatherData.visibility && weatherData.visibility < 1000) {
            alerts.push({
              id: 'low-visibility',
              type: 'weather',
              severity: 'high',
              message: `انخفاض في الرؤية: ${weatherData.visibility} متر. يُنصح بتوخي الحذر أثناء القيادة.`,
              createdAt: new Date().toISOString(),
              expiresAt: departureDateTime.toISOString(),
              isActive: true,
              weatherCondition: 'low_visibility',
              visibility: weatherData.visibility,
            })
          }
          
          if (weatherData.windSpeed && weatherData.windSpeed > 50) {
            alerts.push({
              id: 'high-wind',
              type: 'weather',
              severity: 'medium',
              message: `رياح قوية: ${weatherData.windSpeed} كم/ساعة. قد تؤثر على استقرار المركبة.`,
              createdAt: new Date().toISOString(),
              expiresAt: departureDateTime.toISOString(),
              isActive: true,
              weatherCondition: 'high_wind',
              windSpeed: weatherData.windSpeed,
            })
          }
          
          if (weatherData.precipitation && weatherData.precipitation > 5) {
            alerts.push({
              id: 'heavy-rain',
              type: 'weather',
              severity: 'high',
              message: `أمطار غزيرة متوقعة: ${weatherData.precipitation} ملم. يُنصح بتأجيل الرحلة أو توخي الحذر الشديد.`,
              createdAt: new Date().toISOString(),
              expiresAt: departureDateTime.toISOString(),
              isActive: true,
              weatherCondition: 'heavy_rain',
              precipitation: weatherData.precipitation,
            })
          }
          
          if (weatherData.temperature && weatherData.temperature < 0) {
            alerts.push({
              id: 'freezing',
              type: 'weather',
              severity: 'critical',
              message: `درجات حرارة تحت الصفر: ${weatherData.temperature}°C. خطر الصقيع على الطرق.`,
              createdAt: new Date().toISOString(),
              expiresAt: departureDateTime.toISOString(),
              isActive: true,
              weatherCondition: 'freezing',
              temperature: weatherData.temperature,
            })
          }
        }
        
        return alerts
      } catch (error) {
        console.error('Error fetching weather alerts:', error)
        return []
      }
    },
    enabled: !!destination && !!departureDateTime && isFutureDate && !!weatherData,
  })

  // حساب المسار
  const handleCalculateRoute = async () => {
    if (!userLocation) {
      toast.error('الرجاء السماح بالوصول إلى موقعك')
      return
    }
    
    if (!destination) {
      toast.error('الرجاء تحديد الوجهة')
      return
    }

    if (!departureDate || !departureTime) {
      toast.error('الرجاء تحديد تاريخ ووقت المغادرة')
      return
    }

    if (!isFutureDate) {
      toast.error('الرجاء اختيار تاريخ ووقت في المستقبل')
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
      
      console.log('Route API Response:', res.data)
      
      if (res.data.success && res.data.data) {
        const routeData = res.data.data
        console.log('Route Data:', routeData)
        
        // التأكد من وجود البيانات الأساسية
        if (!routeData.route || !Array.isArray(routeData.route) || routeData.route.length === 0) {
          console.warn('Route data missing route array, but continuing...')
        }
        
        setSelectedRoute(routeData)
        toast.success('تم حساب المسار بنجاح')
      } else {
        throw new Error(res.data.error || 'فشل في حساب المسار')
      }
    } catch (error: any) {
      console.error('Error calculating route:', error)
      const errorMessage = error.response?.data?.error || error.message || 'حدث خطأ أثناء حساب المسار'
      console.error('Error details:', {
        message: errorMessage,
        response: error.response?.data,
        status: error.response?.status,
      })
      toast.error(errorMessage)
    } finally {
      setIsCalculatingRoute(false)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">تخطيط المسار المستقبلي</h1>
            <p className="text-sm opacity-90">تحديد مسار مع تنبؤات حركة المرور و الطقس</p>
          </div>
          <button
            onClick={() => router.push('/user')}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition"
          >
            <ChevronRight className="h-5 w-5 rotate-180" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* تحديد التاريخ والوقت */}
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            تاريخ ووقت المغادرة
          </h2>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                التاريخ
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الوقت
              </label>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>

          {departureDateTime && (
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <Clock className="h-4 w-4 inline-block mr-1" />
                المغادرة المحددة: {departureDateTime.toLocaleString('ar-SA', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {!isFutureDate && (
                <p className="text-sm text-red-600 mt-1">
                  ⚠️ يجب اختيار تاريخ ووقت في المستقبل
                </p>
              )}
            </div>
          )}
        </div>

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
              onClick={handleCalculateRoute}
              disabled={!userLocation || !destination || !departureDate || !departureTime || !isFutureDate || isCalculatingRoute}
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
                  حساب المسار
                </>
              )}
            </button>
          </div>
        </div>

        {/* معلومات الطقس */}
        {destination && departureDateTime && isFutureDate && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CloudRain className="h-5 w-5 text-blue-600" />
              تنبؤات الطقس للتاريخ المحدد
            </h2>

            {weatherLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري جلب بيانات الطقس...</p>
              </div>
            ) : weatherData ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Cloud className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">الحالة</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {weatherData.condition || 'غير محدد'}
                    </p>
                  </div>

                  <div className="bg-orange-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Droplets className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">الأمطار</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {weatherData.precipitation ? `${weatherData.precipitation.toFixed(1)} ملم` : '0 ملم'}
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">الرؤية</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {weatherData.visibility ? `${(weatherData.visibility / 1000).toFixed(1)} كم` : 'غير محدد'}
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Wind className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-gray-700">الرياح</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">
                      {weatherData.windSpeed ? `${weatherData.windSpeed.toFixed(1)} كم/س` : 'غير محدد'}
                    </p>
                  </div>
                </div>

                {weatherData.impactLevel && (
                  <div className={`p-3 rounded-lg ${
                    weatherData.impactLevel === 'high' ? 'bg-red-50 border border-red-200' :
                    weatherData.impactLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-green-50 border border-green-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      weatherData.impactLevel === 'high' ? 'text-red-800' :
                      weatherData.impactLevel === 'medium' ? 'text-yellow-800' :
                      'text-green-800'
                    }`}>
                      مستوى التأثير: {
                        weatherData.impactLevel === 'high' ? 'عالي - يُنصح بتأجيل الرحلة' :
                        weatherData.impactLevel === 'medium' ? 'متوسط - توخي الحذر' :
                        'منخفض - ظروف جيدة'
                      }
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد بيانات طقس متاحة للتاريخ المحدد</p>
              </div>
            )}
          </div>
        )}

        {/* تنبؤات حركة المرور */}
        {selectedRoute && departureDateTime && isFutureDate && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              تنبؤات حركة المرور للتاريخ المحدد
            </h2>

            {routePredictionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحليل حركة المرور المتوقعة...</p>
              </div>
            ) : routePredictions ? (
              <div className="space-y-4">
                {/* تنبؤات الازدحام */}
                {routePredictions.predictions && routePredictions.predictions.length > 0 ? (
                  <div className="space-y-3">
                    {routePredictions.predictions.map((prediction: any, index: number) => {
                      const congestionIndex = prediction.predictedIndex || prediction.congestionIndex || 0
                      const congestionColor = 
                        congestionIndex >= 70 ? 'text-red-600' :
                        congestionIndex >= 50 ? 'text-orange-600' :
                        congestionIndex >= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-600" />
                              <span className="text-sm font-medium text-gray-700">
                                بعد {prediction.minutesAhead || (index + 1) * 15} دقيقة
                              </span>
                            </div>
                            <div className={`text-lg font-bold ${congestionColor}`}>
                              {congestionIndex}%
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <div className="text-sm">
                              <span className="text-gray-600">التأخير المتوقع:</span>
                              <span className="font-medium text-gray-900 mr-1">
                                {prediction.predictedDelayMinutes || prediction.delayMinutes ? `${(prediction.predictedDelayMinutes || prediction.delayMinutes).toFixed(1)} دقيقة` : 'غير محدد'}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">مستوى الثقة:</span>
                              <span className="font-medium text-gray-900 mr-1">
                                {prediction.confidence ? `${Math.round(prediction.confidence * 100)}%` : 'غير محدد'}
                              </span>
                            </div>
                          </div>
                          
                          {prediction.factors && prediction.factors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs text-gray-600 mb-1">العوامل المؤثرة:</p>
                              <div className="flex flex-wrap gap-2">
                                {prediction.factors.map((factor: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد تنبؤات متاحة للتاريخ المحدد</p>
                  </div>
                )}

                {/* ملخص التنبؤات */}
                {routePredictions.avgCongestion !== undefined && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">متوسط الازدحام المتوقع</p>
                        <p className="text-xs text-blue-700 mt-1">
                          بناءً على أنماط حركة المرور التاريخية
                        </p>
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {routePredictions.avgCongestion.toFixed(0)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : trafficPredictions ? (
              <div className="space-y-3">
                {Array.isArray(trafficPredictions) && trafficPredictions.slice(0, 3).map((prediction: any, index: number) => {
                  const congestionIndex = prediction.predictedIndex || prediction.congestionIndex || 0
                  const congestionColor = 
                    congestionIndex >= 70 ? 'text-red-600' :
                    congestionIndex >= 50 ? 'text-orange-600' :
                    congestionIndex >= 30 ? 'text-yellow-600' :
                    'text-green-600'
                  
                  return (
                    <div key={index} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{prediction.roadName || 'طريق غير محدد'}</p>
                          <p className="text-xs text-gray-600">
                            بعد {prediction.minutesAhead || (index + 1) * 15} دقيقة
                          </p>
                        </div>
                        <div className={`text-xl font-bold ${congestionColor}`}>
                          {congestionIndex}%
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد تنبؤات متاحة للتاريخ المحدد</p>
                <p className="text-sm text-gray-500 mt-2">
                  سيتم عرض التنبؤات بعد تحديد المسار
                </p>
              </div>
            )}
          </div>
        )}

        {/* تنبيهات الطقس */}
        {weatherAlerts && weatherAlerts.length > 0 && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              تحذيرات الطقس ({weatherAlerts.length})
            </h2>
            
            <div className="space-y-3">
              {weatherAlerts.map((alert: any) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onRouteClick={() => {}}
                />
              ))}
            </div>
          </div>
        )}

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
            </div>
          </div>
        )}

        {/* خريطة المسار */}
        {selectedRoute && userLocation && destination && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">خريطة المسار</h3>
            <div className="h-[400px] rounded-lg overflow-hidden">
              {(() => {
                try {
                  // التحقق من صحة البيانات
                  if (!userLocation || userLocation.length !== 2 || !destination || destination.length !== 2) {
                    return (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100">
                        <div className="text-center">
                          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">بيانات الموقع غير صحيحة</p>
                        </div>
                      </div>
                    )
                  }

                  // تحديد نوع route
                  let routeToUse: any
                  if (selectedRoute.route && Array.isArray(selectedRoute.route) && selectedRoute.route.length > 0) {
                    routeToUse = selectedRoute.route
                  } else {
                    routeToUse = {
                      origin: { lat: userLocation[0], lng: userLocation[1] },
                      destination: { lat: destination[0], lng: destination[1] },
                    }
                  }

                  return (
                    <GoogleTrafficMap
                      key={`planned-route-map-${selectedRoute.id || Date.now()}`}
                      center={{
                        lat: (userLocation[0] + destination[0]) / 2,
                        lng: (userLocation[1] + destination[1]) / 2,
                      }}
                      zoom={12}
                      markers={[]}
                      route={routeToUse}
                      currentLocation={userLocation}
                      showTrafficLayer={true}
                      className="w-full h-full"
                    />
                  )
                } catch (error: any) {
                  console.error('Error rendering map:', error)
                  return (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <div className="text-center p-4">
                        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                        <p className="text-sm text-red-600 font-medium mb-1">خطأ في عرض الخريطة</p>
                        <p className="text-xs text-gray-600">{error?.message || 'حدث خطأ غير متوقع'}</p>
                      </div>
                    </div>
                  )
                }
              })()}
            </div>
          </div>
        )}

        {/* البيانات التفصيلية للمسار */}
        {selectedRoute && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              البيانات التفصيلية للمسار
            </h2>

            <div className="space-y-4">
              {/* معلومات المسار الأساسية */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">المسافة الإجمالية</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {selectedRoute?.distance ? Number(selectedRoute.distance).toFixed(1) : '0.0'} كم
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium text-gray-700">الوقت المتوقع للوصول</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {selectedRoute?.estimatedTime ? Math.round(Number(selectedRoute.estimatedTime)) : 0} دقيقة
                  </p>
                  {selectedRoute?.estimatedTimeInTraffic && (
                    <p className="text-xs text-gray-600 mt-1">
                      مع الازدحام: {Math.round(Number(selectedRoute.estimatedTimeInTraffic))} دقيقة
                    </p>
                  )}
                </div>
              </div>

              {/* تنبؤات حركة المرور التفصيلية */}
              {routePredictionsLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">جاري تحليل حركة المرور المتوقعة...</p>
                  </div>
                </div>
              ) : routePredictions && Array.isArray(routePredictions.predictions) && routePredictions.predictions.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    تنبؤات حركة المرور التفصيلية
                  </h3>
                  
                  <div className="space-y-3">
                    {routePredictions.predictions.map((prediction: any, index: number) => {
                      const congestionIndex = prediction.predictedIndex || prediction.congestionIndex || 0
                      const delayMinutes = prediction.predictedDelayMinutes || prediction.delayMinutes || 0
                      const congestionColor = 
                        congestionIndex >= 70 ? 'bg-red-100 border-red-300 text-red-800' :
                        congestionIndex >= 50 ? 'bg-orange-100 border-orange-300 text-orange-800' :
                        congestionIndex >= 30 ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                        'bg-green-100 border-green-300 text-green-800'
                      
                      return (
                        <div key={index} className={`rounded-lg p-4 border ${congestionColor}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span className="font-medium">
                                بعد {prediction.minutesAhead || (index + 1) * 15} دقيقة
                              </span>
                            </div>
                            <div className="text-xl font-bold">
                              {congestionIndex}% ازدحام
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div>
                              <p className="text-xs opacity-80 mb-1">التأخير المتوقع</p>
                              <p className="font-bold text-lg">
                                {delayMinutes > 0 ? `${delayMinutes.toFixed(1)} دقيقة` : 'غير محدد'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs opacity-80 mb-1">مستوى الثقة</p>
                              <p className="font-bold text-lg">
                                {prediction.confidence ? `${Math.round(prediction.confidence * 100)}%` : 'غير محدد'}
                              </p>
                            </div>
                          </div>
                          
                          {prediction.factors && prediction.factors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <p className="text-xs font-medium mb-2">العوامل المؤثرة:</p>
                              <div className="flex flex-wrap gap-2">
                                {prediction.factors.map((factor: string, idx: number) => (
                                  <span key={idx} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {routePredictions.avgCongestion !== undefined && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">متوسط الازدحام المتوقع</span>
                        <span className="text-xl font-bold text-gray-900">
                          {routePredictions.avgCongestion.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* حالة الطقس التفصيلية */}
              {weatherLoading ? (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">جاري جلب بيانات الطقس...</p>
                  </div>
                </div>
              ) : weatherError ? (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-yellow-800">تعذر جلب بيانات الطقس</p>
                    <p className="text-xs text-yellow-700 mt-1">سيتم عرض البيانات الأساسية فقط</p>
                  </div>
                </div>
              ) : weatherData && (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CloudRain className="h-5 w-5 text-blue-600" />
                    حالة الطقس المتوقعة
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Cloud className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">الحالة</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.condition || 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-600">الأمطار</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.precipitation ? `${weatherData.precipitation.toFixed(1)} ملم` : '0 ملم'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">الرؤية</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.visibility ? `${(weatherData.visibility / 1000).toFixed(1)} كم` : 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">سرعة الرياح</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.windSpeed ? `${weatherData.windSpeed.toFixed(1)} كم/س` : 'غير محدد'}
                      </p>
                    </div>
                  </div>

                  {weatherData.impactLevel && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      weatherData.impactLevel === 'high' ? 'bg-red-100 border border-red-300' :
                      weatherData.impactLevel === 'medium' ? 'bg-orange-100 border border-orange-300' :
                      'bg-green-100 border border-green-300'
                    }`}>
                      <p className="font-medium text-sm">
                        مستوى التأثير: {
                          weatherData.impactLevel === 'high' ? 'عالي - يُنصح بتأجيل الرحلة' :
                          weatherData.impactLevel === 'medium' ? 'متوسط - توخي الحذر' :
                          'منخفض - ظروف جيدة'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

