'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Activity, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import axios from 'axios'
import { useQuery } from '@tanstack/react-query'

export default function MonitoringPage() {
  const [systemHealth, setSystemHealth] = useState<any>({})

  const { data: healthData } = useQuery({
    queryKey: ['system-health'],
    queryFn: async () => {
      // TODO: Implement health check endpoint
      return {
        status: 'healthy',
        services: {
          database: { status: 'up', latency: 12 },
          maps: { status: 'up', latency: 45 },
          weather: { status: 'up', latency: 120 },
          notifications: { status: 'up', latency: 8 },
        },
        metrics: {
          requestsPerMinute: 150,
          errorRate: 0.02,
          avgResponseTime: 250,
        },
      }
    },
    refetchInterval: 30000,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
          <Activity className="w-8 h-8" />
          مراقبة النظام
        </h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">حالة النظام</span>
              {healthData?.status === 'healthy' ? (
                <CheckCircle className="w-6 h-6 text-green-600" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600" />
              )}
            </div>
            <p className="text-2xl font-bold">
              {healthData?.status === 'healthy' ? 'سليم' : 'مشكلة'}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">الطلبات/الدقيقة</div>
            <p className="text-2xl font-bold">{healthData?.metrics?.requestsPerMinute || 0}</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">معدل الأخطاء</div>
            <p className="text-2xl font-bold">
              {((healthData?.metrics?.errorRate || 0) * 100).toFixed(2)}%
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-gray-600 mb-2">متوسط وقت الاستجابة</div>
            <p className="text-2xl font-bold">{healthData?.metrics?.avgResponseTime || 0}ms</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-4">حالة الخدمات</h2>
          <div className="space-y-4">
            {Object.entries(healthData?.services || {}).map(([service, data]: [string, any]) => (
              <div key={service} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {data.status === 'up' ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className="font-medium capitalize">{service}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Latency: {data.latency}ms</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    data.status === 'up' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {data.status === 'up' ? 'متاح' : 'غير متاح'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

