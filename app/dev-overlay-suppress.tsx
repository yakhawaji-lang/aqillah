/**
 * ملف لإخفاء overlay الأخطاء في وضع التطوير لأخطاء MetaMask
 * يتم استيراده في app/layout.tsx
 */

'use client'

import { useEffect } from 'react'

export function DevOverlaySuppress() {
  useEffect(() => {
    // إخفاء overlay الأخطاء لأخطاء MetaMask في وضع التطوير
    if (process.env.NODE_ENV === 'development') {
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
          messageStr.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
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
      
      // اعتراض الأخطاء قبل أن تصل إلى Next.js overlay
      window.onerror = (message, source, lineno, colno, error) => {
        if (isMetaMaskError(message, source, error)) {
          console.warn('MetaMask error suppressed:', message)
          // إخفاء overlay عن طريق إرجاع true
          return true
        }
        if (originalError) {
          return originalError(message, source, lineno, colno, error)
        }
        return false
      }
      
      // اعتراض Promise rejections
      window.onunhandledrejection = (event: PromiseRejectionEvent) => {
        const reason = event.reason
        const message = typeof reason === 'string' ? reason : reason?.message || ''
        const stack = reason && typeof reason === 'object' && 'stack' in reason 
          ? String(reason.stack) 
          : ''
        
        if (
          message.includes('MetaMask') ||
          message.includes('Failed to connect') ||
          message.includes('ethereum') ||
          message.includes('web3') ||
          message.includes('nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          stack.includes('chrome-extension://nkbihfbeogaeaoehlefnkodbefgpgknn') ||
          stack.includes('moz-extension://')
        ) {
          console.warn('MetaMask promise rejection suppressed:', message)
          event.preventDefault()
          return
        }
        
        if (originalUnhandledRejection) {
          originalUnhandledRejection(event)
        }
      }
      
      return () => {
        window.onerror = originalError
        window.onunhandledrejection = originalUnhandledRejection
      }
    }
  }, [])
  
  return null
}


