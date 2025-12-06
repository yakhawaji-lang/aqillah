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
    
    // دالة للتحقق من أخطاء MetaMask
    const isMetaMaskError = (message: any, source?: string | null, error?: Error | null): boolean => {
      const messageStr = typeof message === 'string' ? message : String(message)
      const errorMessage = error?.message || ''
      const errorStack = error?.stack || ''
      const sourceStr = source || ''
      
      return (
        messageStr.includes('MetaMask') ||
        messageStr.includes('Failed to connect') ||
        messageStr.includes('ethereum') ||
        messageStr.includes('web3') ||
        messageStr.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') || // MetaMask extension ID
        errorMessage.includes('MetaMask') ||
        errorMessage.includes('Failed to connect') ||
        errorMessage.includes('ethereum') ||
        errorMessage.includes('web3') ||
        errorStack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        errorStack.includes('moz-extension://') ||
        sourceStr.includes('chrome-extension://') ||
        sourceStr.includes('moz-extension://')
      )
    }
    
    // معالج أخطاء عام
    window.onerror = (message, source, lineno, colno, error) => {
      // تجاهل أخطاء MetaMask
      if (isMetaMaskError(message, source, error)) {
        console.warn('Browser extension error ignored:', message)
        return true // منع عرض الخطأ
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
      const stack = reason && typeof reason === 'object' && 'stack' in reason 
        ? String(reason.stack) 
        : ''
      
      // تجاهل أخطاء MetaMask في Promises
      if (
        message.includes('MetaMask') ||
        message.includes('Failed to connect') ||
        message.includes('ethereum') ||
        message.includes('web3') ||
        message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        stack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
        stack.includes('moz-extension://')
      ) {
        console.warn('Browser extension promise rejection ignored:', message)
        event.preventDefault() // منع عرض الخطأ
        return
      }
      
      // استدعاء المعالج الأصلي للأخطاء الأخرى
      if (originalUnhandledRejection) {
        originalUnhandledRejection.call(window, event)
      }
    }

    // اعتراض أخطاء React Error Boundary
    const originalConsoleError = console.error
    console.error = (...args: any[]) => {
      const errorMessage = args.join(' ')
      if (isMetaMaskError(errorMessage)) {
        console.warn('Browser extension error ignored (console.error):', errorMessage)
        return
      }
      originalConsoleError.apply(console, args)
    }

    // تنظيف عند إلغاء التثبيت
    return () => {
      window.onerror = originalError
      window.onunhandledrejection = originalUnhandledRejection
      console.error = originalConsoleError
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

