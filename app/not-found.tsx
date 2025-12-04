import Link from 'next/link'
import { MapPin } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <MapPin className="h-20 w-20 text-primary-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-2">404</h2>
        <p className="text-gray-600 mb-6">
          الصفحة المطلوبة غير موجودة
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          العودة للوحة التحكم
        </Link>
      </div>
    </div>
  )
}

