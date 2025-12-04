'use client'

import { useState } from 'react'
import { LocationPicker } from '@/components/LocationPicker'

export default function TestSearchPage() {
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number
    lng: number
    name?: string
  } | null>(null)

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">اختبار البحث عن العناوين</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ابحث عن موقع:</h2>
          <LocationPicker
            onLocationSelect={(location) => {
              console.log('📍 Location selected:', location)
              setSelectedLocation(location)
            }}
            currentLocation={[24.7136, 46.6753]}
            placeholder="اكتب اسم المكان (مثل: مطار الملك خالد)"
          />
        </div>

        {selectedLocation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">✅ تم اختيار الموقع:</h3>
            <p className="text-gray-800 font-medium mb-2">{selectedLocation.name}</p>
            <p className="text-sm text-gray-600">
              الإحداثيات: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
            </p>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">📋 خطوات الاختبار:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>افتح Console في المتصفح (F12)</li>
            <li>اكتب في حقل البحث: "مطار"</li>
            <li>راقب Console للأخطاء</li>
            <li>إذا ظهرت أخطاء، انسخها وأرسلها للمطور</li>
          </ol>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">🔗 روابط مفيدة:</h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <a href="/api/test-places" target="_blank" className="text-blue-600 hover:underline">
                اختبار المفتاح: /api/test-places
              </a>
            </li>
            <li>
              <a href="/api/places/autocomplete?input=مطار" target="_blank" className="text-blue-600 hover:underline">
                اختبار API مباشرة: /api/places/autocomplete?input=مطار
              </a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

