'use client'

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import axios from 'axios'
import {
  Database,
  Map,
  Cloud,
  Eye,
  Route,
  MapPin,
  Gauge,
  AlertTriangle,
  TrendingUp,
  Clock,
  RefreshCw,
  CheckCircle,
  XCircle,
  Info,
  Activity,
  Wind,
  Droplets,
  Sun,
  CloudRain,
  Navigation,
  Zap,
  Shield,
  BarChart3,
  Search,
} from 'lucide-react'

interface ApiData {
  name: string
  endpoint: string
  icon: any
  color: string
  category: 'traffic' | 'weather' | 'visibility' | 'places' | 'other'
  description: string
  data?: any
  loading?: boolean
  error?: string
}

export default function DataCenterPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الرياض')
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedApi, setExpandedApi] = useState<string | null>(null)

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']
  
  // إحداثيات المدن
  const cityCoordinates: Record<string, { lat: number; lng: number }> = {
    'الرياض': { lat: 24.7136, lng: 46.6753 },
    'جدة': { lat: 21.4858, lng: 39.1925 },
    'الدمام': { lat: 26.4207, lng: 50.0888 },
    'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
    'الخبر': { lat: 26.2794, lng: 50.2080 },
    'أبها': { lat: 18.2164, lng: 42.5042 },
    'خميس مشيط': { lat: 18.3000, lng: 42.7333 },
  }
  
  const currentCityCoords = cityCoordinates[selectedCity] || cityCoordinates['الرياض']

  // تعريف جميع APIs المتوفرة - استخدام useMemo لإعادة بناء الـ endpoints عند تغيير المدينة
  const apis: ApiData[] = useMemo(() => {
    const currentCityCoords = cityCoordinates[selectedCity] || cityCoordinates['الرياض']
    return [
    // Google Maps Traffic APIs
    {
      name: 'مسح شامل للازدحام',
      endpoint: `/api/traffic/scan?city=${selectedCity}&minCongestion=20`,
      icon: Map,
      color: 'blue',
      category: 'traffic',
      description: 'مسح شامل لجميع الشوارع المزدحمة في المدينة',
    },
    {
      name: 'بيانات الازدحام المباشرة',
      endpoint: `/api/traffic/live?city=${selectedCity}`,
      icon: Activity,
      color: 'green',
      category: 'traffic',
      description: 'بيانات مباشرة من Google Routes API',
    },
    {
      name: 'بيانات الازدحام من Google',
      endpoint: `/api/traffic/google?city=${selectedCity}`,
      icon: Map,
      color: 'blue',
      category: 'traffic',
      description: 'بيانات الازدحام من Google Directions API',
    },
    {
      name: 'تاريخ الازدحام',
      endpoint: `/api/traffic/history?city=${selectedCity}&hours=24`,
      icon: Clock,
      color: 'purple',
      category: 'traffic',
      description: 'بيانات تاريخية للازدحام خلال 24 ساعة',
    },
    {
      name: 'حدود السرعة',
      endpoint: `/api/traffic/speed-limits?points=${currentCityCoords.lat},${currentCityCoords.lng}|${currentCityCoords.lat + 0.01},${currentCityCoords.lng + 0.01}`,
      icon: Gauge,
      color: 'orange',
      category: 'traffic',
      description: 'حدود السرعة للطرق من Google Speed Limits API',
    },
    {
      name: 'بيانات نقطة محددة',
      endpoint: `/api/traffic/point?lat=24.7136&lng=46.6753`,
      icon: MapPin,
      color: 'red',
      category: 'traffic',
      description: 'بيانات الازدحام لنقطة محددة على الخريطة',
    },
    // Weather APIs
    {
      name: 'بيانات الطقس',
      endpoint: `/api/weather/point?lat=24.7136&lng=46.6753`,
      icon: Cloud,
      color: 'sky',
      category: 'weather',
      description: 'بيانات الطقس الحالية من OpenWeatherMap API',
    },
    {
      name: 'تأثير الطقس',
      endpoint: `/api/weather/impact?lat=${currentCityCoords.lat}&lng=${currentCityCoords.lng}`,
      icon: CloudRain,
      color: 'blue',
      category: 'weather',
      description: 'تحليل تأثير الطقس على حركة المرور',
    },
    {
      name: 'طرق آمنة للطقس',
      endpoint: `/api/weather/safe-routes?city=${encodeURIComponent(selectedCity)}`,
      icon: Shield,
      color: 'green',
      category: 'weather',
      description: 'طرق آمنة بناءً على حالة الطقس',
    },
    // Visibility APIs
    {
      name: 'الرؤية الحالية',
      endpoint: `/api/visibility/current?city=${selectedCity}`,
      icon: Eye,
      color: 'indigo',
      category: 'visibility',
      description: 'بيانات الرؤية الحالية للطرق',
    },
    {
      name: 'توقعات الرؤية',
      endpoint: `/api/visibility/forecast?city=${selectedCity}`,
      icon: Sun,
      color: 'yellow',
      category: 'visibility',
      description: 'توقعات الرؤية للطرق القادمة',
    },
    // Places APIs
    {
      name: 'البحث التلقائي',
      endpoint: `/api/places/autocomplete?input=${encodeURIComponent(selectedCity)}`,
      icon: Search,
      color: 'blue',
      category: 'places',
      description: 'Google Places Autocomplete API',
    },
    {
      name: 'تفاصيل المكان',
      endpoint: `/api/places/details?place_id=ChIJN1t_tDeuEmsRUsoyG83frY4`,
      icon: Info,
      color: 'purple',
      category: 'places',
      description: 'تفاصيل مكان محدد من Google Places API',
    },
    {
      name: 'Geocoding',
      endpoint: `/api/places/geocode?address=${encodeURIComponent(selectedCity)}`,
      icon: MapPin,
      color: 'green',
      category: 'places',
      description: 'تحويل العنوان إلى إحداثيات من Google Geocoding API',
    },
    // Predictions APIs
    {
      name: 'التنبؤات الحقيقية',
      endpoint: `/api/predictions/real?city=${selectedCity}&minutesAhead=60`,
      icon: TrendingUp,
      color: 'orange',
      category: 'other',
      description: 'تنبؤات حقيقية بناءً على بيانات Google Traffic API',
    },
    // Other APIs
    {
      name: 'التنبيهات',
      endpoint: `/api/alerts?city=${selectedCity}&activeOnly=true`,
      icon: AlertTriangle,
      color: 'red',
      category: 'other',
      description: 'التنبيهات النشطة في المدينة',
    },
    {
      name: 'الإحصائيات',
      endpoint: `/api/stats`,
      icon: BarChart3,
      color: 'blue',
      category: 'other',
      description: 'إحصائيات شاملة للنظام',
    },
    {
      name: 'نقاط الاختناق',
      endpoint: `/api/bottlenecks?activeOnly=true`,
      icon: Route,
      color: 'red',
      category: 'other',
      description: 'نقاط الاختناق النشطة',
    },
    {
      name: 'القرارات المرورية',
      endpoint: `/api/decisions?status=pending`,
      icon: Zap,
      color: 'yellow',
      category: 'other',
      description: 'القرارات المرورية المعلقة',
    },
  ]
  }, [selectedCity])

  // جلب البيانات لكل API تلقائياً لحساب الإحصائيات
  const apiQueries = apis.map((api) => {
    // تنظيف الـ endpoint
    let endpoint = api.endpoint.replace(/\/$/, '')
    endpoint = endpoint.replace(/([^\/\?&])\/(\?|&|$)/g, '$1$2')
    endpoint = endpoint.replace(/([^\/])\/$/, '$1')
    
    return useQuery({
      queryKey: ['api-stats', endpoint, selectedCity],
      queryFn: async () => {
        try {
          const response = await axios.get(endpoint)
          return response.data
        } catch (error: any) {
          throw error
        }
      },
      enabled: true, // جلب البيانات تلقائياً للإحصائيات
      refetchInterval: 60000, // تحديث كل دقيقة
      staleTime: 30000, // البيانات صالحة لمدة 30 ثانية
      retry: 1, // إعادة المحاولة مرة واحدة فقط
    })
  })

  // تجميع APIs حسب الفئة مع البيانات
  const apisByCategory = apis.reduce((acc, api, index) => {
    const query = apiQueries[index]
    const responseData = query.data
    const apiWithData = {
      ...api,
      data: responseData?.data || (responseData?.success ? responseData : responseData || null),
      loading: query.isLoading,
      error: query.error ? (query.error instanceof Error ? query.error.message : String(query.error)) : undefined,
    }
    
    if (!acc[api.category]) {
      acc[api.category] = []
    }
    acc[api.category].push(apiWithData)
    return acc
  }, {} as Record<string, ApiData[]>)

  const categoryLabels: Record<string, { label: string; icon: any; color: string }> = {
    traffic: { label: 'بيانات المرور', icon: Map, color: 'blue' },
    weather: { label: 'بيانات الطقس', icon: Cloud, color: 'sky' },
    visibility: { label: 'الرؤية', icon: Eye, color: 'indigo' },
    places: { label: 'الأماكن', icon: MapPin, color: 'green' },
    other: { label: 'أخرى', icon: Database, color: 'gray' },
  }

  // حساب الإحصائيات من جميع الـ APIs
  const statistics = useMemo(() => {
    let totalApis = apis.length
    let totalDataPoints = 0
    let successfulApis = 0
    let failedApis = 0
    let totalTrafficSegments = 0
    let totalAlerts = 0
    let totalBottlenecks = 0
    let avgCongestion = 0
    let highCongestionCount = 0
    let totalWeatherData = 0
    let totalVisibilityData = 0
    let totalPlacesData = 0
    let congestionValues: number[] = []

    // جمع البيانات من جميع الـ APIs
    apiQueries.forEach((query, index) => {
      const api = apis[index]
      const responseData = query.data
      
      if (responseData && !query.error) {
        successfulApis++
        
        // استخراج البيانات من response
        let dataToProcess: any = null
        if (responseData.data) {
          dataToProcess = responseData.data
        } else if (responseData.success && responseData.data) {
          dataToProcess = responseData.data
        } else if (Array.isArray(responseData)) {
          dataToProcess = responseData
        } else if (typeof responseData === 'object') {
          dataToProcess = responseData
        }

        if (dataToProcess) {
          if (Array.isArray(dataToProcess)) {
            totalDataPoints += dataToProcess.length

            // إحصائيات المرور
            if (api.category === 'traffic' && dataToProcess.length > 0) {
              totalTrafficSegments += dataToProcess.length
              const trafficCongestion = dataToProcess
                .map((item: any) => item.congestionIndex || 0)
                .filter((val: number) => val > 0)
              congestionValues.push(...trafficCongestion)
            }

            // إحصائيات الطقس
            if (api.category === 'weather') {
              totalWeatherData += dataToProcess.length
            }

            // إحصائيات الرؤية
            if (api.category === 'visibility') {
              totalVisibilityData += dataToProcess.length
            }

            // إحصائيات الأماكن
            if (api.category === 'places') {
              totalPlacesData += dataToProcess.length
            }

            // إحصائيات خاصة
            if (api.name === 'التنبيهات') {
              totalAlerts = dataToProcess.length
            }
            if (api.name === 'نقاط الاختناق') {
              totalBottlenecks = dataToProcess.length
            }
          } else if (typeof dataToProcess === 'object') {
            totalDataPoints += Object.keys(dataToProcess).length

            // إحصائيات خاصة من objects
            if (api.name === 'التنبيهات' && Array.isArray(dataToProcess.data)) {
              totalAlerts = dataToProcess.data.length
            }
            if (api.name === 'نقاط الاختناق' && Array.isArray(dataToProcess.data)) {
              totalBottlenecks = dataToProcess.data.length
            }
            if (api.category === 'traffic' && Array.isArray(dataToProcess.data)) {
              totalTrafficSegments += dataToProcess.data.length
              const trafficCongestion = dataToProcess.data
                .map((item: any) => item.congestionIndex || 0)
                .filter((val: number) => val > 0)
              congestionValues.push(...trafficCongestion)
            }
          } else {
            totalDataPoints += 1
          }
        }
      } else if (query.error) {
        failedApis++
      }
    })

    // حساب متوسط الازدحام
    if (congestionValues.length > 0) {
      avgCongestion = congestionValues.reduce((sum, val) => sum + val, 0) / congestionValues.length
      highCongestionCount = congestionValues.filter((val) => val >= 70).length
    }

    return {
      totalApis,
      successfulApis,
      failedApis,
      totalDataPoints,
      totalTrafficSegments,
      totalAlerts,
      totalBottlenecks,
      avgCongestion: Math.round(avgCongestion * 10) / 10,
      highCongestionCount,
      totalWeatherData,
      totalVisibilityData,
      totalPlacesData,
    }
  }, [apis, apiQueries])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                مركز البيانات
              </h2>
              <p className="text-gray-600 mt-2 text-lg">جميع البيانات المتوفرة من APIs</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {cities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* قسم الإحصائيات الشامل */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">إحصائيات شاملة</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* إحصائيات عامة */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Database className="h-8 w-8" />
                <div className="text-right">
                  <p className="text-sm text-blue-100">إجمالي APIs</p>
                  <p className="text-3xl font-bold">{statistics.totalApis}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-300">✓ {statistics.successfulApis} ناجح</span>
                <span className="text-red-300">✗ {statistics.failedApis} فاشل</span>
              </div>
            </div>

            {/* إجمالي نقاط البيانات */}
            <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <BarChart3 className="h-8 w-8" />
                <div className="text-right">
                  <p className="text-sm text-green-100">إجمالي نقاط البيانات</p>
                  <p className="text-3xl font-bold">{statistics.totalDataPoints.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-green-200">من جميع المصادر</p>
            </div>

            {/* مقاطع المرور */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Route className="h-8 w-8" />
                <div className="text-right">
                  <p className="text-sm text-purple-100">مقاطع المرور</p>
                  <p className="text-3xl font-bold">{statistics.totalTrafficSegments}</p>
                </div>
              </div>
              <p className="text-xs text-purple-200">مراقبة مستمرة</p>
            </div>

            {/* متوسط الازدحام */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Gauge className="h-8 w-8" />
                <div className="text-right">
                  <p className="text-sm text-orange-100">متوسط الازدحام</p>
                  <p className="text-3xl font-bold">{statistics.avgCongestion}%</p>
                </div>
              </div>
              <p className="text-xs text-orange-200">{statistics.highCongestionCount} نقطة ازدحام عالي</p>
            </div>
          </div>

          {/* إحصائيات تفصيلية */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* التنبيهات */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-red-500">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-gray-900">{statistics.totalAlerts}</span>
              </div>
              <p className="text-sm text-gray-600">تنبيهات نشطة</p>
            </div>

            {/* نقاط الاختناق */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-orange-500">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold text-gray-900">{statistics.totalBottlenecks}</span>
              </div>
              <p className="text-sm text-gray-600">نقاط اختناق</p>
            </div>

            {/* بيانات الطقس */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-sky-500">
              <div className="flex items-center justify-between mb-2">
                <Cloud className="h-5 w-5 text-sky-500" />
                <span className="text-2xl font-bold text-gray-900">{statistics.totalWeatherData}</span>
              </div>
              <p className="text-sm text-gray-600">بيانات الطقس</p>
            </div>

            {/* بيانات الرؤية */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-indigo-500">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-5 w-5 text-indigo-500" />
                <span className="text-2xl font-bold text-gray-900">{statistics.totalVisibilityData}</span>
              </div>
              <p className="text-sm text-gray-600">بيانات الرؤية</p>
            </div>

            {/* بيانات الأماكن */}
            <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <MapPin className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-gray-900">{statistics.totalPlacesData}</span>
              </div>
              <p className="text-sm text-gray-600">بيانات الأماكن</p>
            </div>
          </div>
        </div>

        {/* عرض APIs حسب الفئة */}
        <div className="space-y-6">
          {Object.entries(apisByCategory).map(([category, categoryApis]) => {
            const categoryInfo = categoryLabels[category]
            const CategoryIcon = categoryInfo.icon
            const isExpanded = expandedCategory === category

            return (
              <div key={category} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 bg-${categoryInfo.color}-100 rounded-lg`}>
                      <CategoryIcon className={`h-6 w-6 text-${categoryInfo.color}-600`} />
                    </div>
                    <div className="text-right">
                      <h3 className="text-xl font-bold text-gray-900">{categoryInfo.label}</h3>
                      <p className="text-sm text-gray-600">{categoryApis.length} API متوفر</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {isExpanded ? 'إخفاء' : 'عرض'}
                    </span>
                    <RefreshCw className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-200 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryApis.map((api) => {
                        const ApiIcon = api.icon
                        const isApiExpanded = expandedApi === api.endpoint

                        return (
                          <ApiCard
                            key={api.endpoint}
                            api={api}
                            selectedCity={selectedCity}
                            isExpanded={isApiExpanded}
                            onToggle={() => setExpandedApi(isApiExpanded ? null : api.endpoint)}
                            ApiIcon={ApiIcon}
                          />
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

function ApiCard({ api, selectedCity, isExpanded, onToggle, ApiIcon }: {
  api: ApiData
  selectedCity: string
  isExpanded: boolean
  onToggle: () => void
  ApiIcon: any
}) {
  // الـ endpoint تم بناؤه بالفعل في useMemo، لكن يجب التأكد من عدم وجود `/` في النهاية أو بعد query parameters
  // إزالة `/` في نهاية الـ URL أولاً
  let endpoint = api.endpoint.replace(/\/$/, '')
  // إزالة `/` بعد آخر قيمة في query parameter (مثل: ?points=1,2|3,4/ -> ?points=1,2|3,4)
  // هذا regex يزيل `/` بعد أي حرف ليس `/` أو `?` أو `&` إذا كان يليه `?` أو `&` أو نهاية السطر
  endpoint = endpoint.replace(/([^\/\?&])\/(\?|&|$)/g, '$1$2')
  // إزالة `/` بعد آخر parameter في query string إذا كان في النهاية مباشرة
  endpoint = endpoint.replace(/([^\/])\/$/, '$1')
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['api-data', endpoint],
    queryFn: async () => {
      try {
        const response = await axios.get(endpoint)
        return response.data
      } catch (err: any) {
        throw new Error(err.message || 'فشل في جلب البيانات')
      }
    },
    enabled: isExpanded, // جلب البيانات فقط عند التوسيع
    refetchInterval: isExpanded ? 30000 : false, // تحديث كل 30 ثانية عند التوسيع
  })

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`p-2 bg-${api.color}-100 rounded-lg`}>
            <ApiIcon className={`h-5 w-5 text-${api.color}-600`} />
          </div>
          <div className="text-right flex-1">
            <h4 className="font-bold text-gray-900 text-sm">{api.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{api.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && <RefreshCw className="h-4 w-4 text-gray-400 animate-spin" />}
          {error && <XCircle className="h-4 w-4 text-red-500" />}
          {data && !isLoading && !error && <CheckCircle className="h-4 w-4 text-green-500" />}
          <Info className="h-4 w-4 text-gray-400" />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-700">Endpoint:</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  refetch()
                }}
                className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                تحديث
              </button>
            </div>
            <code className="text-xs bg-white p-2 rounded border border-gray-200 block break-all">
              {endpoint}
            </code>
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 text-primary-600 animate-spin" />
              <p className="text-sm text-gray-600">جاري جلب البيانات...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-bold text-red-800">خطأ</span>
              </div>
              <p className="text-xs text-red-700">{error instanceof Error ? error.message : String(error)}</p>
            </div>
          )}

          {data && !isLoading && !error && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-bold text-green-800">نجح</span>
                <span className="text-xs text-gray-500">
                  ({typeof data === 'object' ? Object.keys(data).length : '1'} حقل)
                </span>
              </div>
              <div className="bg-white rounded border border-gray-200 p-3 max-h-96 overflow-y-auto">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

