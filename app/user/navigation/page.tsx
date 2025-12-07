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
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LocationPicker } from '@/components/LocationPicker'

interface RouteStep {
  instruction: string
  distance: number
  duration: number
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
  distance: number
  estimatedTime: number
  estimatedTimeInTraffic?: number // الوقت المتوقع مع الازدحام
  estimatedTimeWithWeather?: number // الوقت المتوقع مع الازدحام والطقس
  weatherDelay?: number // نسبة التأخير بسبب الطقس
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
  const [destination, setDestination] = useState<[number, number] | null>(null) // B: الوجهة
  const [destinationName, setDestinationName] = useState<string>('') // اسم الوجهة
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(true)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  
  const watchIdRef = useRef<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const lastAnnouncementRef = useRef<number>(0)

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

  // جلب موقع المستخدم تلقائياً عند فتح الصفحة
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ]
          setCurrentLocation(location)
          console.log('✅ User location fetched:', location)
        },
        (error) => {
          console.error('Error getting user location:', error)
          // في حالة الفشل، يمكن استخدام موقع افتراضي أو إظهار رسالة
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    }
  }, []) // يتم التنفيذ مرة واحدة عند تحميل الصفحة

  // الاستماع لتحديثات المسار من Google Maps Directions API
  useEffect(() => {
    const handleRouteUpdate = (event: CustomEvent) => {
      const routeData = event.detail
      if (route && routeData) {
        // تحديث المسافة والوقت بناءً على البيانات الفعلية من Google Maps
        setRoute({
          ...route,
          distance: routeData.distance || route.distance,
          estimatedTime: routeData.duration || route.estimatedTime,
          estimatedTimeInTraffic: routeData.durationInTraffic || route.estimatedTimeInTraffic,
          estimatedTimeWithWeather: routeData.durationWithWeather || route.estimatedTimeWithWeather,
          weatherDelay: routeData.weatherDelay || route.weatherDelay,
        })
      }
    }

    window.addEventListener('routeUpdated', handleRouteUpdate as EventListener)
    return () => {
      window.removeEventListener('routeUpdated', handleRouteUpdate as EventListener)
    }
  }, [route])

  // حساب المسار تلقائياً عند تحديد الوجهة
  useEffect(() => {
    const calculateRoute = async () => {
      if (!currentLocation || !destination) return

      setIsCalculatingRoute(true)
      try {
        const res = await axios.post('/api/emergency-route', {
          originLat: currentLocation[0], // A: موقعك الحالي
          originLng: currentLocation[1],
          destinationLat: destination[0], // B: الوجهة
          destinationLng: destination[1],
        })

        if (res.data.success && res.data.data) {
          const routeData = res.data.data
          setRoute({
            ...routeData,
            destinationLat: destination[0],
            destinationLng: destination[1],
          })
          toast.success('تم حساب المسار بنجاح')
        } else {
          toast.error('فشل في حساب المسار')
        }
      } catch (error: any) {
        console.error('Error calculating route:', error)
        toast.error(error.response?.data?.error || 'فشل في حساب المسار')
      } finally {
        setIsCalculatingRoute(false)
      }
    }

    calculateRoute()
  }, [currentLocation, destination]) // يتم التنفيذ عند تغيير الموقع الحالي أو الوجهة

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
    
    // تحسين التعليمات الصوتية
    let announcement = ''
    if (step.maneuver) {
      // استخدام maneuver من Google Directions API
      const maneuverMap: Record<string, string> = {
        'turn-left': 'استدر يساراً',
        'turn-right': 'استدر يميناً',
        'turn-sharp-left': 'استدر يساراً بشدة',
        'turn-sharp-right': 'استدر يميناً بشدة',
        'turn-slight-left': 'استدر يساراً قليلاً',
        'turn-slight-right': 'استدر يميناً قليلاً',
        'straight': 'تابع مباشرة',
        'uturn-left': 'استدر 180 درجة يساراً',
        'uturn-right': 'استدر 180 درجة يميناً',
        'ramp-left': 'اتجه يساراً على المنحدر',
        'ramp-right': 'اتجه يميناً على المنحدر',
        'merge': 'ادمج مع المرور',
        'fork-left': 'اتجه يساراً عند التقاطع',
        'fork-right': 'اتجه يميناً عند التقاطع',
      }
      announcement = maneuverMap[step.maneuver.toLowerCase()] || instruction
    } else {
      announcement = instruction
    }
    
    speak(`${announcement} بعد ${distanceText}`)
  }

  const announceApproachingTurn = (step: RouteStep, distance: number) => {
    let distanceText = ''
    if (distance < 30) {
      distanceText = 'الآن'
    } else if (distance < 50) {
      distanceText = 'بعد 30 متر'
    } else if (distance < 100) {
      distanceText = 'بعد 50 متر'
    } else if (distance < 200) {
      distanceText = 'بعد 100 متر'
    } else {
      distanceText = 'بعد 200 متر'
    }
    
    let instruction = step.instruction || 'استدر'
    if (step.maneuver) {
      const maneuverMap: Record<string, string> = {
        'turn-left': 'استدر يساراً',
        'turn-right': 'استدر يميناً',
        'turn-sharp-left': 'استدر يساراً بشدة',
        'turn-sharp-right': 'استدر يميناً بشدة',
        'turn-slight-left': 'استدر يساراً قليلاً',
        'turn-slight-right': 'استدر يميناً قليلاً',
        'straight': 'تابع مباشرة',
        'uturn-left': 'استدر 180 درجة يساراً',
        'uturn-right': 'استدر 180 درجة يميناً',
        'ramp-left': 'اتجه يساراً على المنحدر',
        'ramp-right': 'اتجه يميناً على المنحدر',
        'merge': 'ادمج مع المرور',
        'fork-left': 'اتجه يساراً عند التقاطع',
        'fork-right': 'اتجه يميناً عند التقاطع',
      }
      instruction = maneuverMap[step.maneuver.toLowerCase()] || instruction
    }
    
    speak(`${instruction} ${distanceText}`)
  }

  const updateNavigation = (location: [number, number]) => {
    if (!route || !route.steps || route.steps.length === 0) return

    const currentStep = route.steps[currentStepIndex]
    if (!currentStep) return

    const distance = calculateDistance(location, currentStep.endLocation)
    setDistanceToNextTurn(distance)

    // تحديث الخطوة الحالية عند الوصول إلى نهاية الخطوة
    if (distance < 50 && currentStepIndex < route.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      const nextStep = route.steps[currentStepIndex + 1]
      if (nextStep) {
        announceNextStep(nextStep)
      }
    }

    // إعلان اقتراب المنعطف بناءً على المسافة
    const now = Date.now()
    if (distance < 200 && now - lastAnnouncementRef.current > 5000) {
      if (distance < 30) {
        // عند الاقتراب الشديد (أقل من 30 متر)
        announceApproachingTurn(currentStep, distance)
        lastAnnouncementRef.current = now
      } else if (distance < 100 && now - lastAnnouncementRef.current > 10000) {
        // عند الاقتراب المتوسط (100 متر) - كل 10 ثواني
        announceApproachingTurn(currentStep, distance)
        lastAnnouncementRef.current = now
      } else if (distance < 200 && now - lastAnnouncementRef.current > 15000) {
        // عند الاقتراب البعيد (200 متر) - كل 15 ثانية
        announceApproachingTurn(currentStep, distance)
        lastAnnouncementRef.current = now
      }
    }
  }

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
                const startLocation: [number, number] = [
                  position.coords.latitude,
                  position.coords.longitude
                ]
                setCurrentLocation(startLocation)
                
                // إعلان بدء التوجيه مع معلومات المسار
                if (route && route.steps && route.steps.length > 0) {
                  const firstStep = route.steps[0]
                  const totalDistance = route.distance
                  const totalTime = route.estimatedTime
                  
                  speak(`تم بدء التوجيه. المسافة ${totalDistance.toFixed(1)} كيلومتر. الوقت المتوقع ${Math.round(totalTime)} دقيقة. ${firstStep.instruction || 'تابع المسار'}`)
                } else {
                  speak('تم بدء التوجيه. اتبع التعليمات')
                }
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
                onClick={() => router.push('/user')}
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
  const progress = route.steps && route.steps.length > 0 
    ? ((currentStepIndex + 1) / route.steps.length) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* زر العودة + حقل البحث عن الوجهة */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">العودة</span>
          </button>
          
          {/* حقل البحث عن الوجهة */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الوجهة (B)
            </label>
            <LocationPicker
              onLocationSelect={(location) => {
                // B: الوجهة - حفظ خط الطول والعرض
                const dest: [number, number] = [location.lat, location.lng]
                setDestination(dest)
                setDestinationName(location.name || 'موقع مختار')
                console.log('✅ Destination selected:', {
                  name: location.name,
                  lat: location.lat,
                  lng: location.lng,
                })
                toast.success(`تم تحديد الوجهة: ${location.name || 'موقع مختار'}`)
              }}
              currentLocation={currentLocation || undefined}
              placeholder="ابحث عن موقع أو اختر من الخريطة..."
            />
            {destination && (
              <div className="mt-2 text-xs text-gray-600">
                <span className="font-medium">خط الطول:</span> {destination[1].toFixed(6)}, 
                <span className="font-medium mr-2"> خط العرض:</span> {destination[0].toFixed(6)}
                {destinationName && (
                  <span className="mr-2"> - {destinationName}</span>
                )}
              </div>
            )}
            {isCalculatingRoute && (
              <div className="mt-2 flex items-center gap-2 text-sm text-primary-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                <span>جاري حساب المسار...</span>
              </div>
            )}
          </div>
        </div>

        {/* الخريطة */}
        <div className="flex-1 relative min-h-0">
          <GoogleTrafficMap
            center={
              currentLocation 
                ? { lat: currentLocation[0], lng: currentLocation[1] }
                : (route.route && route.route.length > 0 
                  ? { lat: route.route[0][0], lng: route.route[0][1] }
                  : { lat: route.originLat, lng: route.originLng })
            }
            zoom={currentLocation ? 15 : (isNavigating && currentLocation ? 16 : 14)} // تكبير الخريطة عند وجود موقع حالي
            showTrafficLayer={true}
            route={
              currentLocation && destination
                ? {
                    origin: { lat: currentLocation[0], lng: currentLocation[1] }, // A: موقعك الحالي
                    destination: { lat: destination[0], lng: destination[1] }, // B: الوجهة المحددة
                  }
                : route
                  ? {
                      origin: currentLocation 
                        ? { lat: currentLocation[0], lng: currentLocation[1] } // A: موقعك الحالي
                        : { lat: route.originLat, lng: route.originLng }, // A: نقطة البداية المحفوظة
                      destination: { lat: route.destinationLat, lng: route.destinationLng }, // B: الوجهة المحفوظة
                    }
                  : undefined
            }
            currentLocation={currentLocation}
            className="w-full h-full"
          />
        </div>

        {/* معلومات المسار - في الأسفل */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* القسم الأول: معلومات المسار */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-xl p-4 shadow-lg">
              <h3 className="font-bold text-base mb-3 flex items-center gap-2">
                <Route className="w-5 h-5" />
                معلومات المسار
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-xs font-medium">المسافة</span>
                  </div>
                  <p className="text-2xl font-bold">{route.distance.toFixed(1)}</p>
                  <p className="text-xs opacity-90">كيلومتر</p>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 border border-white/30">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">الوقت</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {Math.round(route.estimatedTimeWithWeather || route.estimatedTimeInTraffic || route.estimatedTime)}
                  </p>
                  <p className="text-xs opacity-90">
                    {route.estimatedTimeWithWeather 
                      ? `دقيقة (مع الازدحام والطقس${route.weatherDelay ? ` +${route.weatherDelay.toFixed(0)}%` : ''})`
                      : route.estimatedTimeInTraffic 
                        ? 'دقيقة (مع الازدحام)' 
                        : 'دقيقة'}
                  </p>
                </div>
              </div>
            </div>

            {/* القسم الثاني: التوجيه الحالي */}
            {currentStep && (
              <div className="bg-white rounded-lg p-4 shadow-sm border-2 border-primary-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary-600" />
                  التوجيه الحالي
                </h3>
                <div className="space-y-2">
                  <p className="text-lg font-bold text-gray-900">
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

            {/* القسم الثالث: أزرار التحكم */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div className="flex gap-2 mb-4">
                <button
                  onClick={toggleNavigation}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    isNavigating
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
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
                  className={`p-3 rounded-lg transition ${
                    isVoiceEnabled
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
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
                >
                  <RotateCcw className="h-5 w-5" />
                </button>
              </div>

              {/* شريط التقدم */}
              {route.steps && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>التقدم</span>
                    <span className="font-bold">{currentStepIndex + 1} / {route.steps.length}</span>
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
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">المسافة إلى المنعطف التالي</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatDistance(distanceToNextTurn)}
                  </p>
                </div>
              )}
            </div>

            {/* القسم الرابع: قائمة الخطوات */}
            {route.steps && route.steps.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3">خطوات المسار</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {route.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex-shrink-0 w-48 p-3 rounded-lg transition ${
                        index === currentStepIndex
                          ? 'bg-primary-50 border-2 border-primary-500'
                          : 'bg-gray-50 border-2 border-transparent hover:border-gray-200'
                      }`}
                      onClick={() => {
                        if (!isNavigating) {
                          setCurrentStepIndex(index)
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                          index === currentStepIndex
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-300 text-gray-700'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-tight ${
                            index === currentStepIndex ? 'font-bold text-gray-900' : 'text-gray-700'
                          }`}>
                            {step.instruction || 'تابع المسار'}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
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
        </div>
      </div>
    </div>
  )
}
