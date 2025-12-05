'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // تجاهل أخطاء إضافات المتصفح مثل MetaMask
  useEffect(() => {
    const originalError = window.onerror
    const originalUnhandledRejection = window.onunhandledrejection
    
    // معالج أخطاء عام
    window.onerror = (message, source, lineno, colno, error) => {
      // تجاهل أخطاء MetaMask
      if (
        typeof message === 'string' &&
        (message.includes('MetaMask') || 
         message.includes('Failed to connect') ||
         message.includes('ethereum') ||
         message.includes('web3'))
      ) {
        console.warn('Browser extension error ignored:', message)
        return true // منع عرض الخطأ
      }
      // تجاهل أخطاء من إضافات المتصفح
      if (source?.includes('chrome-extension://') || source?.includes('moz-extension://')) {
        console.warn('Browser extension error ignored:', source)
        return true
      }
      // استدعاء المعالج الأصلي للأخطاء الأخرى
      if (originalError) {
        return originalError(message, source, lineno, colno, error)
      }
      return false
    }

    // معالج أخطاء Promise غير المعالجة
    window.onunhandledrejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message = typeof reason === 'string' ? reason : reason?.message || ''
      
      // تجاهل أخطاء MetaMask في Promises
      if (
        message.includes('MetaMask') ||
        message.includes('Failed to connect') ||
        message.includes('ethereum') ||
        message.includes('web3') ||
        (reason && typeof reason === 'object' && 'stack' in reason && 
         typeof reason.stack === 'string' && reason.stack.includes('chrome-extension://'))
      ) {
        console.warn('Browser extension promise rejection ignored:', message)
        event.preventDefault() // منع عرض الخطأ
        return
      }
      
      // استدعاء المعالج الأصلي للأخطاء الأخرى
      if (originalUnhandledRejection) {
        originalUnhandledRejection(event)
      }
    }

    // تنظيف عند إلغاء التثبيت
    return () => {
      window.onerror = originalError
      window.onunhandledrejection = originalUnhandledRejection
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

