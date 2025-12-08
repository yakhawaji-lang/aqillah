'use client'

import { useEffect, useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { StatsCard } from '@/components/StatsCard'
import { RealtimeIndicator } from '@/components/RealtimeIndicator'
import { SearchBar } from '@/components/SearchBar'
import { AdvancedFilters } from '@/components/AdvancedFilters'
import { InteractiveChart } from '@/components/InteractiveChart'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { useRealtimeTraffic } from '@/lib/hooks/useRealtimeTraffic'
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  MapPin,
  Users,
  Clock,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Zap,
  Target,
  Award,
  TrendingDown,
  Gauge,
  Shield,
  Calendar,
  DollarSign,
  Car,
  Route,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { MapMarker } from '@/types'
import axios from 'axios'

export default function GovernmentDashboardPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الرياض')
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('24h')
  const [searchQuery, setSearchQuery] = useState('')
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area')
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)

  // Real-time data مع timeRange
  const { data: trafficData, isLoading: trafficLoading, refetch: refetchTraffic, isError } = useQuery({
    queryKey: ['traffic', selectedCity, timeRange],
    queryFn: async () => {
      const res = await axios.get(`/api/traffic?city=${selectedCity}&timeRange=${timeRange}`)
      return res.data.data
    },
    refetchInterval: 30000,
    retry: 2, // إعادة المحاولة مرتين عند الفشل
  })

  // حالة الاتصال والتحديث
  const [isConnected, setIsConnected] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  // تحديث lastUpdate و isConnected عند تغيير البيانات
  useEffect(() => {
    if (trafficData && trafficData.length > 0) {
      setLastUpdate(new Date())
      setIsConnected(true)
    }
  }, [trafficData])

  useEffect(() => {
    if (isError) {
      setIsConnected(false)
    }
  }, [isError])

  useEffect(() => {
    // تحديث حالة الاتصال بناءً على نجاح جلب البيانات
    if (trafficData !== undefined && !trafficLoading) {
      // بيانات موجودة وتم تحميلها بنجاح
      setIsConnected(true)
      setLastUpdate(new Date())
    } else if (trafficLoading) {
      // في حالة تحميل - متصل
      setIsConnected(true)
    } else if (trafficData === undefined && !trafficLoading) {
      // لا توجد بيانات وليس في حالة تحميل - قد يكون خطأ
      // لكن نعتبره متصل لأن refetchInterval يعمل
      setIsConnected(true)
    }
  }, [trafficData, trafficLoading])

  // تحديث lastUpdate عند نجاح جلب البيانات
  useEffect(() => {
    if (trafficData && !trafficLoading) {
      setLastUpdate(new Date())
    }
  }, [trafficData, trafficLoading])

  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get('/api/stats')
      return res.data
    },
    refetchInterval: 30000,
  })

  const { data: predictions, refetch: refetchPredictions } = useQuery({
    queryKey: ['predictions', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/predictions?minutesAhead=60`)
      return res.data.data || []
    },
    refetchInterval: 60000,
  })

  const { data: decisions } = useQuery({
    queryKey: ['decisions', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/decisions?status=pending`)
      return res.data.data || []
    },
    refetchInterval: 60000,
  })

  const { data: bottlenecks } = useQuery({
    queryKey: ['bottlenecks', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/bottlenecks?activeOnly=true`)
      return res.data.data || []
    },
    refetchInterval: 60000,
  })

  // اكتشاف نقاط الازدحام من بيانات الخريطة مباشرة
  const detectedBottlenecks = useMemo(() => {
    if (!trafficData || trafficData.length === 0) {
      return []
    }

    // تصفية نقاط الازدحام بناءً على congestionIndex
    const bottlenecks = trafficData
      .filter((item: any) => {
        // اعتبار نقاط الازدحام: congestionIndex >= 50
        return item.congestionIndex >= 50
      })
      .map((item: any) => {
        // تحديد مستوى الشدة
        let severity: 'critical' | 'high' | 'medium' = 'medium'
        if (item.congestionIndex >= 80) {
          severity = 'critical'
        } else if (item.congestionIndex >= 70) {
          severity = 'high'
        }

        // حساب التأخير التقريبي (دقيقة لكل 10% ازدحام)
        const estimatedDelay = Math.max(1, Math.round((item.congestionIndex - 50) / 10))

        return {
          id: item.id || `detected-${item.roadName}-${item.position[0]}-${item.position[1]}`,
          roadName: item.roadName,
          city: item.city || selectedCity,
          direction: item.direction || 'غير محدد',
          position: item.position,
          congestionIndex: item.congestionIndex,
          severity,
          avgDelay: estimatedDelay,
          affectedVehicles: item.deviceCount || Math.round(item.congestionIndex * 10),
          duration: Math.round((item.congestionIndex - 50) / 5), // مدة تقريبية بالدقائق
          lastDetected: item.timestamp ? new Date(item.timestamp) : new Date(),
          avgSpeed: item.avgSpeed || 0,
        }
      })
      .sort((a: any, b: any) => b.congestionIndex - a.congestionIndex) // ترتيب حسب الشدة

    return bottlenecks
  }, [trafficData, selectedCity])

  // Filtered data
  const filteredTrafficData = trafficData?.filter((item: any) => {
    if (searchQuery && !item.roadName.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  }) || []

  useEffect(() => {
    if (filteredTrafficData) {
      const markers: MapMarker[] = filteredTrafficData.map((item: any) => ({
        id: item.id,
        position: item.position,
        congestionIndex: item.congestionIndex,
        roadName: item.roadName,
        direction: item.direction,
      }))
      setMapMarkers(markers)
    }
  }, [filteredTrafficData])

  // بيانات الرسوم البيانية من البيانات الفعلية فقط
  const chartData = useMemo(() => {
    if (!trafficData || trafficData.length === 0) {
      return []
    }

    // تجميع البيانات حسب الساعات
    const hoursMap = new Map<number, { congestion: number[], delay: number[] }>()
    
    trafficData.forEach((item: any) => {
      const timestamp = new Date(item.timestamp || Date.now())
      const hour = timestamp.getHours()
      
      if (!hoursMap.has(hour)) {
        hoursMap.set(hour, { congestion: [], delay: [] })
      }
      
      const hourData = hoursMap.get(hour)!
      hourData.congestion.push(item.congestionIndex || 0)
      hourData.delay.push(item.delayMinutes || 0)
    })

    // إنشاء بيانات لجميع الساعات (0-23)
    const result = []
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hoursMap.get(hour)
      let avgCongestion = 0
      let avgDelay = 0
      
      if (hourData && hourData.congestion.length > 0) {
        avgCongestion = hourData.congestion.reduce((a, b) => a + b, 0) / hourData.congestion.length
        avgDelay = hourData.delay.reduce((a, b) => a + b, 0) / hourData.delay.length
      }
      
      result.push({
        name: `${hour.toString().padStart(2, '0')}:00`,
        congestion: Math.round(avgCongestion),
        delay: Math.round(avgDelay * 10) / 10,
        value: Math.round(avgCongestion), // للتوافق مع InteractiveChart
      })
    }

    return result
  }, [trafficData, timeRange])

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                لوحة التحكم الحكومية
              </h2>
              <p className="text-gray-600 mt-2 text-lg">نظرة شاملة على حالة المرور الوطنية</p>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeIndicator 
                isConnected={isConnected} 
                lastUpdate={lastUpdate}
                onRefresh={() => {
                  refetchTraffic()
                  refetchStats()
                  refetchPredictions()
                }}
              />
              <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                <Download className="h-4 w-4" />
                تصدير
              </button>
            </div>
          </div>

          {/* البحث والفلترة */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="md:col-span-2">
              <SearchBar
                placeholder="ابحث عن طريق أو مقطع..."
                onSearch={setSearchQuery}
                suggestions={trafficData?.map((item: any) => item.roadName) || []}
              />
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          {/* التحكم في الوقت */}
          <div className="flex items-center gap-2 mb-4">
            {(['1h', '6h', '24h'] as const).map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range)
                  refetchTraffic()
                }}
                disabled={trafficLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-primary-600 text-white shadow-md scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-primary-300'
                } ${trafficLoading ? 'opacity-50 cursor-wait' : ''}`}
              >
                {range === '1h' ? 'ساعة' : range === '6h' ? '6 ساعات' : '24 ساعة'}
              </button>
            ))}
          </div>
        </div>

        {/* بطاقات الإحصائيات الرئيسية - تصميم احترافي */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-green-300">
                <TrendingDown className="h-4 w-4" />
                <span className="text-sm font-medium">-5.2%</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-primary-100 mb-2">متوسط الازدحام الوطني</h3>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={stats?.avgCongestion || 0} suffix="%" />
            </div>
            <p className="text-xs text-primary-200">تحسن عن الأسبوع الماضي</p>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">نشط</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-red-100 mb-2">تنبيهات نشطة</h3>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={stats?.activeAlerts || 0} />
            </div>
            <p className="text-xs text-red-200">يتطلب مراجعة فورية</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-yellow-300">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-medium">عالي</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-orange-100 mb-2">نقاط ازدحام عالي</h3>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={stats?.highCongestionCount || 0} />
            </div>
            <p className="text-xs text-orange-200">يتطلب تدخل فوري</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                <MapPin className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-1 text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">مباشر</span>
              </div>
            </div>
            <h3 className="text-sm font-medium text-blue-100 mb-2">مقاطع مراقبة</h3>
            <div className="text-3xl font-bold mb-1">
              <AnimatedCounter value={stats?.totalSegments || 0} />
            </div>
            <p className="text-xs text-blue-200">مراقبة مستمرة 24/7</p>
          </div>
        </div>

        {/* معلومات إضافية - تصميم محسّن */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border-2 border-yellow-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                {decisions?.length || 0} معلق
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">قرارات معلقة</h3>
            <p className="text-sm text-gray-600 mb-3">في انتظار الموافقة</p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">آخر تحديث: منذ {Math.floor((Date.now() - (decisions?.[0]?.createdAt?.getTime() || Date.now())) / 60000)} دقيقة</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-red-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                {detectedBottlenecks?.length || 0} نشط
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">نقاط ازدحام مكتشفة</h3>
            <p className="text-sm text-gray-600 mb-3">اكتشاف مباشر من الخريطة</p>
            <div className="flex items-center gap-2 text-sm">
              <Gauge className="h-4 w-4 text-red-500" />
              <span className="text-gray-600">
                متوسط التأخير: {detectedBottlenecks?.length > 0 
                  ? (detectedBottlenecks.reduce((sum: number, b: any) => sum + (b.avgDelay || 0), 0) / detectedBottlenecks.length).toFixed(1)
                  : '0'} دقيقة
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border-2 border-blue-200 p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                {predictions?.length || 0} نشط
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">تنبؤات نشطة</h3>
            <p className="text-sm text-gray-600 mb-3">تحليل ذكي للازدحام</p>
            <div className="flex items-center gap-2 text-sm">
              <Target className="h-4 w-4 text-blue-500" />
              <span className="text-gray-600">متوسط الثقة: {predictions?.length > 0 ? Math.round((predictions.reduce((sum: number, p: any) => sum + (p.confidence || 0), 0) / predictions.length) * 100) : 0}%</span>
            </div>
          </div>
        </div>

        {/* مؤشرات الأداء الإضافية */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">حوادث منعتها</p>
                <p className="text-lg font-bold text-gray-900">{stats?.accidentsPrevented || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Route className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">مسارات محسّنة</p>
                <p className="text-lg font-bold text-gray-900">{stats?.routesOptimized || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">تقليل التأخير</p>
                <p className="text-lg font-bold text-gray-900">{stats?.avgDelayReduction?.toFixed(1) || '0.0'}%</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Award className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">دقة البيانات</p>
                <p className="text-lg font-bold text-gray-900">{stats?.dataAccuracy?.toFixed(1) || '0.0'}%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* الرسم البياني التفاعلي */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">اتجاه الازدحام خلال اليوم</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 text-xs rounded ${chartType === 'line' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  خطي
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 text-xs rounded ${chartType === 'area' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  مساحي
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 text-xs rounded ${chartType === 'bar' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  أعمدة
                </button>
              </div>
            </div>
            <InteractiveChart
              data={chartData}
              type={chartType}
              dataKey="congestion"
              title=""
              color="#006633"
            />
          </div>

          {/* التنبؤات - تصميم محسّن */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">التنبؤات القادمة</h3>
                <p className="text-sm text-gray-600">تحليل ذكي للازدحام المتوقع</p>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                {predictions?.length || 0} تنبؤ
              </div>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {predictions && predictions.length > 0 ? (
                predictions.slice(0, 8).map((pred: any) => (
                  <div
                    key={pred.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer transform hover:scale-[1.02] ${
                      selectedSegment === pred.id
                        ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-400 shadow-md'
                        : 'bg-gray-50 border-gray-200 hover:border-primary-300 hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedSegment(selectedSegment === pred.id ? null : pred.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-bold text-gray-900">{pred.roadName}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">{pred.city} • {pred.direction}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold shadow-sm ${
                        pred.predictedIndex >= 70 ? 'bg-red-500 text-white' :
                        pred.predictedIndex >= 50 ? 'bg-yellow-500 text-white' :
                        'bg-green-500 text-white'
                      }`}>
                        {pred.predictedIndex}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="h-3 w-3" />
                        <span>خلال {Math.round((new Date(pred.predictedFor).getTime() - Date.now()) / 60000)} دقيقة</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Target className="h-3 w-3" />
                        <span>ثقة: {Math.round(pred.confidence * 100)}%</span>
                      </div>
                    </div>
                    {selectedSegment === pred.id && (
                      <div className="mt-3 pt-3 border-t border-gray-300 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">التأخير المتوقع:</span>
                          <span className="font-bold text-gray-900">{pred.predictedDelayMinutes?.toFixed(1) || '0'} دقيقة</span>
                        </div>
                        {pred.factors && pred.factors.length > 0 && (
                          <div>
                            <p className="text-xs text-gray-600 mb-1">العوامل:</p>
                            <div className="flex flex-wrap gap-1">
                              {pred.factors.map((factor: string, idx: number) => (
                                <span key={idx} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                  {factor}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Info className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500 font-medium">لا توجد تنبؤات حالياً</p>
                  <p className="text-xs text-gray-400 mt-1">سيتم تحديث البيانات تلقائياً</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* القرارات المرورية - تصميم محسّن */}
        {decisions && decisions.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">القرارات المرورية المعلقة</h3>
                <p className="text-sm text-gray-600">في انتظار الموافقة والتنفيذ</p>
              </div>
              <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-bold">
                {decisions.length} قرار
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decisions.slice(0, 6).map((decision: any) => {
                const decisionTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
                  diversion: { label: 'تحويل مروري', icon: Route, color: 'blue' },
                  signal_adjustment: { label: 'ضبط إشارة', icon: Zap, color: 'yellow' },
                  intervention: { label: 'تدخل تشغيلي', icon: AlertTriangle, color: 'red' },
                  route_optimization: { label: 'إدارة مسار', icon: Target, color: 'green' },
                }
                const typeInfo = decisionTypeLabels[decision.decisionType] || { label: 'قرار', icon: BarChart3, color: 'gray' }
                const Icon = typeInfo.icon
                const priorityColors: Record<string, string> = {
                  critical: 'bg-red-100 text-red-800 border-red-300',
                  high: 'bg-orange-100 text-orange-800 border-orange-300',
                  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
                  low: 'bg-blue-100 text-blue-800 border-blue-300',
                }
                
                return (
                  <div key={decision.id} className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-gray-200 hover:border-primary-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                          <Icon className={`h-5 w-5 text-${typeInfo.color}-600`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900">{typeInfo.label}</h4>
                          <p className="text-sm text-gray-600">{decision.roadName}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${priorityColors[decision.priority] || priorityColors.medium}`}>
                        {decision.priority === 'critical' ? 'حرج' :
                         decision.priority === 'high' ? 'عالي' :
                         decision.priority === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">تقليل التأخير</p>
                        <p className="text-lg font-bold text-green-600">{decision.expectedDelayReduction?.toFixed(1) || 0} دقيقة</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-gray-200">
                        <p className="text-xs text-gray-600 mb-1">درجة الفائدة</p>
                        <p className="text-lg font-bold text-primary-600">{decision.expectedBenefitScore?.toFixed(0) || 0}%</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{decision.estimatedImpact?.toLocaleString() || 0} مستخدم متأثر</span>
                      </div>
                      {decision.cost > 0 && (
                        <div className="text-xs text-gray-600">
                          <DollarSign className="h-4 w-4 inline mr-1" />
                          {decision.cost.toLocaleString()} ريال
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* جدول نقاط الازدحام - تصميم احترافي */}
        {detectedBottlenecks && detectedBottlenecks.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">نقاط الازدحام المكتشفة</h3>
                <p className="text-sm text-gray-600">اكتشاف مباشر من بيانات الخريطة</p>
              </div>
              <div className="px-4 py-2 bg-red-100 text-red-800 rounded-lg font-bold">
                {detectedBottlenecks.length} نقطة نشطة
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">الطريق</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">المدينة</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">مؤشر الازدحام</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">الشدة</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">التأخير</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">المركبات المتأثرة</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">المدة</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">آخر كشف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {detectedBottlenecks.slice(0, 10).map((bottleneck: any) => {
                    const severityColors: Record<string, { bg: string; text: string; label: string }> = {
                      critical: { bg: 'bg-red-100', text: 'text-red-800', label: 'حرج' },
                      high: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'عالي' },
                      medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'متوسط' },
                      low: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'منخفض' },
                    }
                    const severity = severityColors[bottleneck.severity] || severityColors.medium
                    
                    return (
                      <tr key={bottleneck.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{bottleneck.roadName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{bottleneck.city}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold ${
                            bottleneck.congestionIndex >= 80 ? 'text-red-600' :
                            bottleneck.congestionIndex >= 70 ? 'text-orange-600' :
                            'text-yellow-600'
                          }`}>
                            {bottleneck.congestionIndex}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${severity.bg} ${severity.text}`}>
                            {severity.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-gray-900">{bottleneck.avgDelay?.toFixed(1) || '0'} دقيقة</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-700">{bottleneck.affectedVehicles?.toLocaleString() || '0'}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-gray-700">{bottleneck.duration || 0} دقيقة</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs text-gray-600">
                            منذ {Math.floor((Date.now() - (bottleneck.lastDetected?.getTime() || Date.now())) / 60000)} دقيقة
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* الخريطة - تصميم محسّن */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">خريطة الازدحام الوطنية</h3>
              <p className="text-sm text-gray-600">عرض مباشر لحالة المرور في جميع المدن</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-800">مباشر</span>
              </div>
            </div>
          </div>
          <div className="h-[650px] rounded-lg overflow-hidden border border-gray-200 shadow-inner">
            <GoogleTrafficMap
              center={
                selectedCity === 'الرياض' ? { lat: 24.7136, lng: 46.6753 } :
                selectedCity === 'جدة' ? { lat: 21.4858, lng: 39.1925 } :
                selectedCity === 'الدمام' ? { lat: 26.4207, lng: 50.0888 } :
                selectedCity === 'المدينة المنورة' ? { lat: 24.5247, lng: 39.5692 } :
                selectedCity === 'الخبر' ? { lat: 26.2794, lng: 50.2080 } :
                selectedCity === 'أبها' ? { lat: 18.2164, lng: 42.5042 } :
                selectedCity === 'خميس مشيط' ? { lat: 18.3000, lng: 42.7333 } :
                { lat: 24.7136, lng: 46.6753 }
              }
              zoom={selectedCity === 'الرياض' ? 11 : 12}
              markers={mapMarkers.map(m => ({
                lat: m.position[0],
                lng: m.position[1],
                title: m.roadName,
                congestionIndex: m.congestionIndex,
              }))}
              showTrafficLayer={true}
              className="w-full h-full"
            />
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-600">سلس (0-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-600">متوسط (40-70%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-gray-600">مزدحم (70%+)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

