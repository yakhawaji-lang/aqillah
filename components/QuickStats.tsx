'use client'

import { TrendingUp, AlertTriangle, Clock, MapPin } from 'lucide-react'

interface QuickStatsProps {
  avgCongestion: number
  activeAlerts: number
  avgDelay: number
  monitoredSegments: number
}

export function QuickStats({
  avgCongestion,
  activeAlerts,
  avgDelay,
  monitoredSegments,
}: QuickStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <span className="text-sm text-gray-600">متوسط الازدحام</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{avgCongestion}%</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          <span className="text-sm text-gray-600">تنبيهات نشطة</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{activeAlerts}</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="text-sm text-gray-600">متوسط التأخير</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{avgDelay.toFixed(1)} د</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-green-600" />
          <span className="text-sm text-gray-600">مقاطع مراقبة</span>
        </div>
        <p className="text-2xl font-bold text-gray-900">{monitoredSegments}</p>
      </div>
    </div>
  )
}

