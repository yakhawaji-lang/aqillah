'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { AlertCard } from '@/components/AlertCard'
import { ArrowLeft, Bell, Settings } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export default function AlertsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'active' | 'critical'>('all')

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['user-alerts', filter],
    queryFn: async () => {
      const response = await axios.get(`/api/alerts?activeOnly=${filter === 'active'}`)
      return response.data.data || []
    },
    refetchInterval: 30000,
  })

  const filteredAlerts = alerts?.filter((alert: any) => {
    if (filter === 'critical') return alert.severity === 'critical'
    return true
  }) || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </button>
          
          <button
            onClick={() => router.push('/user/settings')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <Bell className="w-6 h-6" />
          <h1 className="text-2xl font-bold">التنبيهات والإشعارات</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'critical'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg ${
                filter === f
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'الكل' : f === 'active' ? 'نشطة' : 'حرجة'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : filteredAlerts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            لا توجد تنبيهات
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert: any) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

