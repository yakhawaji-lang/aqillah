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
  RotateCcw,
  Target,
  ArrowRight
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  
  const watchIdRef = useRef<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const lastAnnouncementRef = useRef<number>(0)

  // جلب بيانات المسار
  useEffect(() => {
    const loadRoute = async () => {
      setIsLoadingRoute(true)
      setRouteError(null)

      try {
        const savedRoute = localStorage.getItem('currentRoute')
        if (savedRoute) {
          try {
            const parsedRoute = JSON.parse(savedRoute)
            if (parsedRoute && parsedRoute.route && Array.isArray(parsedRoute.route) && parsedRoute.route.length > 0) {
              if (!routeId || parsedRoute.id === routeId || parsedRoute.id?.startsWith('temp-') || parsedRoute.id?.startsWith('emergency-')) {
                setRoute(parsedRoute)
                setIsLoadingRoute(false)
                return
              }
            }
          } catch (e) {
            console.error('Error parsing saved route:', e)
            localStorage.removeItem('currentRoute')
          }
        }

        if (routeId && !routeId.startsWith('temp-') && !routeId.startsWith('emergency-')) {
          try {
            const res = await axios.get(`/api/emergency-route?routeId=${routeId}`)
            if (res.data && res.data.data) {
              const routeData = res.data.data
              if (routeData.route && Array.isArray(routeData.route) && routeData.route.length > 0) {
                setRoute(routeData)
                localStorage.setItem('currentRoute', JSON.stringify(routeData))
                setIsLoadingRoute(false)
                return
              }
            }
          } catch (error: any) {
            console.error('Error fetching route:', error)
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
          if (savedRoute) {
            try {
              const parsedRoute = JSON.parse(savedRoute)
              if (parsedRoute && parsedRoute.route && Array.isArray(parsedRoute.route) && parsedRoute.route.length > 0) {
                setRoute(parsedRoute)
                setIsLoadingRoute(false)
                return
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

  const updateNavigation = (location: [number, number]) => {
    if (!route || !route.steps || route.steps.length === 0) return

    const currentStep = route.steps[currentStepIndex]
    if (!currentStep) return

    const distance = calculateDistance(location, currentStep.endLocation)
    setDistanceToNextTurn(distance)

    if (distance < 50 && currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      announceNextStep(route.steps[currentStepIndex + 1])
    }

    if (distance < 200 && Date.now() - lastAnnouncementRef.current > 5000) {
      announceApproachingTurn(currentStep, distance)
      lastAnnouncementRef.current = Date.now()
    }
  }

  const calculateDistance = (
    point1: [number, number],
    point2: [number, number]
  ): number => {
    const R = 6371e3
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

  const speak = (text: string) => {
    if (!isVoiceEnabled) return

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ar-SA'
      utterance.rate = 0.9
      utterance.pitch = 1
      utterance.volume = 1
      window.speechSynthesis.speak(utterance)
    }
  }

  const announceNextStep = (step: RouteStep) => {
    const distanceText = step.distance < 1000 
      ? `${Math.round(step.distance)} متر`
      : `${(step.distance / 1000).toFixed(1)} كيلومتر`
    const instruction = step.instruction || 'تابع المسار'
    speak(`${instruction} بعد ${distanceText}`)
  }

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

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} م`
    }
    return `${(meters / 1000).toFixed(1)} كم`
  }

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    return `${minutes} د`
  }

  useEffect(() => {
    if (route) {
      setIsLoadingRoute(false)
      setRouteError(null)
    }
  }, [route])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!route && isLoadingRoute) {
        setIsLoadingRoute(false)
        setRouteError('انتهى وقت انتظار تحميل المسار. يرجى المحاولة مرة أخرى.')
      }
    }, 10000)

    return () => clearTimeout(timer)
  }, [route, isLoadingRoute])

  if (!route && isLoadingRoute) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">جاري تحميل المسار...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!route || routeError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-white shadow-sm hover:bg-gray-50 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
          </div>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">فشل في تحميل المسار</h3>
                <p className="text-gray-600 mb-6">{routeError || 'لم يتم العثور على بيانات المسار'}</p>
                <button
                  onClick={() => router.push('/user')}
                  className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition shadow-lg"
                >
                  العودة إلى صفحة المستخدم
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentStep = route.steps?.[currentStepIndex]
  const progress = route.steps ? ((currentStepIndex + 1) / route.steps.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <div className="relative">
        {/* زر إخفاء/إظهار الشريط الجانبي */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className={`fixed top-20 z-30 ${isSidebarCollapsed ? 'right-4' : 'right-[calc(33.333%+1rem)]'} transition-all duration-300 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50`}
        >
          <ChevronRight className={`w-5 h-5 text-gray-700 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex h-[calc(100vh-64px)]">
          {/* الشريط الجانبي */}
          <div className={`${isSidebarCollapsed ? 'w-0 overflow-hidden' : 'w-full lg:w-96'} transition-all duration-300 bg-white shadow-xl overflow-y-auto`}>
            <div className="p-4 space-y-4">
              {/* زر العودة */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition mb-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">العودة</span>
              </button>

              {/* معلومات المسار - بطاقة كبيرة */}
              <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  معلومات المسار
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm opacity-90">المسافة</span>
                    </div>
                    <p className="text-2xl font-bold">{route.distance.toFixed(1)} كم</p>
                  </div>

                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm opacity-90">الوقت</span>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(route.estimatedTime)} د</p>
                  </div>
                </div>
              </div>

              {/* أزرار التحكم الرئيسية */}
              <div className="bg-white rounded-xl p-4 shadow-md">
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={toggleNavigation}
                    className={`flex-1 py-4 rounded-xl font-semibold transition-all shadow-lg transform hover:scale-105 ${
                      isNavigating
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      {isNavigating ? (
                        <>
                          <Pause className="h-5 w-5" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5" />
                          <span>بدء التوجيه</span>
                        </>
                      )}
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                    className={`p-4 rounded-xl transition-all shadow-md ${
                      isVoiceEnabled
                        ? 'bg-primary-100 text-primary-700'
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
                    className="p-4 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all shadow-md"
                    title="إعادة تعيين"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </button>
                </div>

                {/* شريط التقدم */}
                {route.steps && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span className="font-medium">التقدم</span>
                      <span className="font-bold">{currentStepIndex + 1} / {route.steps.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-primary-600 to-primary-700 h-3 rounded-full transition-all duration-500 shadow-sm"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* المسافة إلى المنعطف التالي */}
                {isNavigating && distanceToNextTurn !== null && (
                  <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-xl p-4 border-2 border-primary-200">
                    <p className="text-sm text-gray-600 mb-2 font-medium">المسافة إلى المنعطف التالي</p>
                    <p className="text-3xl font-bold text-primary-700">
                      {formatDistance(distanceToNextTurn)}
                    </p>
                  </div>
                )}
              </div>

              {/* التوجيه الحالي */}
              {currentStep && (
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-primary-200">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary-600" />
                    التوجيه الحالي
                  </h3>
                  <div className="space-y-3">
                    <p className="text-xl font-bold text-gray-900 leading-relaxed">
                      {currentStep.instruction || 'تابع المسار'}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-200">
                      <span className="flex items-center gap-1">
                        <Route className="w-4 h-4" />
                        {formatDistance(currentStep.distance)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(currentStep.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* قائمة الخطوات */}
              {route.steps && route.steps.length > 0 && (
                <div className="bg-white rounded-xl p-4 shadow-md">
                  <h3 className="font-bold text-gray-900 mb-4">خطوات المسار</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {route.steps.map((step, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-xl transition-all cursor-pointer ${
                          index === currentStepIndex
                            ? 'bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-500 shadow-md'
                            : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                        }`}
                        onClick={() => {
                          if (!isNavigating) {
                            setCurrentStepIndex(index)
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                            index === currentStepIndex
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-300 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-relaxed ${
                              index === currentStepIndex ? 'font-bold text-gray-900' : 'text-gray-700'
                            }`}>
                              {step.instruction || 'تابع المسار'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Route className="w-3 h-3" />
                                {formatDistance(step.distance)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatTime(step.duration)}
                              </span>
                            </div>
                          </div>
                          {index === currentStepIndex && (
                            <ArrowRight className="w-5 h-5 text-primary-600 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* الخريطة */}
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-white rounded-l-2xl shadow-2xl overflow-hidden">
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
              
              {/* مفتاح الألوان - تصميم محسّن */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-4 z-10 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 mb-3">مفتاح الألوان</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500 border-2 border-white shadow-sm"></div>
                    <span className="text-xs text-gray-700 font-medium">نقطة البداية</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-sm"></div>
                    <span className="text-xs text-gray-700 font-medium">موقعك الحالي</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-500 border-2 border-white shadow-sm"></div>
                    <span className="text-xs text-gray-700 font-medium">الوجهة</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-1.5 bg-blue-500 rounded-full shadow-sm"></div>
                    <span className="text-xs text-gray-700 font-medium">مسار التوجيه</span>
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
