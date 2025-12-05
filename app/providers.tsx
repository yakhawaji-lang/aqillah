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
    window.onerror = (message, source, lineno, colno, error) => {
      // تجاهل أخطاء MetaMask
      if (
        typeof message === 'string' &&
        (message.includes('MetaMask') || message.includes('Failed to connect'))
      ) {
        return true // منع عرض الخطأ
      }
      // تجاهل أخطاء من إضافات المتصفح
      if (source?.includes('chrome-extension://')) {
        return true
      }
      // استدعاء المعالج الأصلي للأخطاء الأخرى
      if (originalError) {
        return originalError(message, source, lineno, colno, error)
      }
      return false
    }

    // تنظيف عند إلغاء التثبيت
    return () => {
      window.onerror = originalError
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

