'use client'

import { useState } from 'react'
import { MapPin, Navigation, Route, AlertTriangle } from 'lucide-react'
import { LocationPicker } from '@/components/LocationPicker'
import axios from 'axios'
import toast from 'react-hot-toast'

interface RoutePlannerProps {
  onRouteCalculated?: (route: any) => void
}

export default function RoutePlanner({ onRouteCalculated }: RoutePlannerProps) {
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [route, setRoute] = useState<any>(null)

  const handleCalculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('يرجى تحديد نقطة البداية والوجهة')
      return
    }

    setIsCalculating(true)
    try {
      const response = await axios.post('/api/routes/compute', {
        origin,
        destination,
        preferences: {
          alternatives: true,
        },
      })

      if (response.data.success) {
        setRoute(response.data.data)
        onRouteCalculated?.(response.data.data)
        toast.success('تم حساب المسار بنجاح')
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'فشل حساب المسار')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-lg">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Route className="w-5 h-5" />
        حساب المسار الذكي
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">نقطة البداية</label>
          <LocationPicker
            onLocationSelect={(location) => setOrigin(location)}
            placeholder="اختر نقطة البداية"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">الوجهة</label>
          <LocationPicker
            onLocationSelect={(location) => setDestination(location)}
            placeholder="اختر الوجهة"
          />
        </div>

        <button
          onClick={handleCalculateRoute}
          disabled={!origin || !destination || isCalculating}
          className="w-full bg-green-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isCalculating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              جاري الحساب...
            </>
          ) : (
            <>
              <Navigation className="w-4 h-4" />
              حساب المسار
            </>
          )}
        </button>

        {route && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">المسافة:</span>
              <span className="text-sm">{route.summary.distance.toFixed(1)} كم</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">المدة:</span>
              <span className="text-sm">{route.summary.duration.toFixed(0)} دقيقة</span>
            </div>
            {route.summary.maxRiskLevel && (
              <div className="flex items-center gap-2 mt-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-orange-600">
                  مستوى الخطر: {route.summary.maxRiskLevel}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

