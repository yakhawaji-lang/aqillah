'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import GoogleMap from '@/components/GoogleMap'
import { ArrowLeft, MapPin, Navigation } from 'lucide-react'
import { googleMapsService } from '@/lib/services/google-maps'
import toast from 'react-hot-toast'

export default function GoogleMapPage() {
  const router = useRouter()
  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null)
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null)
  const [route, setRoute] = useState<any>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const handleMapClick = (location: { lat: number; lng: number }) => {
    if (!origin) {
      setOrigin(location)
      toast.success('تم تحديد نقطة البداية')
    } else if (!destination) {
      setDestination(location)
      toast.success('تم تحديد الوجهة')
    }
  }

  const calculateRoute = async () => {
    if (!origin || !destination) {
      toast.error('يرجى تحديد نقطة البداية والوجهة')
      return
    }

    setIsCalculating(true)
    try {
      const result = await googleMapsService.calculateRoute({
        origin,
        destination,
        departureTime: 'now',
      })

      setRoute({
        origin,
        destination,
      })

      toast.success('تم حساب المسار بنجاح')
    } catch (error: any) {
      toast.error(error.message || 'فشل حساب المسار')
    } finally {
      setIsCalculating(false)
    }
  }

  const markers = [
    ...(origin ? [{ lat: origin.lat, lng: origin.lng, title: 'نقطة البداية', icon: '🟢' }] : []),
    ...(destination ? [{ lat: destination.lat, lng: destination.lng, title: 'الوجهة', icon: '🔴' }] : []),
  ]

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

        <div className="mb-6 bg-white rounded-xl p-4 shadow-sm">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <MapPin className="w-6 h-6" />
            خريطة Google Maps
          </h1>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => {
                setOrigin(null)
                setDestination(null)
                setRoute(null)
              }}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              إعادة تعيين
            </button>
            <button
              onClick={calculateRoute}
              disabled={!origin || !destination || isCalculating}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              {isCalculating ? 'جاري الحساب...' : 'حساب المسار'}
            </button>
          </div>

          <p className="text-sm text-gray-600">
            اضغط على الخريطة لتحديد نقطة البداية ثم الوجهة
          </p>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow-lg" style={{ height: '600px' }}>
          <GoogleMap
            center={origin || { lat: 24.7136, lng: 46.6753 }}
            zoom={origin ? 14 : 12}
            markers={markers}
            route={route || undefined}
            onMapClick={handleMapClick}
            className="w-full h-full"
          />
        </div>

        {origin && destination && (
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold mb-2">الإحداثيات:</h3>
            <div className="text-sm space-y-1">
              <div>
                <span className="font-medium">البداية:</span>{' '}
                {origin.lat.toFixed(6)}, {origin.lng.toFixed(6)}
              </div>
              <div>
                <span className="font-medium">الوجهة:</span>{' '}
                {destination.lat.toFixed(6)}, {destination.lng.toFixed(6)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

