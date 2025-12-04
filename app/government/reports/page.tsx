'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { InteractiveChart } from '@/components/InteractiveChart'
import { AnimatedCounter } from '@/components/AnimatedCounter'
import { FileText, Download, Calendar } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function ReportsPage() {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d')

  const { data: stats } = useQuery({
    queryKey: ['reports', dateRange],
    queryFn: async () => {
      const response = await axios.get(`/api/stats?range=${dateRange}`)
      return response.data
    },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-8 h-8" />
            التقارير والإحصائيات
          </h1>
          
          <div className="flex gap-2">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-lg ${
                  dateRange === range
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {range === '7d' ? '7 أيام' : range === '30d' ? '30 يوم' : '90 يوم'}
              </button>
            ))}
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700">
              <Download className="w-4 h-4" />
              تصدير
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">إجمالي المستخدمين</div>
            <AnimatedCounter
              value={stats?.totalUsers || 0}
              className="text-3xl font-bold"
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">التنبيهات النشطة</div>
            <AnimatedCounter
              value={stats?.activeAlerts || 0}
              className="text-3xl font-bold"
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">المسارات المقترحة</div>
            <AnimatedCounter
              value={stats?.routesSuggested || 0}
              className="text-3xl font-bold"
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">متوسط وقت الاستجابة</div>
            <AnimatedCounter
              value={stats?.avgResponseTime || 0}
              suffix="ms"
              className="text-3xl font-bold"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">اتجاه الازدحام</h2>
            <InteractiveChart
              data={stats?.congestionTrend || []}
              type="area"
              dataKey="congestion"
              title=""
            />
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4">التنبيهات حسب النوع</h2>
            <InteractiveChart
              data={stats?.alertsByType || []}
              type="bar"
              dataKey="count"
              title=""
            />
          </div>
        </div>
      </div>
    </div>
  )
}

