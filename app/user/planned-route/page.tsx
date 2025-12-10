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
  TrendingDown,
  BarChart3,
  Minus
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

  // إعادة تعيين المسار والتنبؤات عند تغيير التاريخ أو الوقت
  useEffect(() => {
    if (departureDate && departureTime && selectedRoute) {
      // إعادة تعيين المسار عند تغيير التاريخ/الوقت لتجنب الأخطاء
      console.log('🔄 Date/time changed, resetting route...')
      setSelectedRoute(null)
      // لا نعيد تعيين الوجهة لأن المستخدم قد يريد الاحتفاظ بها
    }
  }, [departureDate, departureTime, selectedRoute])

  // حساب تاريخ ووقت المغادرة الكامل
  const departureDateTime = useMemo(() => {
    if (!departureDate || !departureTime) return null
    try {
      const [year, month, day] = departureDate.split('-').map(Number)
      const [hours, minutes] = departureTime.split(':').map(Number)
      
      // التحقق من صحة التاريخ والوقت
      if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid date or time values:', { departureDate, departureTime })
        return null
      }
      
      const date = new Date(year, month - 1, day, hours, minutes)
      
      // التحقق من أن التاريخ صحيح
      if (isNaN(date.getTime())) {
        console.error('Invalid date created:', { year, month, day, hours, minutes })
        return null
      }
      
      return date
    } catch (error) {
      console.error('Error parsing departure date/time:', error)
      return null
    }
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
      
      // التحقق من صحة departureDateTime
      if (isNaN(departureDateTime.getTime())) {
        console.error('Invalid departureDateTime for weather:', departureDateTime)
        return null
      }
      
      // التحقق من صحة الإحداثيات
      if (!Array.isArray(destination) || destination.length !== 2) {
        console.error('Invalid destination coordinates:', destination)
        return null
      }
      
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
    enabled: !!destination && !!departureDateTime && isFutureDate && !isNaN(departureDateTime?.getTime()),
    retry: 1,
    retryDelay: 1000,
  })

  // جلب تنبؤات حركة المرور للتاريخ المحدد
  const { data: trafficPredictions, isLoading: trafficPredictionsLoading } = useQuery({
    queryKey: ['traffic-predictions', userLocation, destination, departureDate, departureTime],
    queryFn: async () => {
      if (!userLocation || !destination || !departureDateTime || !isFutureDate) return null
      
      // التحقق من صحة البيانات
      if (!departureDate || !departureTime || isNaN(departureDateTime.getTime())) {
        return null
      }
      
      try {
        // حساب عدد الدقائق من الآن حتى وقت المغادرة
        const now = new Date()
        const minutesAhead = Math.ceil((departureDateTime.getTime() - now.getTime()) / (1000 * 60))
        
        if (minutesAhead <= 0 || minutesAhead > 1440 || isNaN(minutesAhead)) return null // لا تزيد عن 24 ساعة
        
        // جلب تنبؤات المرور
        const res = await axios.get(`/api/predictions/real`, {
          params: {
            city: 'الرياض', // يمكن تحسينه ليكتشف المدينة تلقائياً
            minutesAhead: Math.min(minutesAhead, 60), // الحد الأقصى 60 دقيقة للتنبؤات
          },
          timeout: 30000,
        })
        
        return res.data?.data || null
      } catch (error) {
        console.error('Error fetching traffic predictions:', error)
        return null
      }
    },
    enabled: !!userLocation && !!destination && !!departureDate && !!departureTime && !!departureDateTime && isFutureDate && !isNaN(departureDateTime?.getTime()),
  })

  // جلب تنبؤات المرور للمسار المحدد (تعمل حتى بدون selectedRoute)
  const { data: routePredictions, isLoading: routePredictionsLoading, error: routePredictionsError } = useQuery({
    queryKey: ['route-predictions', userLocation, destination, departureDate, departureTime],
    queryFn: async () => {
      // التحقق من جميع الشروط قبل المتابعة (لا نحتاج selectedRoute)
      if (!userLocation || !destination || !departureDateTime || !isFutureDate) {
        return null
      }
      
      // التحقق من صحة departureDateTime
      if (isNaN(departureDateTime.getTime())) {
        console.error('Invalid departureDateTime:', departureDateTime)
        return null
      }
      
      try {
        const now = new Date()
        const minutesAhead = Math.ceil((departureDateTime.getTime() - now.getTime()) / (1000 * 60))
        
        if (minutesAhead <= 0 || isNaN(minutesAhead)) {
          return null
        }
        
        // التحقق من صحة الإحداثيات
        if (!Array.isArray(userLocation) || userLocation.length !== 2 || 
            !Array.isArray(destination) || destination.length !== 2) {
          console.error('Invalid coordinates:', { userLocation, destination })
          return null
        }
        
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
    enabled: !!userLocation && !!destination && !!departureDate && !!departureTime && !!departureDateTime && isFutureDate && !isNaN(departureDateTime?.getTime()),
    retry: 1, // إعادة المحاولة مرة واحدة فقط
    retryDelay: 1000, // انتظار ثانية واحدة قبل إعادة المحاولة
  })

  // جلب تنبيهات الطقس
  const { data: weatherAlerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['weather-alerts', destination, departureDate, departureTime],
    queryFn: async () => {
      if (!destination || !departureDateTime || !isFutureDate || !departureDate || !departureTime) return []
      
      // التحقق من صحة البيانات
      if (isNaN(departureDateTime.getTime())) {
        return []
      }
      
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
    enabled: !!destination && !!departureDate && !!departureTime && !!departureDateTime && isFutureDate && !isNaN(departureDateTime?.getTime()) && !!weatherData,
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

    if (!departureDateTime) {
      toast.error('تاريخ أو وقت غير صحيح')
      return
    }

    if (!isFutureDate) {
      toast.error('الرجاء اختيار تاريخ ووقت في المستقبل')
      return
    }

    // إعادة تعيين المسار السابق
    setSelectedRoute(null)

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

        {/* معلومات الطقس التفصيلية */}
        {destination && departureDateTime && isFutureDate && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <CloudRain className="h-5 w-5 text-blue-600" />
                تنبؤات الطقس التفصيلية للتاريخ المحدد
              </h2>
              {weatherData?.source && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  مصدر: {weatherData.source === 'google' ? 'Google Weather' : 
                          weatherData.source === 'openweather' ? 'OpenWeatherMap' : 
                          weatherData.source === 'accuweather' ? 'AccuWeather' :
                          weatherData.source}
                </span>
              )}
            </div>

            {weatherLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري جلب بيانات الطقس من APIs...</p>
              </div>
            ) : weatherData ? (
              <div className="space-y-4">
                {/* بيانات الطقس الأساسية للتاريخ المحدد */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    الطقس المتوقع في {departureDate} الساعة {departureTime}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Cloud className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">الحالة</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.condition ? (
                          weatherData.condition === 'clear' || weatherData.condition === 'sunny' ? '☀️ مشمس' :
                          weatherData.condition === 'cloudy' ? '☁️ غائم' :
                          weatherData.condition === 'rainy' || weatherData.condition === 'rain' ? '🌧️ ممطر' :
                          weatherData.condition === 'snowy' || weatherData.condition === 'snow' ? '❄️ ثلجي' :
                          weatherData.condition === 'foggy' || weatherData.condition === 'fog' ? '🌫️ ضبابي' :
                          weatherData.condition === 'windy' ? '💨 عاصف' :
                          weatherData.condition === 'stormy' ? '⛈️ عاصفة' :
                          String(weatherData.condition)
                        ) : 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-700">الأمطار المتوقعة</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.source === 'openweather' && weatherData.precipitationProbability !== undefined && weatherData.precipitationProbability !== null
                          ? `${weatherData.precipitationProbability}% احتمال`
                          : weatherData.precipitation ? `${weatherData.precipitation.toFixed(1)} ملم` : '0 ملم'}
                      </p>
                      {weatherData.precipitationProbability !== undefined && weatherData.precipitationProbability !== null && weatherData.source !== 'openweather' && (
                        <p className="text-xs text-gray-600 mt-1">
                          احتمال: {weatherData.precipitationProbability}%
                        </p>
                      )}
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">الرؤية</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.visibility && !isNaN(Number(weatherData.visibility)) && Number(weatherData.visibility) > 0 
                          ? `${(Number(weatherData.visibility) >= 1000 ? Number(weatherData.visibility) / 1000 : Number(weatherData.visibility)).toFixed(1)} ${Number(weatherData.visibility) >= 1000 ? 'كم' : 'متر'}` 
                          : 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-gray-700">سرعة الرياح</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.windSpeed ? `${Number(weatherData.windSpeed).toFixed(1)} كم/س` : 'غير محدد'}
                      </p>
                      {weatherData.windDirection !== undefined && weatherData.windDirection !== null && (
                        <p className="text-xs text-gray-600 mt-1">
                          اتجاه: {Math.round(Number(weatherData.windDirection))}°
                        </p>
                      )}
                    </div>

                    {weatherData.temperature && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sun className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-medium text-gray-700">درجة الحرارة</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.temperature).toFixed(1)}°C
                        </p>
                      </div>
                    )}

                    {weatherData.humidity && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-gray-700">الرطوبة</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.humidity).toFixed(0)}%
                        </p>
                      </div>
                    )}

                    {weatherData.pressure && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <BarChart3 className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">الضغط الجوي</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.pressure).toFixed(0)} hPa
                        </p>
                      </div>
                    )}

                    {weatherData.cloudCover !== undefined && weatherData.cloudCover !== null && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Cloud className="h-4 w-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-700">الغيوم</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.cloudCover).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {weatherData.impactLevel && (
                    <div className={`mt-3 p-3 rounded-lg ${
                      weatherData.impactLevel === 'high' ? 'bg-red-50 border border-red-200' :
                      weatherData.impactLevel === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-green-50 border border-green-200'
                    }`}>
                      <p className={`text-sm font-medium ${
                        weatherData.impactLevel === 'high' ? 'text-red-800' :
                        weatherData.impactLevel === 'medium' ? 'text-yellow-800' :
                        'text-green-800'
                      }`}>
                        مستوى التأثير على القيادة: {
                          weatherData.impactLevel === 'high' ? 'عالي - يُنصح بتأجيل الرحلة' :
                          weatherData.impactLevel === 'medium' ? 'متوسط - توخي الحذر' :
                          'منخفض - ظروف جيدة'
                        }
                      </p>
                    </div>
                  )}
                </div>

                {/* التنبؤات الساعية التفصيلية */}
                {weatherData.hourlyForecast && Array.isArray(weatherData.hourlyForecast) && weatherData.hourlyForecast.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      التنبؤات الساعية التفصيلية (من API)
                    </h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {weatherData.hourlyForecast.slice(0, 24).map((hour: any, idx: number) => {
                        const hourDate = new Date(hour.timestamp)
                        const isSelectedHour = hourDate.getHours() === parseInt(departureTime?.split(':')[0] || '0') &&
                                               hourDate.toDateString() === departureDateTime?.toDateString()
                        
                        return (
                          <div 
                            key={idx} 
                            className={`bg-white rounded-lg p-3 border ${
                              isSelectedHour ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {hourDate.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {hourDate.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isSelectedHour && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">وقت المغادرة</span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-700">
                                {hour.condition === 'clear' || hour.condition === 'sunny' ? '☀️' :
                                 hour.condition === 'cloudy' ? '☁️' :
                                 hour.condition === 'rainy' || hour.condition === 'rain' ? '🌧️' :
                                 hour.condition === 'snowy' || hour.condition === 'snow' ? '❄️' :
                                 hour.condition === 'foggy' || hour.condition === 'fog' ? '🌫️' : '🌤️'}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">الحرارة:</span>
                                <span className="font-medium text-gray-900 mr-1"> {Number(hour.temperature || 0).toFixed(1)}°C</span>
                              </div>
                              <div>
                                <span className="text-gray-600">الأمطار:</span>
                                <span className="font-medium text-gray-900 mr-1">
                                  {hour.precipitationProbability !== undefined && hour.precipitationProbability !== null
                                    ? `${hour.precipitationProbability}%`
                                    : hour.precipitation ? `${Number(hour.precipitation).toFixed(1)} ملم` : '0 ملم'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">الرياح:</span>
                                <span className="font-medium text-gray-900 mr-1"> {Number(hour.windSpeed || 0).toFixed(1)} كم/س</span>
                              </div>
                              <div>
                                <span className="text-gray-600">الرؤية:</span>
                                <span className="font-medium text-gray-900 mr-1">
                                  {hour.visibility ? `${(Number(hour.visibility) >= 1000 ? Number(hour.visibility) / 1000 : Number(hour.visibility)).toFixed(1)} ${Number(hour.visibility) >= 1000 ? 'كم' : 'م'}` : 'غير محدد'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* التنبؤات اليومية التفصيلية */}
                {weatherData.dailyForecast && Array.isArray(weatherData.dailyForecast) && weatherData.dailyForecast.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-600" />
                      التنبؤات اليومية التفصيلية (من API)
                    </h3>
                    <div className="space-y-2">
                      {weatherData.dailyForecast.slice(0, 7).map((day: any, idx: number) => {
                        const dayDate = new Date(day.date)
                        const isSelectedDay = dayDate.toDateString() === departureDateTime?.toDateString()
                        
                        return (
                          <div 
                            key={idx} 
                            className={`bg-white rounded-lg p-3 border ${
                              isSelectedDay ? 'border-blue-500 border-2 bg-blue-50' : 'border-gray-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-600" />
                                <span className="font-medium text-gray-900">
                                  {dayDate.toLocaleDateString('ar-SA', { weekday: 'long', month: 'long', day: 'numeric' })}
                                </span>
                                {isSelectedDay && (
                                  <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">يوم المغادرة</span>
                                )}
                              </div>
                              <div className="text-sm font-medium text-gray-700">
                                {day.condition === 'clear' || day.condition === 'sunny' ? '☀️' :
                                 day.condition === 'cloudy' ? '☁️' :
                                 day.condition === 'rainy' || day.condition === 'rain' ? '🌧️' :
                                 day.condition === 'snowy' || day.condition === 'snow' ? '❄️' :
                                 day.condition === 'foggy' || day.condition === 'fog' ? '🌫️' : '🌤️'}
                              </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">الحرارة:</span>
                                <span className="font-medium text-gray-900 mr-1">
                                  {day.high ? `${Number(day.high).toFixed(0)}°` : ''}
                                  {day.low && day.high ? ' / ' : ''}
                                  {day.low ? `${Number(day.low).toFixed(0)}°` : ''}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">الأمطار:</span>
                                <span className="font-medium text-gray-900 mr-1">
                                  {day.precipitationProbability !== undefined && day.precipitationProbability !== null
                                    ? `${day.precipitationProbability}%`
                                    : day.precipitation ? `${Number(day.precipitation).toFixed(1)} ملم` : '0 ملم'}
                                </span>
                              </div>
                              {day.windSpeed && (
                                <div>
                                  <span className="text-gray-600">الرياح:</span>
                                  <span className="font-medium text-gray-900 mr-1"> {Number(day.windSpeed).toFixed(1)} كم/س</span>
                                </div>
                              )}
                              {day.visibility && (
                                <div>
                                  <span className="text-gray-600">الرؤية:</span>
                                  <span className="font-medium text-gray-900 mr-1">
                                    {(Number(day.visibility) >= 1000 ? Number(day.visibility) / 1000 : Number(day.visibility)).toFixed(1)} {Number(day.visibility) >= 1000 ? 'كم' : 'م'}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Cloud className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد بيانات طقس متاحة للتاريخ المحدد</p>
                <p className="text-sm text-gray-500 mt-2">تأكد من تحديد تاريخ ووقت صحيحين</p>
              </div>
            )}
          </div>
        )}

        {/* تنبؤات حركة المرور التفصيلية */}
        {userLocation && destination && departureDateTime && isFutureDate && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                تنبؤات حركة المرور التفصيلية للتاريخ المحدد
              </h2>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                مصدر: Google Routes API + Prediction Engine
              </span>
            </div>

            {routePredictionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحليل حركة المرور المتوقعة من APIs...</p>
                <p className="text-sm text-gray-500 mt-2">بناءً على البيانات الحالية والأنماط التاريخية</p>
              </div>
            ) : routePredictions ? (
              <div className="space-y-4">
                {/* معلومات الازدحام الحالي */}
                {routePredictions.currentIndex !== undefined && routePredictions.currentIndex !== null && (
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">الازدحام الحالي على المسار</p>
                        <p className="text-xs text-gray-600">من Google Routes API</p>
                      </div>
                      <div className={`text-2xl font-bold ${
                        Number(routePredictions.currentIndex) >= 70 ? 'text-red-600' :
                        Number(routePredictions.currentIndex) >= 50 ? 'text-orange-600' :
                        Number(routePredictions.currentIndex) >= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {Math.round(Number(routePredictions.currentIndex))}%
                      </div>
                    </div>
                  </div>
                )}

                {/* تنبؤات الازدحام التفصيلية */}
                {routePredictions && routePredictions.predictions && Array.isArray(routePredictions.predictions) && routePredictions.predictions.length > 0 ? (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      التنبؤات التفصيلية بناءً على التاريخ والوقت المحدد
                    </h3>
                    {routePredictions.predictions.map((prediction: any, index: number) => {
                      // التحقق من صحة البيانات قبل الاستخدام
                      if (!prediction || typeof prediction !== 'object') {
                        return null
                      }
                      
                      const congestionIndex = Number(prediction.predictedIndex || prediction.congestionIndex || 0)
                      const delayMinutes = Number(prediction.predictedDelayMinutes || prediction.delayMinutes || 0)
                      const confidence = Number(prediction.confidence || 0)
                      const predictedFor = prediction.predictedFor ? new Date(prediction.predictedFor) : null
                      
                      // التحقق من أن القيم صحيحة
                      if (isNaN(congestionIndex) || isNaN(delayMinutes) || isNaN(confidence)) {
                        console.warn('Invalid prediction data:', prediction)
                        return null
                      }
                      
                      const congestionColor = 
                        congestionIndex >= 70 ? 'bg-red-50 border-red-300 text-red-800' :
                        congestionIndex >= 50 ? 'bg-orange-50 border-orange-300 text-orange-800' :
                        congestionIndex >= 30 ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
                        'bg-green-50 border-green-300 text-green-800'
                      
                      return (
                        <div key={index} className={`rounded-lg p-4 border-2 ${congestionColor}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              <div>
                                <span className="font-semibold text-base">
                                  بعد {prediction.minutesAhead || (index + 1) * 15} دقيقة
                                </span>
                                {predictedFor && (
                                  <p className="text-xs opacity-80 mt-0.5">
                                    {predictedFor.toLocaleDateString('ar-SA', { weekday: 'short', month: 'short', day: 'numeric' })} - {predictedFor.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-2xl font-bold">
                              {congestionIndex}% ازدحام
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <p className="text-xs opacity-80 mb-1">التأخير المتوقع</p>
                              <p className="font-bold text-lg">
                                {delayMinutes > 0 ? `${delayMinutes.toFixed(1)} دقيقة` : 'غير محدد'}
                              </p>
                              {selectedRoute?.estimatedTime ? (
                                <p className="text-xs opacity-70 mt-1">
                                  الوقت الإجمالي: {Math.round(Number(selectedRoute.estimatedTime) + delayMinutes)} دقيقة
                                </p>
                              ) : (
                                <p className="text-xs opacity-70 mt-1">
                                  احسب المسار لمعرفة الوقت الإجمالي
                                </p>
                              )}
                            </div>
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <p className="text-xs opacity-80 mb-1">مستوى الثقة</p>
                              <p className="font-bold text-lg">
                                {confidence > 0 ? `${Math.round(confidence * 100)}%` : 'غير محدد'}
                              </p>
                              <p className="text-xs opacity-70 mt-1">
                                {confidence >= 0.8 ? 'عالية جداً' :
                                 confidence >= 0.6 ? 'عالية' :
                                 confidence >= 0.4 ? 'متوسطة' : 'منخفضة'}
                              </p>
                            </div>
                            {prediction.currentCongestionIndex !== undefined && prediction.currentCongestionIndex !== null && (
                              <div className="bg-white bg-opacity-50 rounded-lg p-3">
                                <p className="text-xs opacity-80 mb-1">الازدحام الحالي</p>
                                <p className="font-bold text-lg">
                                  {Math.round(Number(prediction.currentCongestionIndex))}%
                                </p>
                                <p className="text-xs opacity-70 mt-1">
                                  {congestionIndex > Number(prediction.currentCongestionIndex) ? '📈 متزايد' :
                                   congestionIndex < Number(prediction.currentCongestionIndex) ? '📉 متناقص' : '➡️ مستقر'}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          {prediction.trend && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium opacity-80">الاتجاه المتوقع:</span>
                                {prediction.trend === 'increasing' ? (
                                  <span className="text-xs font-semibold flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
                                    <TrendingUp className="h-3 w-3" />
                                    تزايد متوقع في الازدحام
                                  </span>
                                ) : prediction.trend === 'decreasing' ? (
                                  <span className="text-xs font-semibold flex items-center gap-1 bg-green-100 px-2 py-1 rounded">
                                    <TrendingDown className="h-3 w-3" />
                                    تناقص متوقع في الازدحام
                                  </span>
                                ) : (
                                  <span className="text-xs font-semibold flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                                    <Minus className="h-3 w-3" />
                                    استقرار متوقع
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {prediction.factors && Array.isArray(prediction.factors) && prediction.factors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <p className="text-xs font-medium mb-2 opacity-80">العوامل المؤثرة (من APIs):</p>
                              <div className="flex flex-wrap gap-2">
                                {prediction.factors.filter((f: any) => f != null && f !== '').map((factor: any, idx: number) => (
                                  <span key={idx} className="text-xs bg-white bg-opacity-70 px-2 py-1 rounded border border-current border-opacity-30">
                                    {String(factor || '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">لا توجد تنبؤات متاحة للتاريخ المحدد</p>
                    <p className="text-sm text-gray-500 mt-2">جاري جلب البيانات من APIs...</p>
                  </div>
                )}

                {/* ملخص التنبؤات */}
                {routePredictions && routePredictions.avgCongestion !== undefined && routePredictions.avgCongestion !== null && !isNaN(Number(routePredictions.avgCongestion)) && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">متوسط الازدحام المتوقع</p>
                        <p className="text-xs text-blue-700 mt-1">
                          بناءً على بيانات Google Routes API والأنماط التاريخية
                        </p>
                        {routePredictions.predictions && routePredictions.predictions.length > 0 && (
                          <p className="text-xs text-blue-600 mt-1">
                            {routePredictions.predictions.length} تنبؤ تم تحليله
                          </p>
                        )}
                      </div>
                      <div className={`text-3xl font-bold ${
                        Number(routePredictions.avgCongestion) >= 70 ? 'text-red-600' :
                        Number(routePredictions.avgCongestion) >= 50 ? 'text-orange-600' :
                        Number(routePredictions.avgCongestion) >= 30 ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {Number(routePredictions.avgCongestion).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : trafficPredictionsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600">جاري جلب تنبؤات حركة المرور العامة...</p>
              </div>
            ) : trafficPredictions && Array.isArray(trafficPredictions) && trafficPredictions.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-600" />
                    تنبؤات عامة للمدينة (من API)
                  </h3>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {trafficPredictions.length} طريق
                  </span>
                </div>
                {trafficPredictions.slice(0, 8).map((prediction: any, index: number) => {
                  if (!prediction || typeof prediction !== 'object') {
                    return null
                  }
                  
                  const congestionIndex = Number(prediction.predictedIndex || prediction.congestionIndex || 0)
                  const predictedFor = prediction.predictedFor ? new Date(prediction.predictedFor) : null
                  
                  if (isNaN(congestionIndex)) {
                    return null
                  }
                  
                  const congestionColor = 
                    congestionIndex >= 70 ? 'bg-red-50 border-red-300 text-red-800' :
                    congestionIndex >= 50 ? 'bg-orange-50 border-orange-300 text-orange-800' :
                    congestionIndex >= 30 ? 'bg-yellow-50 border-yellow-300 text-yellow-800' :
                    'bg-green-50 border-green-300 text-green-800'
                  
                  return (
                    <div key={index} className={`rounded-lg p-3 border-2 ${congestionColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{prediction.roadName || 'طريق غير محدد'}</p>
                          {prediction.direction && (
                            <p className="text-xs opacity-70 mt-0.5">{prediction.direction}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3 w-3 opacity-70" />
                            <span className="text-xs opacity-80">
                              بعد {prediction.minutesAhead || (index + 1) * 15} دقيقة
                            </span>
                            {predictedFor && (
                              <span className="text-xs opacity-70">
                                ({predictedFor.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-2xl font-bold">
                          {congestionIndex}%
                        </div>
                      </div>
                      {prediction.confidence !== undefined && (
                        <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                          <div className="flex items-center justify-between text-xs">
                            <span className="opacity-70">مستوى الثقة:</span>
                            <span className="font-medium">{Math.round(Number(prediction.confidence) * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }).filter(Boolean)}
                {trafficPredictions.length > 8 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-gray-500">
                      و {trafficPredictions.length - 8} طريق آخر...
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد تنبؤات متاحة للتاريخ المحدد</p>
                <p className="text-sm text-gray-500 mt-2">
                  سيتم عرض التنبؤات بعد تحديد المسار وحسابه
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
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Route className="h-5 w-5 text-primary-600" />
              معلومات المسار
            </h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-medium text-gray-700">المسافة</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedRoute.distance ? Number(selectedRoute.distance).toFixed(1) : '0.0'} كم
                  </p>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-gray-700">الوقت المتوقع</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">
                    {selectedRoute.estimatedTime ? Math.round(Number(selectedRoute.estimatedTime)) : 0} دقيقة
                  </p>
                  {selectedRoute.estimatedTimeInTraffic && (
                    <p className="text-xs text-gray-600 mt-1">
                      مع الازدحام: {Math.round(Number(selectedRoute.estimatedTimeInTraffic))} دقيقة
                    </p>
                  )}
                </div>
              </div>

              {/* معلومات إضافية */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                {selectedRoute.estimatedTime && selectedRoute.estimatedTimeInTraffic && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">الوقت بدون ازدحام</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {Math.round(Number(selectedRoute.estimatedTime))} دقيقة
                    </span>
                  </div>
                )}
                
                {selectedRoute.estimatedTimeInTraffic && selectedRoute.estimatedTime && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">تأخير الازدحام</span>
                    <span className="text-sm font-semibold text-orange-600">
                      +{Math.round(Number(selectedRoute.estimatedTimeInTraffic) - Number(selectedRoute.estimatedTime))} دقيقة
                    </span>
                  </div>
                )}

                {selectedRoute.weatherDelay && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">تأخير الطقس المتوقع</span>
                    <span className="text-sm font-semibold text-orange-600">
                      +{Math.round(Number(selectedRoute.weatherDelay))} دقيقة
                    </span>
                  </div>
                )}

                {selectedRoute.steps && selectedRoute.steps.length > 0 && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">عدد الخطوات</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedRoute.steps.length} خطوة
                    </span>
                  </div>
                )}

                {routePredictions && routePredictions.currentIndex !== undefined && routePredictions.currentIndex !== null && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">الازدحام الحالي</span>
                    <span className={`text-sm font-semibold ${
                      Number(routePredictions.currentIndex) >= 70 ? 'text-red-600' :
                      Number(routePredictions.currentIndex) >= 50 ? 'text-orange-600' :
                      Number(routePredictions.currentIndex) >= 30 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {Math.round(Number(routePredictions.currentIndex))}%
                    </span>
                  </div>
                )}

                {routePredictions && routePredictions.trend && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm text-gray-600">الاتجاه المتوقع</span>
                    <span className={`text-sm font-semibold flex items-center gap-1 ${
                      routePredictions.trend === 'increasing' ? 'text-red-600' :
                      routePredictions.trend === 'decreasing' ? 'text-green-600' :
                      'text-gray-600'
                    }`}>
                      {routePredictions.trend === 'increasing' ? (
                        <>
                          <TrendingUp className="h-4 w-4" />
                          متزايد
                        </>
                      ) : routePredictions.trend === 'decreasing' ? (
                        <>
                          <TrendingDown className="h-4 w-4" />
                          متناقص
                        </>
                      ) : (
                        <>
                          <Minus className="h-4 w-4" />
                          مستقر
                        </>
                      )}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* خريطة المسار */}
        {userLocation && destination && departureDateTime && isFutureDate && (
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary-600" />
                خريطة المسار مع حركة المرور
              </h3>
              {!selectedRoute && (
                <span className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded">
                  احسب المسار لعرض التفاصيل الكاملة
                </span>
              )}
            </div>
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

                  // استخدام origin و destination دائماً لضمان عرض المسار على الطرق الفعلية
                  const routeToUse = selectedRoute ? {
                    origin: { lat: userLocation[0], lng: userLocation[1] },
                    destination: { lat: destination[0], lng: destination[1] },
                    polyline: selectedRoute.polyline,
                  } : {
                    origin: { lat: userLocation[0], lng: userLocation[1] },
                    destination: { lat: destination[0], lng: destination[1] },
                  }

                  return (
                    <GoogleTrafficMap
                      key={`planned-route-map-${selectedRoute?.id || 'preview'}-${departureDate}-${departureTime}`}
                      center={{
                        lat: (userLocation[0] + destination[0]) / 2,
                        lng: (userLocation[1] + destination[1]) / 2,
                      }}
                      zoom={12}
                      markers={[
                        {
                          lat: userLocation[0],
                          lng: userLocation[1],
                          title: 'موقعك الحالي',
                        },
                        {
                          lat: destination[0],
                          lng: destination[1],
                          title: 'الوجهة',
                        },
                      ]}
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
            {routePredictions && routePredictions.currentIndex !== undefined && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الازدحام الحالي على المسار:</span>
                  <span className={`text-sm font-bold ${
                    Number(routePredictions.currentIndex) >= 70 ? 'text-red-600' :
                    Number(routePredictions.currentIndex) >= 50 ? 'text-orange-600' :
                    Number(routePredictions.currentIndex) >= 30 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {Math.round(Number(routePredictions.currentIndex))}%
                  </span>
                </div>
              </div>
            )}
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
                    {selectedRoute?.estimatedTimeInTraffic 
                      ? Math.round(Number(selectedRoute.estimatedTimeInTraffic))
                      : selectedRoute?.estimatedTime 
                      ? Math.round(Number(selectedRoute.estimatedTime))
                      : 0} دقيقة
                  </p>
                  {selectedRoute?.estimatedTime && selectedRoute?.estimatedTimeInTraffic && (
                    <p className="text-xs text-gray-600 mt-1">
                      بدون ازدحام: {Math.round(Number(selectedRoute.estimatedTime))} دقيقة
                    </p>
                  )}
                  {selectedRoute?.estimatedTimeInTraffic && selectedRoute?.estimatedTime && (
                    <p className="text-xs text-orange-600 mt-1 font-medium">
                      +{Math.round(Number(selectedRoute.estimatedTimeInTraffic) - Number(selectedRoute.estimatedTime))} دقيقة تأخير
                    </p>
                  )}
                </div>
              </div>

              {/* معلومات إضافية */}
              {(selectedRoute?.weatherDelay || selectedRoute?.steps?.length > 0 || routePredictions?.currentIndex !== undefined) && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">معلومات إضافية</h4>
                  <div className="space-y-2">
                    {selectedRoute?.estimatedTime && selectedRoute?.estimatedTimeInTraffic && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">الوقت بدون ازدحام</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {Math.round(Number(selectedRoute.estimatedTime))} دقيقة
                        </span>
                      </div>
                    )}
                    
                    {selectedRoute?.weatherDelay && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">تأخير الطقس المتوقع</span>
                        <span className="text-xs font-semibold text-orange-600">
                          +{Math.round(Number(selectedRoute.weatherDelay))} دقيقة
                        </span>
                      </div>
                    )}

                    {selectedRoute?.steps && selectedRoute.steps.length > 0 && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">عدد الخطوات</span>
                        <span className="text-xs font-semibold text-gray-900">
                          {selectedRoute.steps.length} خطوة
                        </span>
                      </div>
                    )}

                    {routePredictions && routePredictions.currentIndex !== undefined && routePredictions.currentIndex !== null && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">الازدحام الحالي</span>
                        <span className={`text-xs font-semibold ${
                          Number(routePredictions.currentIndex) >= 70 ? 'text-red-600' :
                          Number(routePredictions.currentIndex) >= 50 ? 'text-orange-600' :
                          Number(routePredictions.currentIndex) >= 30 ? 'text-yellow-600' :
                          'text-green-600'
                        }`}>
                          {Math.round(Number(routePredictions.currentIndex))}%
                        </span>
                      </div>
                    )}

                    {routePredictions && routePredictions.trend && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-gray-600">الاتجاه المتوقع</span>
                        <span className={`text-xs font-semibold flex items-center gap-1 ${
                          routePredictions.trend === 'increasing' ? 'text-red-600' :
                          routePredictions.trend === 'decreasing' ? 'text-green-600' :
                          'text-gray-600'
                        }`}>
                          {routePredictions.trend === 'increasing' ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              متزايد
                            </>
                          ) : routePredictions.trend === 'decreasing' ? (
                            <>
                              <TrendingDown className="h-3 w-3" />
                              متناقص
                            </>
                          ) : (
                            <>
                              <Minus className="h-3 w-3" />
                              مستقر
                            </>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* تنبؤات حركة المرور التفصيلية */}
              {routePredictionsLoading ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">جاري تحليل حركة المرور المتوقعة...</p>
                  </div>
                </div>
              ) : routePredictionsError ? (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <div className="text-center py-4">
                    <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-yellow-800">تعذر جلب تنبؤات حركة المرور</p>
                    <p className="text-xs text-yellow-700 mt-1">سيتم عرض البيانات الأساسية فقط</p>
                  </div>
                </div>
              ) : routePredictions && routePredictions.predictions && Array.isArray(routePredictions.predictions) && routePredictions.predictions.length > 0 ? (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    تنبؤات حركة المرور التفصيلية
                  </h3>
                  
                  <div className="space-y-3">
                    {routePredictions.predictions.map((prediction: any, index: number) => {
                      // التحقق من صحة البيانات قبل الاستخدام
                      if (!prediction || typeof prediction !== 'object') {
                        return null
                      }
                      
                      const congestionIndex = Number(prediction.predictedIndex || prediction.congestionIndex || 0)
                      const delayMinutes = Number(prediction.predictedDelayMinutes || prediction.delayMinutes || 0)
                      const confidence = Number(prediction.confidence || 0)
                      
                      // التحقق من أن القيم صحيحة
                      if (isNaN(congestionIndex) || isNaN(delayMinutes) || isNaN(confidence)) {
                        console.warn('Invalid prediction data:', prediction)
                        return null
                      }
                      
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
                                {confidence > 0 ? `${Math.round(confidence * 100)}%` : 'غير محدد'}
                              </p>
                            </div>
                          </div>
                          
                          {prediction.factors && Array.isArray(prediction.factors) && prediction.factors.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-current border-opacity-20">
                              <p className="text-xs font-medium mb-2">العوامل المؤثرة:</p>
                              <div className="flex flex-wrap gap-2">
                                {prediction.factors.filter((f: any) => f != null && f !== '').map((factor: any, idx: number) => (
                                  <span key={idx} className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                                    {String(factor || '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* اتجاه الازدحام */}
                          {prediction.trend && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-gray-600">الاتجاه:</span>
                              {prediction.trend === 'increasing' ? (
                                <span className="text-xs text-red-600 flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  تزايد متوقع
                                </span>
                              ) : prediction.trend === 'decreasing' ? (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  تناقص متوقع
                                </span>
                              ) : (
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  مستقر
                                </span>
                              )}
                            </div>
                          )}

                          {/* مؤشر الازدحام الحالي للمقارنة */}
                          {prediction.currentCongestionIndex !== null && prediction.currentCongestionIndex !== undefined && !isNaN(Number(prediction.currentCongestionIndex)) && (
                            <div className="mt-2 text-xs text-gray-600">
                              الازدحام الحالي: {Number(prediction.currentCongestionIndex)}%
                            </div>
                          )}
                        </div>
                      )
                    }).filter(Boolean)}
                  </div>

                  {routePredictions.avgCongestion !== undefined && routePredictions.avgCongestion !== null && !isNaN(Number(routePredictions.avgCongestion)) && (
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-700">متوسط الازدحام المتوقع</span>
                        <span className="text-xl font-bold text-gray-900">
                          {Number(routePredictions.avgCongestion).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* حالة الطقس التفصيلية - بيانات شاملة من مصادر متعددة */}
              {weatherLoading ? (
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">جاري جلب بيانات الطقس من مصادر متعددة...</p>
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
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <CloudRain className="h-5 w-5 text-blue-600" />
                      حالة الطقس المتوقعة
                    </h3>
                    {weatherData.source && (
                      <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded">
                        مصدر: {weatherData.source === 'google' ? 'Google Weather' : 
                                weatherData.source === 'openweather' ? 'OpenWeatherMap' : 
                                weatherData.source}
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Cloud className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">الحالة</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.condition ? (
                          weatherData.condition === 'clear' || weatherData.condition === 'sunny' ? '☀️ مشمس' :
                          weatherData.condition === 'cloudy' ? '☁️ غائم' :
                          weatherData.condition === 'rainy' || weatherData.condition === 'rain' ? '🌧️ ممطر' :
                          weatherData.condition === 'snowy' || weatherData.condition === 'snow' ? '❄️ ثلجي' :
                          weatherData.condition === 'foggy' || weatherData.condition === 'fog' ? '🌫️ ضبابي' :
                          weatherData.condition === 'windy' ? '💨 عاصف' :
                          weatherData.condition === 'stormy' ? '⛈️ عاصفة' :
                          String(weatherData.condition)
                        ) : 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-600">الأمطار المتوقعة</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.source === 'openweather' && weatherData.precipitationProbability !== undefined && weatherData.precipitationProbability !== null
                          ? `${weatherData.precipitationProbability}%`
                          : weatherData.precipitation ? `${Number(weatherData.precipitation).toFixed(1)} ملم` : '0 ملم'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">الرؤية</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.visibility && !isNaN(Number(weatherData.visibility)) && Number(weatherData.visibility) > 0 
                          ? `${(Number(weatherData.visibility) >= 1000 ? Number(weatherData.visibility) / 1000 : Number(weatherData.visibility)).toFixed(1)} ${Number(weatherData.visibility) >= 1000 ? 'كم' : 'متر'}` 
                          : 'غير محدد'}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Wind className="h-4 w-4 text-gray-600" />
                        <span className="text-sm text-gray-600">سرعة الرياح</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {weatherData.windSpeed ? `${Number(weatherData.windSpeed).toFixed(1)} كم/س` : 'غير محدد'}
                      </p>
                    </div>

                    {weatherData.temperature && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sun className="h-4 w-4 text-orange-600" />
                          <span className="text-sm text-gray-600">درجة الحرارة</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.temperature).toFixed(1)}°C
                        </p>
                      </div>
                    )}

                    {weatherData.humidity && (
                      <div className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Droplets className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">الرطوبة</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          {Number(weatherData.humidity).toFixed(0)}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* تنبيهات الطقس */}
                  {weatherData.alerts && Array.isArray(weatherData.alerts) && weatherData.alerts.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {weatherData.alerts.map((alert: any, index: number) => (
                        <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800">{alert.title || 'تنبيه طقس'}</p>
                          <p className="text-xs text-red-700 mt-1">{alert.description}</p>
                          <p className="text-xs text-red-600 mt-1">
                            الشدة: {alert.severity === 'extreme' ? 'شديد جداً' :
                                    alert.severity === 'severe' ? 'شديد' :
                                    alert.severity === 'moderate' ? 'متوسط' : 'خفيف'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* بيانات الطقس الساعية (إن وجدت) */}
                  {weatherData.hourlyForecast && Array.isArray(weatherData.hourlyForecast) && weatherData.hourlyForecast.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs font-medium text-gray-700 mb-2">التنبؤات الساعية القادمة:</p>
                      <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                        {weatherData.hourlyForecast.slice(0, 6).map((hour: any, idx: number) => (
                          <div key={idx} className="bg-white rounded p-2 text-center">
                            <p className="text-xs text-gray-600">
                              {new Date(hour.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-xs font-medium text-gray-900 mt-1">
                              {hour.temperature ? `${Number(hour.temperature).toFixed(0)}°` : '-'}
                            </p>
                            {hour.precipitation > 0 && (
                              <p className="text-xs text-blue-600 mt-1">
                                {Number(hour.precipitation).toFixed(1)}ملم
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

