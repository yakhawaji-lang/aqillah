'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  watch?: boolean // استخدام watchPosition بدلاً من getCurrentPosition
}

interface UseGeolocationReturn {
  location: [number, number] | null
  accuracy: number | null
  loading: boolean
  error: GeolocationPositionError | null
  refresh: () => void
  stopWatching: () => void
}

const STORAGE_KEY = 'aqillah_last_location'
const DEFAULT_TIMEOUT = 20000 // 20 ثانية
const DEFAULT_MAX_AGE = 60000 // دقيقة واحدة

// جلب آخر موقع محفوظ
function getLastKnownLocation(): [number, number] | null {
  if (typeof window === 'undefined') return null
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      const age = Date.now() - parsed.timestamp
      // استخدام آخر موقع إذا كان عمره أقل من 5 دقائق
      if (age < 5 * 60 * 1000) {
        return parsed.location
      }
    }
  } catch (error) {
    console.error('Error reading last known location:', error)
  }
  
  return null
}

// حفظ الموقع
function saveLocation(location: [number, number]) {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      location,
      timestamp: Date.now(),
    }))
  } catch (error) {
    console.error('Error saving location:', error)
  }
}

export function useGeolocation(options: GeolocationOptions = {}): UseGeolocationReturn {
  const {
    enableHighAccuracy = true,
    timeout = DEFAULT_TIMEOUT,
    maximumAge = DEFAULT_MAX_AGE,
    watch = false,
  } = options

  const [location, setLocation] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<GeolocationPositionError | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const hasRequestedRef = useRef(false)
  const optionsRef = useRef({ enableHighAccuracy, timeout, maximumAge, watch })
  const lastUpdateTimeRef = useRef<number>(0) // لتتبع آخر تحديث لتقليل التحديثات المتكررة

  // تحديث optionsRef عند تغيير الخيارات
  useEffect(() => {
    optionsRef.current = { enableHighAccuracy, timeout, maximumAge, watch }
  }, [enableHighAccuracy, timeout, maximumAge, watch])

  // معالج نجاح تحديد الموقع
  const handleSuccess = useCallback((position: GeolocationPosition) => {
    const loc: [number, number] = [
      position.coords.latitude,
      position.coords.longitude,
    ]
    
    // Throttling: تقليل التحديثات المتكررة عند استخدام watch
    const now = Date.now()
    if (optionsRef.current.watch && now - lastUpdateTimeRef.current < 5000) {
      // تجاهل التحديث إذا كان آخر تحديث قبل أقل من 5 ثواني
      console.log('📍 Location update throttled (too frequent)')
      return
    }
    
    // التحقق من أن الموقع تغير بشكل كبير قبل التحديث (لتقليل التحديثات المتكررة عند watch)
    const lastLocation = getLastKnownLocation()
    if (lastLocation && optionsRef.current.watch) {
      const distance = Math.sqrt(
        Math.pow(loc[0] - lastLocation[0], 2) + Math.pow(loc[1] - lastLocation[1], 2)
      )
      // إذا كان التغيير أقل من 0.0001 درجة (حوالي 10 أمتار)، تجاهل التحديث
      if (distance < 0.0001) {
        console.log('📍 Location change too small, ignoring update')
        return
      }
    }
    
    lastUpdateTimeRef.current = now
    setLocation(loc)
    setAccuracy(position.coords.accuracy)
    setLoading(false)
    setError(null)
    saveLocation(loc)
    
    console.log('✅ Location fetched:', {
      lat: loc[0],
      lng: loc[1],
      accuracy: position.coords.accuracy,
      source: 'navigator.geolocation',
    })
    
    if (!hasRequestedRef.current) {
      toast.success('تم تحديد موقعك بنجاح', { duration: 2000 })
      hasRequestedRef.current = true
    }
  }, [])

  // معالج فشل تحديد الموقع مع إعادة محاولة محسّنة
  const retryCountRef = useRef(0)
  const MAX_RETRIES = 3
  
  const handleError = useCallback((err: GeolocationPositionError) => {
    console.error('❌ Geolocation error:', err)
    
    // محاولة استخدام آخر موقع معروف أولاً
    const lastKnown = getLastKnownLocation()
    if (lastKnown && retryCountRef.current === 0) {
      console.log('📍 Using last known location:', lastKnown)
      setLocation(lastKnown)
      setLoading(false)
      setError(null)
      toast('استخدام آخر موقع معروف', { 
        icon: '📍',
        duration: 3000,
      })
    }
    
    // عرض رسالة خطأ مناسبة
    let errorMessage = 'فشل في تحديد موقعك'
    let shouldRetry = false
    
    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'تم رفض الإذن لتحديد الموقع. يرجى السماح بالوصول إلى موقعك من إعدادات المتصفح.'
        break
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'معلومات الموقع غير متاحة. تأكد من تفعيل GPS.'
        shouldRetry = retryCountRef.current < MAX_RETRIES
        break
      case err.TIMEOUT:
        errorMessage = 'انتهت مهلة طلب الموقع'
        shouldRetry = retryCountRef.current < MAX_RETRIES
        break
    }
    
    // إعادة المحاولة إذا كان ذلك مناسباً
    if (shouldRetry && retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current++
      const retryDelay = retryCountRef.current * 2000 // 2s, 4s, 6s
      
      console.log(`🔄 Retrying location (attempt ${retryCountRef.current}/${MAX_RETRIES}) in ${retryDelay}ms...`)
      
      setTimeout(() => {
        if (navigator.geolocation) {
          const opts = optionsRef.current
          // زيادة timeout في كل محاولة
          const retryOptions = {
            ...opts,
            timeout: opts.timeout + (retryCountRef.current * 5000),
            enableHighAccuracy: retryCountRef.current < 2 ? opts.enableHighAccuracy : false, // تعطيل high accuracy في المحاولات الأخيرة
          }
          
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              retryCountRef.current = 0 // إعادة تعيين عند النجاح
              handleSuccess(pos)
            },
            handleError,
            retryOptions
          )
        }
      }, retryDelay)
      
      if (retryCountRef.current === 1) {
        toast('جاري إعادة المحاولة...', { 
          icon: '🔄',
          duration: 2000,
        })
      }
      return
    }
    
    // إذا فشلت جميع المحاولات
    setError(err)
    setLoading(false)
    retryCountRef.current = 0 // إعادة تعيين للجلسة التالية
    
    if (!hasRequestedRef.current || retryCountRef.current === 0) {
      toast.error(errorMessage, { duration: 4000 })
      hasRequestedRef.current = true
    }
  }, [handleSuccess])

  // إيقاف مراقبة الموقع
  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // جلب الموقع
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported')
      setError({
        code: 0,
        message: 'Geolocation not supported',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      } as GeolocationPositionError)
      setLoading(false)
      
      // استخدام آخر موقع معروف
      const lastKnown = getLastKnownLocation()
      if (lastKnown) {
        setLocation(lastKnown)
      }
      return
    }

    setLoading(true)
    
    const opts = optionsRef.current
    const options: PositionOptions = {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    }

    if (opts.watch) {
      // استخدام watchPosition لتحديث الموقع بشكل مستمر
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        options
      )
    } else {
      // استخدام getCurrentPosition لطلب الموقع مرة واحدة
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      )
    }
  }, [handleSuccess, handleError])

  // تحديث الموقع يدوياً
  const refresh = useCallback(() => {
    hasRequestedRef.current = false
    retryCountRef.current = 0 // إعادة تعيين عداد المحاولات
    stopWatching() // إيقاف أي مراقبة سابقة
    getLocation()
  }, [getLocation, stopWatching])

  // جلب الموقع عند تحميل المكون
  useEffect(() => {
    console.log('📍 useGeolocation: Initializing location request...')
    
    // محاولة استخدام آخر موقع معروف أولاً
    const lastKnown = getLastKnownLocation()
    if (lastKnown) {
      setLocation(lastKnown)
      setLoading(false)
      console.log('📍 Using cached location:', lastKnown)
    }

    // طلب الموقع الجديد مباشرة
    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported')
      setLoading(false)
      return
    }

    setLoading(true)
    
    const opts = optionsRef.current
    const options: PositionOptions = {
      enableHighAccuracy: opts.enableHighAccuracy,
      timeout: opts.timeout,
      maximumAge: opts.maximumAge,
    }

    if (opts.watch) {
      console.log('📍 Starting watchPosition...')
      // استخدام watchPosition لتحديث الموقع بشكل مستمر
      // زيادة maximumAge لتقليل التحديثات المتكررة
      const watchOptions = {
        ...options,
        maximumAge: Math.max(options.maximumAge || 60000, 10000), // على الأقل 10 ثواني بين التحديثات
      }
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        watchOptions
      )
    } else {
      console.log('📍 Requesting getCurrentPosition...')
      // استخدام getCurrentPosition لطلب الموقع مرة واحدة
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        options
      )
    }

    return () => {
      console.log('📍 useGeolocation: Cleaning up...')
      stopWatching()
    }
  }, []) // يتم التنفيذ مرة واحدة فقط عند التحميل

  return {
    location,
    accuracy,
    loading,
    error,
    refresh,
    stopWatching,
  }
}
