'use client'

import { useState } from 'react'
import AlternativeTrafficMap from '@/components/AlternativeTrafficMap'

export default function TestMapPage() {
  const [center, setCenter] = useState({ lat: 24.7136, lng: 46.6753 })
  const [zoom, setZoom] = useState(12)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">اختبار Google Maps Traffic Layer</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
          <h2 className="text-xl font-semibold mb-2">الإعدادات</h2>
          <div className="space-y-2">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude:</label>
              <input
                type="number"
                value={center.lat}
                onChange={(e) => setCenter({ ...center, lat: parseFloat(e.target.value) })}
                className="border rounded px-2 py-1 w-full"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude:</label>
              <input
                type="number"
                value={center.lng}
                onChange={(e) => setCenter({ ...center, lng: parseFloat(e.target.value) })}
                className="border rounded px-2 py-1 w-full"
                step="0.0001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Zoom:</label>
              <input
                type="number"
                value={zoom}
                onChange={(e) => setZoom(parseInt(e.target.value))}
                className="border rounded px-2 py-1 w-full"
                min="1"
                max="20"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-2">الخريطة</h2>
          <div className="h-[600px] rounded-lg overflow-hidden border-2 border-gray-300">
            <AlternativeTrafficMap
              center={center}
              zoom={zoom}
              showTrafficLayer={true}
              className="w-full h-full"
            />
          </div>
        </div>

        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-2">تعليمات:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>افتح Developer Tools (F12)</li>
            <li>اذهب إلى Console</li>
            <li>ابحث عن رسائل "Loading Google Maps"</li>
            <li>إذا رأيت أخطاء، انسخها وأرسلها</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
