'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // تجاهل أخطاء إضافات المتصفح مثل MetaMask
    if (error.message?.includes('MetaMask') || error.message?.includes('Failed to connect')) {
      console.warn('Browser extension error ignored:', error.message)
      return
    }
    console.error(error)
  }, [error])

  // تجاهل أخطاء MetaMask - لا تعرض رسالة خطأ للمستخدم
  if (error.message?.includes('MetaMask') || error.message?.includes('Failed to connect')) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">حدث خطأ</h2>
        <p className="text-gray-600 mb-6">
          عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}

