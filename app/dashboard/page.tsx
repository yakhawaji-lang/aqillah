'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import { StatsCard } from '@/components/StatsCard'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { AlertCard } from '@/components/AlertCard'
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
  RefreshCw,
  Filter,
  Download
} from 'lucide-react'
import { MapMarker, Alert } from '@/types'
import axios from 'axios'

export default function DashboardPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الرياض')
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({
    severity: 'all',
    type: 'all',
  })
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line')

  // Real-time traffic
  const { data: trafficData, isLoading: trafficLoading, isConnected, lastUpdate, refetch: refetchTraffic } = useRealtimeTraffic(selectedCity)

  // جلب الإحصائيات
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axios.get('/api/stats')
      return res.data
    },
    refetchInterval: 30000,
  })

  // جلب التنبيهات
  const { data: alerts, refetch: refetchAlerts } = useQuery({
    queryKey: ['alerts', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/alerts?city=${selectedCity}&activeOnly=true`)
      return res.data.data as Alert[]
    },
    refetchInterval: 60000,
  })

  // جلب التنبؤات للرسم البياني
  const { data: predictions } = useQuery({
    queryKey: ['predictions', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/predictions?minutesAhead=60`)
      return res.data.data
    },
    refetchInterval: 60000,
  })

  // Filtered data
  const filteredTrafficData = trafficData?.filter((item: any) => {
    if (searchQuery && !item.roadName.toLowerCase().includes(searchQuery.toLowerCase())) {
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

  // Chart data
  const chartData = predictions?.slice(0, 10).map((pred: any, index: number) => ({
    name: `تنبؤ ${index + 1}`,
    value: pred.predictedIndex,
    time: new Date(pred.predictedFor).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
  })) || []

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

  const handleRefresh = () => {
    refetchStats()
    refetchTraffic()
    refetchAlerts()
  }

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* العنوان والتحكم */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">لوحة التحكم</h2>
              <p className="text-gray-600 mt-1">نظرة شاملة على حالة المرور في الوقت الفعلي</p>
            </div>
            <div className="flex items-center gap-4">
              <RealtimeIndicator 
                isConnected={isConnected} 
                lastUpdate={lastUpdate}
                onRefresh={() => {
                  refetchTraffic()
                  refetchStats()
                  refetchAlerts()
                }}
              />
            </div>
          </div>

          {/* البحث والفلاتر */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <SearchBar
                placeholder="ابحث عن طريق..."
                onSearch={setSearchQuery}
                suggestions={trafficData?.map((item: any) => item.roadName) || []}
              />
            </div>
            <div>
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
          </div>

          {/* فلاتر متقدمة */}
          <div className="mt-4">
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
        </div>

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="متوسط الازدحام"
            value={<AnimatedCounter value={stats?.avgCongestion || 0} suffix="%" />}
            icon={Activity}
            trend={stats?.avgCongestion ? {
              value: -5,
              isPositive: false,
            } : undefined}
          />
          <StatsCard
            title="تنبيهات نشطة"
            value={<AnimatedCounter value={filteredAlerts.length || 0} />}
            icon={AlertTriangle}
          />
          <StatsCard
            title="نقاط ازدحام عالي"
            value={<AnimatedCounter value={stats?.highCongestionCount || 0} />}
            icon={TrendingUp}
          />
          <StatsCard
            title="مقاطع مراقبة"
            value={<AnimatedCounter value={filteredTrafficData.length || 0} />}
            icon={MapPin}
          />
        </div>

        {/* الرسم البياني */}
        {chartData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">التنبؤات المستقبلية</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  خطي
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded ${chartType === 'area' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  مساحي
                </button>
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-primary-600 text-white' : 'bg-gray-200'}`}
                >
                  أعمدة
                </button>
              </div>
            </div>
            <InteractiveChart
              data={chartData}
              type={chartType}
              dataKey="value"
              title="مؤشر الازدحام المتوقع"
              color="#006633"
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* الخريطة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">خريطة الازدحام</h3>
              <div className="h-[600px]">
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
            </div>
          </div>

          {/* التنبيهات */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">التنبيهات النشطة</h3>
                <span className="text-sm text-gray-600">
                  ({filteredAlerts.length} من {alerts?.length || 0})
                </span>
              </div>
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredAlerts && filteredAlerts.length > 0 ? (
                  filteredAlerts.map((alert) => (
                    <AlertCard
                      key={alert.id}
                      alert={alert}
                      onRouteClick={() => {
                        // فتح في تطبيق الملاحة
                        console.log('فتح المسار البديل')
                      }}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>لا توجد تنبيهات نشطة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

