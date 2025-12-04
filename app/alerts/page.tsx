'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/Header'
import { AlertCard } from '@/components/AlertCard'
import { Alert } from '@/types'
import axios from 'axios'
import { AlertTriangle, Filter, Bell } from 'lucide-react'

export default function AlertsPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الرياض')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts', selectedCity, filterSeverity, filterType],
    queryFn: async () => {
      const res = await axios.get(`/api/alerts?city=${selectedCity}&activeOnly=true`)
      let data = res.data.data as Alert[]
      
      if (filterSeverity !== 'all') {
        data = data.filter(alert => alert.severity === filterSeverity)
      }
      
      if (filterType !== 'all') {
        data = data.filter(alert => alert.type === filterType)
      }
      
      return data
    },
    refetchInterval: 60000,
  })

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">التنبيهات</h2>
          <p className="text-gray-600 mt-1">جميع التنبيهات والتحذيرات المرورية النشطة</p>
        </div>

        {/* الفلاتر */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                مستوى الخطورة
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">الكل</option>
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">عالي</option>
                <option value="critical">حرج</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع التنبيه
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">الكل</option>
                <option value="congestion">ازدحام</option>
                <option value="accident">حادث</option>
                <option value="event">فعالية</option>
                <option value="weather">طقس</option>
              </select>
            </div>
          </div>
        </div>

        {/* قائمة التنبيهات */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">جاري تحميل التنبيهات...</p>
          </div>
        ) : alerts && alerts.length > 0 ? (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRouteClick={() => {
                  // فتح في تطبيق الملاحة
                  console.log('فتح المسار البديل', alert.alternativeRoute)
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد تنبيهات</h3>
            <p className="text-gray-600">لا توجد تنبيهات نشطة تطابق الفلاتر المحددة</p>
          </div>
        )}
      </main>
    </div>
  )
}

