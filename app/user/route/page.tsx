'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import RoutePlanner from '@/components/user/RoutePlanner'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import WeatherLayer from '@/components/user/WeatherLayer'
import { Header } from '@/components/Header'
import { ArrowLeft, Navigation, AlertTriangle, MapPin } from 'lucide-react'
import axios from 'axios'

export default function RoutePage() {
  const router = useRouter()
  const [route, setRoute] = useState<any>(null)
  const [weatherData, setWeatherData] = useState<any[]>([])

  useEffect(() => {
    if (route?.routes?.[0]?.weather) {
      setWeatherData(route.routes[0].weather.points || [])
    }
  }, [route])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <RoutePlanner onRouteCalculated={setRoute} />
            
            {route && (
              <div className="mt-6 bg-white rounded-xl p-4 shadow-lg">
                <h3 className="font-bold mb-4">تفاصيل المسار</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>المسافة:</span>
                    <span className="font-medium">{route.summary.distance.toFixed(1)} كم</span>
                  </div>
                  <div className="flex justify-between">
                    <span>المدة:</span>
                    <span className="font-medium">{route.summary.duration.toFixed(0)} دقيقة</span>
                  </div>
                  {route.summary.durationInTraffic && (
                    <div className="flex justify-between">
                      <span>مع المرور:</span>
                      <span className="font-medium">{route.summary.durationInTraffic.toFixed(0)} دقيقة</span>
                    </div>
                  )}
                  {route.summary.maxRiskLevel && (
                    <div className="flex items-center gap-2 mt-4 p-2 bg-orange-50 rounded">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">مستوى الخطر: {route.summary.maxRiskLevel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ height: '600px' }}>
            <GoogleTrafficMap
              markers={route?.routes?.[0]?.risks?.map((r: any) => ({
                lat: r.location.lat,
                lng: r.location.lng,
                title: `مقطع ${r.segmentIndex + 1}`,
                congestionIndex: r.riskScore,
              })) || []}
              center={route?.routes?.[0]?.steps?.[0]?.startLocation 
                ? { lat: route.routes[0].steps[0].startLocation[0], lng: route.routes[0].steps[0].startLocation[1] }
                : { lat: 24.7136, lng: 46.6753 }}
              zoom={12}
              showTrafficLayer={true}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

