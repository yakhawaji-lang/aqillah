'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '@/components/Header'
import GoogleTrafficMap from '@/components/GoogleTrafficMap'
import { 
  ArrowLeft, 
  Navigation, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Clock,
  Route,
  ChevronRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface RouteStep {
  instruction: string
  distance: number // meters
  duration: number // seconds
  startLocation: [number, number]
  endLocation: [number, number]
  maneuver?: string
}

interface NavigationRoute {
  id: string
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
  route: Array<[number, number]>
  distance: number // km
  estimatedTime: number // minutes
  steps?: RouteStep[]
}

export default function NavigationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const routeId = searchParams.get('routeId')
  
  const [route, setRoute] = useState<NavigationRoute | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true)
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(null)
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(true)
  const [routeError, setRouteError] = useState<string | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const lastAnnouncementRef = useRef<number>(0)

  // جلب بيانات المسار
  useEffect(() => {
    const loadRoute = async () => {
      setIsLoadingRoute(true)
      setRouteError(null)

      try {
        // أولاً: جرب جلب المسار من localStorage (للمسارات المؤقتة)
        const savedRoute = localStorage.getItem('currentRoute')
        if (savedRoute) {
          try {
            const parsedRoute = JSON.parse(savedRoute)
            
            // التحقق من صحة البيانات
            if (parsedRoute && parsedRoute.route && Array.isArray(parsedRoute.route) && parsedRoute.route.length > 0) {
              // إذا كان routeId يطابق أو كان المسار محفوظاً مؤخراً، استخدمه
              if (!routeId || parsedRoute.id === routeId || parsedRoute.id?.startsWith('temp-') || parsedRoute.id?.startsWith('emergency-')) {
                setRoute(parsedRoute)
                setIsLoadingRoute(false)
                return
              }
            } else {
              console.warn('Invalid route data in localStorage:', parsedRoute)
            }
          } catch (e) {
            console.error('Error parsing saved route:', e)
            localStorage.removeItem('currentRoute') // حذف البيانات التالفة
          }
        }

        // ثانياً: إذا كان هناك routeId ولا يبدأ بـ temp- أو emergency-، جرب جلب من API
        if (routeId && !routeId.startsWith('temp-') && !routeId.startsWith('emergency-')) {
          try {
            const res = await axios.get(`/api/emergency-route?routeId=${routeId}`)
            if (res.data && res.data.data) {
              const routeData = res.data.data
              // التحقق من صحة البيانات
              if (routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0) {
                setRoute(routeData)
                // حفظ في localStorage
                localStorage.setItem('currentRoute', JSON.stringify(routeData))
                setIsLoadingRoute(false)
                return
              } else {
                throw new Error('بيانات المسار غير صحيحة')
              }
            } else {
              throw new Error('لم يتم العثور على بيانات المسار')
            }
          } catch (error: any) {
            console.error('Error fetching route:', error)
            // إذا فشل جلب من API، جرب localStorage مرة أخرى
            if (savedRoute) {
              try {
                const parsedRoute = JSON.parse(savedRoute)
                if (parsedRoute && parsedRoute.route && Array.isArray(parsedRoute.route)) {
                  setRoute(parsedRoute)
                  setIsLoadingRoute(false)
                  return
                }
              } catch (e) {
                console.error('Error parsing saved route:', e)
              }
            }
            setRouteError(error.response?.data?.error || error.message || 'فشل في جلب بيانات المسار')
            setIsLoadingRoute(false)
          }
        } else if (routeId) {
          // إذا كان routeId مؤقت، استخدم localStorage فقط
          if (savedRoute) {
            try {
              const parsedRoute = JSON.parse(savedRoute)
              if (parsedRoute && parsedRoute.route && Array.isArray(parsedRoute.route) && parsedRoute.route.length > 0) {
                setRoute(parsedRoute)
                setIsLoadingRoute(false)
                return
              } else {
                throw new Error('بيانات المسار في localStorage غير صحيحة')
              }
            } catch (e) {
              console.error('Error parsing saved route:', e)
              setRouteError('فشل في تحميل بيانات المسار المحفوظة')
              setIsLoadingRoute(false)
            }
          } else {
            setRouteError('لم يتم العثور على بيانات المسار')
            setIsLoadingRoute(false)
          }
        } else {
          // لا يوجد routeId
          setRouteError('لم يتم تحديد مسار')
          setIsLoadingRoute(false)
        }
      } catch (error: any) {
        console.error('Unexpected error loading route:', error)
        setRouteError(error.message || 'حدث خطأ غير متوقع')
        setIsLoadingRoute(false)
      }
    }

    loadRoute()
  }, [routeId])

  // حفظ المسار في localStorage
  useEffect(() => {
    if (route) {
      localStorage.setItem('currentRoute', JSON.stringify(route))
    }
  }, [route])

  // تتبع الموقع الحالي
  useEffect(() => {
    if (!isNavigating || isPaused) return

    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setCurrentLocation(newLocation)
          updateNavigation(newLocation)
        },
        (error) => {
          console.error('Error watching position:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 1000
        }
      )
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [isNavigating, isPaused, route, currentStepIndex])

  // تحديث التوجيه بناءً على الموقع الحالي
  const updateNavigation = (location: [number, number]) => {
    if (!route || !route.steps || route.steps.length === 0) return

    const currentStep = route.steps[currentStepIndex]
    if (!currentStep) return

    // حساب المسافة إلى المنعطف التالي
    const distance = calculateDistance(
      location,
      currentStep.endLocation
    )

    setDistanceToNextTurn(distance)

    // إذا اقتربنا من المنعطف (أقل من 50 متر)
    if (distance < 50 && currentStepIndex < route.steps.length - 1) {
      // الانتقال إلى الخطوة التالية
      setCurrentStepIndex(currentStepIndex + 1)
      announceNextStep(route.steps[currentStepIndex + 1])
    }

    // إعلان التوجيهات عند الاقتراب
    if (distance < 200 && Date.now() - lastAnnouncementRef.current > 5000) {
      announceApproachingTurn(currentStep, distance)
      lastAnnouncementRef.current = Date.now()
    }
  }

  // حساب المسافة بين نقطتين (Haversine formula)
  const calculateDistance = (
    point1: [number, number],
    point2: [number, number]
  ): number => {
    const R = 6371e3 // Earth radius in meters
    const φ1 = point1[0] * Math.PI / 180
    const φ2 = point2[0] * Math.PI / 180
    const Δφ = (point2[0] - point1[0]) * Math.PI / 180
    const Δλ = (point2[1] - point1[1]) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  // التوجيه الصوتي
  const speak = (text: string) => {
    if (!isVoiceEnabled) return

    if ('speechSynthesis' in window) {
      // إلغاء أي كلام سابق
      window.speechSynthesis.cancel()
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      
      window.speechSynthesis.speak(utterance)
    }
  }

  // إعلان الخطوة التالية
  const announceNextStep = (step: RouteStep) => {
    const distanceText = step.distance < 1000 
      ? `${Math.round(step.distance)} متر`
      : `${(step.distance / 1000).toFixed(1)} كيلومتر`
    
    const instruction = step.instruction || 'تابع المسار'
    speak(`${instruction} بعد ${distanceText}`)
  }

  // إعلان الاقتراب من المنعطف
  const announceApproachingTurn = (step: RouteStep, distance: number) => {
    let distanceText = ''
    if (distance < 50) {
      distanceText = 'الآن'
    } else if (distance < 100) {
      distanceText = 'بعد 50 متر'
    } else {
      distanceText = 'بعد 100 متر'
    }

    const instruction = step.instruction || 'استدر'
    speak(`${instruction} ${distanceText}`)
  }

  // بدء/إيقاف التوجيه
  const toggleNavigation = () => {
    if (!route) {
      toast.error('لا يوجد مسار محدد')
      return
    }

    if (isNavigating) {
      setIsNavigating(false)
      setIsPaused(false)
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      window.speechSynthesis.cancel()
      toast.success('تم إيقاف التوجيه')
    } else {
      setIsNavigating(true)
      setIsPaused(false)
      
      // جلب الموقع الحالي
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCurrentLocation([
              position.coords.latitude,
              position.coords.longitude
            ])
            speak('تم بدء التوجيه. اتبع التعليمات')
          },
          (error) => {
            console.error('Error getting location:', error)
            toast.error('فشل في جلب موقعك الحالي')
          }
        )
      }
    }
  }

  // إعادة تعيين المسار
  const resetNavigation = () => {
    setCurrentStepIndex(0)
    setIsNavigating(false)
    setIsPaused(false)
    setDistanceToNextTurn(null)
    window.speechSynthesis.cancel()
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
    }
  }

  // تنسيق المسافة
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} م`
    }
    return `${(meters / 1000).toFixed(1)} كم`
  }

  // تنسيق الوقت
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} د`
  }

  // تحديث حالة التحميل
  useEffect(() => {
    if (route) {
      setIsLoadingRoute(false)
      setRouteError(null)
    }
  }, [route])

  // إضافة timeout للتحميل
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!route && isLoadingRoute) {
        setIsLoadingRoute(false)
        setRouteError('انتهى وقت انتظار تحميل المسار. يرجى المحاولة مرة أخرى.')
      }
    }, 10000) // 10 ثواني

    return () => clearTimeout(timer)
  }, [route, isLoadingRoute])

  if (!route && isLoadingRoute) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </button>
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">جاري تحميل المسار...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!route || routeError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.back()}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة
          </button>
          <div className="text-center py-12">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-red-800 font-bold mb-2">فشل في تحميل المسار</p>
              <p className="text-red-600 text-sm mb-4">{routeError || 'لم يتم العثور على بيانات المسار'}</p>
              <button
                onClick={() => {
                  router.push('/user')
                }}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                العودة إلى صفحة المستخدم
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = route.steps?.[currentStepIndex]
  const progress = route.steps ? ((currentStepIndex + 1) / route.steps.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* الشريط الجانبي */}
          <div className="lg:col-span-1 space-y-4">
            {/* معلومات المسار */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-4">معلومات المسار</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Route className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600">المسافة</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {route.distance.toFixed(1)} كم
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <span className="text-sm text-gray-600">الوقت المتوقع</span>
                  </div>
                  <span className="font-bold text-gray-900">
                    {Math.round(route.estimatedTime)} دقيقة
                  </span>
                </div>
              </div>
            </div>

            {/* أزرار التحكم */}
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={toggleNavigation}
                  className={`flex-1 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                    isNavigating
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}
                >
                  {isNavigating ? (
                    <>
                      <Pause className="h-5 w-5" />
                      إيقاف
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      بدء التوجيه
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`p-3 rounded-lg transition ${
                    isVoiceEnabled
                      ? 'bg-primary-100 text-primary-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                  title={isVoiceEnabled ? 'إيقاف الصوت' : 'تفعيل الصوت'}
                >
                  {isVoiceEnabled ? (
                    <Volume2 className="h-5 w-5" />
                  ) : (
                    <VolumeX className="h-5 w-5" />
                  )}
                </button>

                <button
                  onClick={resetNavigation}
                  className="p-3 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                  title="إعادة تعيين"
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>

              {/* شريط التقدم */}
              {route.steps && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>التقدم</span>
                    <span>{currentStepIndex + 1} / {route.steps.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* المسافة إلى المنعطف التالي */}
              {isNavigating && distanceToNextTurn !== null && (
                <div className="text-center p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">المسافة إلى المنعطف التالي</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatDistance(distanceToNextTurn)}
                  </p>
                </div>
              )}
            </div>

            {/* الخطوة الحالية */}
            {currentStep && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-3">التوجيه الحالي</h3>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">
                    {currentStep.instruction || 'تابع المسار'}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>{formatDistance(currentStep.distance)}</span>
                    <span>{formatTime(currentStep.duration)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* قائمة الخطوات */}
            {route.steps && route.steps.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm max-h-96 overflow-y-auto">
                <h3 className="font-bold text-gray-900 mb-3">خطوات المسار</h3>
                <div className="space-y-2">
                  {route.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 transition ${
                        index === currentStepIndex
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                      onClick={() => {
                        if (!isNavigating) {
                          setCurrentStepIndex(index)
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === currentStepIndex
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${
                            index === currentStepIndex ? 'font-bold text-gray-900' : 'text-gray-700'
                          }`}>
                            {step.instruction || 'تابع المسار'}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>{formatDistance(step.distance)}</span>
                            <span>{formatTime(step.duration)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* الخريطة */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl overflow-hidden shadow-lg relative" style={{ height: '600px' }}>
              <GoogleTrafficMap
                center={
                  currentLocation 
                    ? { lat: currentLocation[0], lng: currentLocation[1] }
                    : (route.route && route.route.length > 0 
                      ? { lat: route.route[0][0], lng: route.route[0][1] }
                      : { lat: route.originLat, lng: route.originLng })
                }
                zoom={isNavigating && currentLocation ? 16 : 14}
                showTrafficLayer={true}
                route={route.route}
                currentLocation={currentLocation}
                className="w-full h-full"
              />
              
              {/* مفتاح الألوان */}
              <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-10 text-sm">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white"></div>
                    <span className="text-gray-700">نقطة البداية</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white"></div>
                    <span className="text-gray-700">موقعك الحالي</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white"></div>
                    <span className="text-gray-700">الوجهة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-1 bg-blue-500"></div>
                    <span className="text-gray-700">مسار التوجيه</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

