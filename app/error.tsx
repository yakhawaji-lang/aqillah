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
    const errorMessage = error.message || error.toString() || ''
    const errorStack = error.stack || ''
    
    if (
      errorMessage.includes('MetaMask') ||
      errorMessage.includes('Failed to connect') ||
      errorMessage.includes('ethereum') ||
      errorMessage.includes('web3') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('moz-extension://')
    ) {
      console.warn('Browser extension error ignored:', errorMessage)
      return
    }
    console.error(error)
  }, [error])

  // تجاهل أخطاء MetaMask والأخطاء غير المهمة - لا تعرض رسالة خطأ للمستخدم
  const errorMessage = error.message || error.toString() || ''
  const errorStack = error.stack || ''
  
  // تجاهل الأخطاء غير المهمة وإعادة التوجيه تلقائياً
  useEffect(() => {
    if (
      errorMessage.includes('MetaMask') ||
      errorMessage.includes('Failed to connect') ||
      errorMessage.includes('ethereum') ||
      errorMessage.includes('web3') ||
      errorStack.includes('chrome-extension://') ||
      errorStack.includes('moz-extension://') ||
      errorMessage.includes('localStorage') ||
      errorMessage.includes('Cannot read properties') ||
      errorMessage.includes('undefined') ||
      errorMessage.includes('null') ||
      errorMessage.includes('hydration') ||
      errorMessage.includes('Hydration')
    ) {
      // محاولة الانتقال إلى صفحة التوجيه إذا كان هناك مسار محفوظ
      if (typeof window !== 'undefined') {
        const savedRoute = localStorage.getItem('currentRoute')
        if (savedRoute) {
          try {
            const parsedRoute = JSON.parse(savedRoute)
            if (parsedRoute && parsedRoute.id) {
              window.location.href = `/user/navigation?routeId=${parsedRoute.id}`
              return
            }
          } catch (e) {
            // تجاهل الخطأ
          }
        }
        // إذا لم يكن هناك مسار محفوظ، العودة إلى صفحة المستخدم
        window.location.href = '/user'
      }
    }
  }, [errorMessage, errorStack])
  
  if (
    errorMessage.includes('MetaMask') ||
    errorMessage.includes('Failed to connect') ||
    errorMessage.includes('ethereum') ||
    errorMessage.includes('web3') ||
    errorStack.includes('chrome-extension://') ||
    errorStack.includes('moz-extension://') ||
    errorMessage.includes('localStorage') ||
    errorMessage.includes('Cannot read properties') ||
    errorMessage.includes('undefined') ||
    errorMessage.includes('null') ||
    errorMessage.includes('hydration') ||
    errorMessage.includes('Hydration')
  ) {
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
