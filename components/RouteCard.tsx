'use client'

import { Route, Clock, TrendingUp, Navigation, MapPin } from 'lucide-react'
import { CongestionIndicator } from './CongestionIndicator'

interface RouteCardProps {
  route: {
    distance: number
    estimatedTime: number
    congestionIndex?: number
    segments?: Array<{
      name: string
      congestionIndex: number
    }>
  }
  onNavigate?: () => void
}

export function RouteCard({ route, onNavigate }: RouteCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">المسار المقترح</h3>
        {route.congestionIndex !== undefined && (
          <CongestionIndicator index={route.congestionIndex} />
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Route className="h-5 w-5 text-primary-600" />
            <span className="text-sm text-gray-600">المسافة</span>
          </div>
          <span className="font-bold text-gray-900">{route.distance.toFixed(1)} كم</span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            <span className="text-sm text-gray-600">الوقت المتوقع</span>
          </div>
          <span className="font-bold text-gray-900">
            {Math.round(route.estimatedTime)} دقيقة
          </span>
        </div>

        {route.segments && route.segments.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">المقاطع على المسار:</p>
            <div className="space-y-2">
              {route.segments.map((segment, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{segment.name}</span>
                  <CongestionIndicator index={segment.congestionIndex} showLabel={false} />
                </div>
              ))}
            </div>
          </div>
        )}

        {onNavigate && (
          <button
            onClick={onNavigate}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition flex items-center justify-center gap-2"
          >
            <Navigation className="h-5 w-5" />
            فتح في الملاح
          </button>
        )}
      </div>
    </div>
  )
}

