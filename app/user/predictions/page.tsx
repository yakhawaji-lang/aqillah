'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Clock, TrendingUp, AlertCircle, ChevronLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { formatDateTime } from '@/lib/utils'
import { CongestionIndicator } from '@/components/CongestionIndicator'

export default function PredictionsPage() {
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState('الرياض')

  const { data: predictions } = useQuery({
    queryKey: ['predictions', selectedCity],
    queryFn: async () => {
      const res = await axios.get(`/api/predictions?minutesAhead=60`)
      return res.data.data
    },
    refetchInterval: 60000,
  })

  const cities = ['الرياض', 'جدة', 'الدمام', 'المدينة المنورة', 'الخبر', 'أبها', 'خميس مشيط']

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-primary-600 text-white p-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">التنبؤات</h1>
            <p className="text-sm opacity-90">تنبؤات الازدحام المستقبلية</p>
          </div>
        </div>

        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="w-full p-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          {cities.map((city) => (
            <option key={city} value={city} className="text-gray-900">
              {city}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {predictions && predictions.length > 0 ? (
          predictions.map((pred: any) => {
            const minutesUntil = Math.round(
              (new Date(pred.predictedFor).getTime() - Date.now()) / 60000
            )

            return (
              <div
                key={pred.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{pred.roadName}</h3>
                    <p className="text-sm text-gray-600">{pred.direction}</p>
                  </div>
                  <CongestionIndicator index={pred.predictedIndex} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>متوقع خلال</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {minutesUntil} دقيقة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <TrendingUp className="h-4 w-4" />
                      <span>التأخير المتوقع</span>
                    </div>
                    <span className="font-medium text-gray-900">
                      {pred.predictedDelayMinutes?.toFixed(1) || '0'} دقيقة
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">مستوى الثقة</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 transition-all"
                          style={{ width: `${pred.confidence * 100}%` }}
                        />
                      </div>
                      <span className="font-medium text-gray-900 text-xs">
                        {Math.round(pred.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              لا توجد تنبؤات
            </h3>
            <p className="text-gray-600">لا توجد تنبؤات متاحة حالياً</p>
          </div>
        )}
      </div>
    </div>
  )
}

