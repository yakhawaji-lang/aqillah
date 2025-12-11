'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
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
  RotateCcw,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Cloud,
  Droplets,
  Eye,
  Wind,
  Thermometer,
  TrendingUp
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { LocationPicker } from '@/components/LocationPicker'
import { useGeolocation } from '@/lib/hooks/useGeolocation'
import { Alert } from '@/types'

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
  const [destination, setDestination] = useState<[number, number] | null>(null) // B: الوجهة
  const [destinationName, setDestinationName] = useState<string>('') // اسم الوجهة
  const [isDemoMode, setIsDemoMode] = useState(true) // وضع الديمو مفعل افتراضياً
  const [trafficDetails, setTrafficDetails] = useState<any[]>([]) // تفاصيل الحركة المرورية
  const [weatherData, setWeatherData] = useState<any>(null) // بيانات الطقس
  
  // جلب موقع المستخدم تلقائياً مع تحسينات
  const { location: currentLocation, loading: locationLoading, refresh: refreshLocation } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 20000, // 20 ثانية
    maximumAge: 30000, // 30 ثانية
    watch: true, // مراقبة الموقع بشكل مستمر أثناء التنقل
  })
  const [distanceToNextTurn, setDistanceToNextTurn] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [isLoadingRoute, setIsLoadingRoute] = useState(true)
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false)
  const [routeError, setRouteError] = useState<string | null>(null)
  const [showAlerts, setShowAlerts] = useState(true)
  
  const watchIdRef = useRef<number | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null)
  const lastAnnouncementRef = useRef<number>(0)

  // إنشاء بيانات ديمو وهمية واقعية
  const generateDemoData = useMemo(() => {
    // مسار وهمي في الرياض
    const demoRoute: NavigationRoute = {
      id: 'demo-navigation-riyadh',
      originLat: 24.7136,
      originLng: 46.6753,
      destinationLat: 24.7500,
      destinationLng: 46.7000,
      route: [
        [24.7136, 46.6753],
        [24.7200, 46.6800],
        [24.7300, 46.6850],
        [24.7400, 46.6900],
        [24.7500, 46.7000],
      ],
      distance: 5.3,
      estimatedTime: 8,
      estimatedTimeInTraffic: 12,
      weatherDelay: 3,
      estimatedTimeWithWeather: 15,
      steps: [
        {
          instruction: 'اتجه شمالاً على طريق الملك فهد',
          distance: 1200,
          duration: 120,
          startLocation: [24.7136, 46.6753],
          endLocation: [24.7200, 46.6800],
          maneuver: 'straight',
        },
        {
          instruction: 'استدر يميناً على طريق الدائري الشمالي',
          distance: 1500,
          duration: 180,
          startLocation: [24.7200, 46.6800],
          endLocation: [24.7300, 46.6850],
          maneuver: 'turn-right',
        },
        {
          instruction: 'تابع مباشرة على طريق العليا',
          distance: 1800,
          duration: 200,
          startLocation: [24.7300, 46.6850],
          endLocation: [24.7400, 46.6900],
          maneuver: 'straight',
        },
        {
          instruction: 'وصلت إلى وجهتك',
          distance: 800,
          duration: 90,
          startLocation: [24.7400, 46.6900],
          endLocation: [24.7500, 46.7000],
          maneuver: 'straight',
        },
      ],
    }
    
    // تفاصيل الحركة المرورية الوهمية على طول المسار
    const demoTrafficDetails = [
      {
        position: 0.1, // 10% من المسار
        lat: 24.7180,
        lng: 46.6775,
        roadName: 'طريق الملك فهد',
        congestionIndex: 65,
        avgSpeed: 45,
        vehicleCount: 120,
        delayMinutes: 3,
        reason: 'ازدحام بسبب وقت الذروة الصباحية',
        incidents: ['حركة كثيفة', 'إشارة مرورية بطيئة'],
      },
      {
        position: 0.35,
        lat: 24.7250,
        lng: 46.6825,
        roadName: 'طريق الدائري الشمالي',
        congestionIndex: 80,
        avgSpeed: 30,
        vehicleCount: 180,
        delayMinutes: 8,
        reason: 'ازدحام شديد بسبب أعمال صيانة',
        incidents: ['أعمال صيانة على الطريق', 'حركة شاحنات', 'إغلاق مسار واحد'],
      },
      {
        position: 0.65,
        lat: 24.7350,
        lng: 46.6875,
        roadName: 'طريق العليا',
        congestionIndex: 55,
        avgSpeed: 50,
        vehicleCount: 95,
        delayMinutes: 2,
        reason: 'ازدحام متوسط - حركة عادية',
        incidents: ['حركة عادية'],
      },
    ]
    
    // بيانات الطقس الوهمية (أمطار وضباب)
    const demoWeather = {
      condition: 'rain', // 'rain' أو 'fog'
      temperature: 18,
      humidity: 85,
      windSpeed: 25,
      windDirection: 180,
      visibility: 1200, // متر (منخفض بسبب المطر/الضباب)
      pressure: 1008,
      precipitation: 4.5, // مم/ساعة
      precipitationProbability: 75, // نسبة هطول الأمطار
      rainRate: 4.5,
      cloudCover: 90,
      alerts: [
        {
          type: 'rain',
          severity: 'high',
          message: 'أمطار غزيرة متوقعة - انتبه للقيادة',
          advice: 'قلل السرعة، استخدم المساحات، حافظ على مسافة آمنة',
        },
        {
          type: 'fog',
          severity: 'medium',
          message: 'ضباب جزئي - رؤية منخفضة',
          advice: 'استخدم الأضواء الأمامية، قلل السرعة',
        },
      ],
      hourlyForecast: [
        { time: 'الآن', condition: 'rain', precipitation: 4.5, visibility: 1200, temperature: 18 },
        { time: '+1 ساعة', condition: 'rain', precipitation: 3.2, visibility: 1500, temperature: 17 },
        { time: '+2 ساعة', condition: 'fog', precipitation: 0.5, visibility: 800, temperature: 16 },
        { time: '+3 ساعة', condition: 'fog', precipitation: 0, visibility: 600, temperature: 15 },
      ],
    }
    
    return { demoRoute, demoTrafficDetails, demoWeather }
  }, [])
  
  useEffect(() => {
    const loadRoute = async () => {
      setIsLoadingRoute(true)
      setRouteError(null)

      // إذا كان وضع الديمو مفعل، استخدم البيانات الوهمية
      if (isDemoMode) {
        setRoute(generateDemoData.demoRoute)
        setTrafficDetails(generateDemoData.demoTrafficDetails)
        setWeatherData(generateDemoData.demoWeather)
        setDestination([24.7500, 46.7000])
        setDestinationName('شمال الرياض')
        setIsLoadingRoute(false)
        return
      }

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
  }, [routeId, isDemoMode, generateDemoData])

  useEffect(() => {
    if (route) {
      localStorage.setItem('currentRoute', JSON.stringify(route))
    }
  }, [route])

  // تحديث الموقع عند تغييره من useGeolocation
  useEffect(() => {
    if (currentLocation) {
      console.log('✅ Current location updated:', {
        lat: currentLocation[0],
        lng: currentLocation[1],
      })
      
      // تحديث التنقل إذا كان نشطاً
      if (isNavigating && route) {
        updateNavigation(currentLocation)
      }
    }
  }, [currentLocation, isNavigating, route])

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
      // التأكد من وجود الموقع الحالي والوجهة
      if (!currentLocation || !destination) {
        console.log('⏳ Waiting for location data:', {
          hasCurrentLocation: !!currentLocation,
          hasDestination: !!destination,
          currentLocation: currentLocation,
          destination: destination,
        })
        return
      }
      
      // التحقق من صحة الإحداثيات
      if (isNaN(currentLocation[0]) || isNaN(currentLocation[1]) || 
          isNaN(destination[0]) || isNaN(destination[1])) {
        console.error('❌ Invalid coordinates:', {
          currentLocation,
          destination,
        })
        toast.error('إحداثيات غير صحيحة')
        return
      }
      
      // تجنب إعادة الحساب إذا كان المسار موجود بالفعل ونفس الوجهة
      if (route && route.destinationLat === destination[0] && route.destinationLng === destination[1]) {
        console.log('⏭️ Route already calculated for this destination')
        return
      }

      console.log('🚀 Calculating route:', {
        origin: {
          lat: currentLocation[0],
          lng: currentLocation[1],
          formatted: `${currentLocation[0]}, ${currentLocation[1]}`,
        },
        destination: {
          lat: destination[0],
          lng: destination[1],
          formatted: `${destination[0]}, ${destination[1]}`,
        },
      })

      setIsCalculatingRoute(true)
      try {
        const res = await axios.post('/api/emergency-route', {
          originLat: currentLocation[0], // A: موقعك الحالي (خط العرض)
          originLng: currentLocation[1], // A: موقعك الحالي (خط الطول)
          destinationLat: destination[0], // B: الوجهة (خط العرض)
          destinationLng: destination[1], // B: الوجهة (خط الطول)
        })

        if (res.data.success && res.data.data) {
          const routeData = res.data.data
          setRoute({
            ...routeData,
            destinationLat: destination[0],
            destinationLng: destination[1],
          })
          console.log('✅ Route calculated successfully:', {
            distance: routeData.distance,
            estimatedTime: routeData.estimatedTime,
          })
          toast.success('تم حساب المسار بنجاح')
        } else {
          console.error('❌ Route calculation failed:', res.data)
          toast.error('فشل في حساب المسار')
        }
      } catch (error: any) {
        console.error('❌ Error calculating route:', error)
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        })
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

  // حساب المسافة من نقطة إلى أقرب نقطة على المسار
  const distanceToRoute = (
    point: [number, number],
    route: Array<[number, number]>
  ): number => {
    if (!route || route.length === 0) return Infinity
    
    let minDistance = Infinity
    for (let i = 0; i < route.length - 1; i++) {
      const segmentStart = route[i]
      const segmentEnd = route[i + 1]
      
      // حساب المسافة من النقطة إلى القطعة المستقيمة
      const distance = pointToLineDistance(point, segmentStart, segmentEnd)
      minDistance = Math.min(minDistance, distance)
    }
    
    return minDistance
  }

  // حساب المسافة من نقطة إلى قطعة مستقيمة
  const pointToLineDistance = (
    point: [number, number],
    lineStart: [number, number],
    lineEnd: [number, number]
  ): number => {
    const A = point[0] - lineStart[0]
    const B = point[1] - lineStart[1]
    const C = lineEnd[0] - lineStart[0]
    const D = lineEnd[1] - lineStart[1]

    const dot = A * C + B * D
    const lenSq = C * C + D * D
    let param = -1
    if (lenSq !== 0) param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = lineStart[0]
      yy = lineStart[1]
    } else if (param > 1) {
      xx = lineEnd[0]
      yy = lineEnd[1]
    } else {
      xx = lineStart[0] + param * C
      yy = lineStart[1] + param * D
    }

    const dx = point[0] - xx
    const dy = point[1] - yy
    return Math.sqrt(dx * dx + dy * dy) * 111000 // تحويل إلى متر تقريباً
  }

  // جلب التنبيهات المرتبطة بالمسار + إضافة تنبيهات وهمية واقعية في الرياض
  const { data: allAlerts } = useQuery({
    queryKey: ['route-alerts', route?.id],
    queryFn: async () => {
      if (!route) return []
      
      try {
        // جلب جميع التنبيهات النشطة
        const res = await axios.get('/api/alerts?activeOnly=true&city=الرياض')
        const apiAlerts = res.data.data || []
        
        // إضافة تنبيهات وهمية واقعية في الرياض على المسار
        const mockAlerts = [
          {
            id: 'mock-congestion-1',
            segmentId: null,
            roadName: 'طريق الملك فهد',
            city: 'الرياض',
            direction: 'شمال',
            type: 'congestion',
            severity: 'high',
            message: 'ازدحام مروري شديد على طريق الملك فهد. تأخير متوقع: 15 دقيقة',
            location: { lat: 24.7200, lng: 46.6800 },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            isActive: true,
            congestionIndex: 75,
            delayMinutes: 15,
          },
          {
            id: 'mock-accident-1',
            segmentId: null,
            roadName: 'طريق الدائري الشرقي',
            city: 'الرياض',
            direction: 'شرق',
            type: 'accident',
            severity: 'critical',
            message: 'أمامك حادث مروري على طريق الدائري الشرقي - استخدم مساراً بديلاً',
            location: { lat: 24.7100, lng: 46.7000 },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            alternativeRoute: {
              distance: 8.5,
              duration: 20,
              waypoints: [
                { lat: 24.7150, lng: 46.6900 },
                { lat: 24.7250, lng: 46.7100 },
              ],
            },
          },
        ]
        
        return [...apiAlerts, ...mockAlerts]
      } catch (error) {
        console.error('Error fetching alerts:', error)
        // إرجاع تنبيهات وهمية في حالة الخطأ
        return [
          {
            id: 'mock-congestion-1',
            segmentId: null,
            roadName: 'طريق الملك فهد',
            city: 'الرياض',
            direction: 'شمال',
            type: 'congestion',
            severity: 'high',
            message: 'ازدحام مروري شديد على طريق الملك فهد. تأخير متوقع: 15 دقيقة',
            location: { lat: 24.7200, lng: 46.6800 },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            isActive: true,
            congestionIndex: 75,
            delayMinutes: 15,
          },
          {
            id: 'mock-accident-1',
            segmentId: null,
            roadName: 'طريق الدائري الشرقي',
            city: 'الرياض',
            direction: 'شرق',
            type: 'accident',
            severity: 'critical',
            message: 'أمامك حادث مروري على طريق الدائري الشرقي - استخدم مساراً بديلاً',
            location: { lat: 24.7100, lng: 46.7000 },
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            alternativeRoute: {
              distance: 8.5,
              duration: 20,
              waypoints: [
                { lat: 24.7150, lng: 46.6900 },
                { lat: 24.7250, lng: 46.7100 },
              ],
            },
          },
        ]
      }
    },
    enabled: !!route,
    refetchInterval: 60000, // تحديث كل دقيقة
  })
  
  // حالة لإظهار التنبيهات بالتسلسل
  const [shownAlerts, setShownAlerts] = useState<Set<string>>(new Set())
  const [currentAlertIndex, setCurrentAlertIndex] = useState(0)
  
  // إظهار التنبيهات بالتسلسل عند بدء التوجيه
  useEffect(() => {
    if (!isNavigating || !routeAlerts || routeAlerts.length === 0) return
    
    // إظهار أول تنبيه (ازدحام) فوراً
    if (routeAlerts.length > 0 && currentAlertIndex === 0) {
      const firstAlert = routeAlerts[0]
      if (firstAlert.type === 'congestion' && !shownAlerts.has(firstAlert.id)) {
        setShownAlerts(new Set([firstAlert.id]))
        setCurrentAlertIndex(1)
        
        // تشغيل صوت تنبيه
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.value = 600
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
        
        // إعلان صوتي
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(firstAlert.message)
          utterance.lang = 'ar-SA'
          utterance.rate = 0.9
          window.speechSynthesis.speak(utterance)
        }
      }
    }
    
    // إظهار ثاني تنبيه (حادث) بعد 3 ثواني
    if (routeAlerts.length > 1 && currentAlertIndex === 1) {
      const timer = setTimeout(() => {
        const secondAlert = routeAlerts.find((a: any) => a.type === 'accident')
        if (secondAlert && !shownAlerts.has(secondAlert.id)) {
          setShownAlerts(new Set([...Array.from(shownAlerts), secondAlert.id]))
          setCurrentAlertIndex(2)
          
          // تشغيل صوت تنبيه حرج
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = 1000 // صوت أعلى للتنبيهات الحرجة
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.5, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.5)
          
          // إعلان صوتي
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(secondAlert.message)
            utterance.lang = 'ar-SA'
            utterance.rate = 0.9
            utterance.pitch = 1.2
            window.speechSynthesis.speak(utterance)
          }
        }
      }, 3000) // 3 ثواني
      
      return () => clearTimeout(timer)
    }
  }, [isNavigating, routeAlerts, currentAlertIndex, shownAlerts])

  // تصفية وترتيب التنبيهات حسب المسار
  const routeAlerts = useMemo(() => {
    if (!route || !route.route || !allAlerts || allAlerts.length === 0) return []

    const MAX_DISTANCE_FROM_ROUTE = 500 // متر - التنبيهات ضمن 500 متر من المسار

    // تصفية التنبيهات القريبة من المسار
    const nearbyAlerts = allAlerts
      .map((alert: Alert) => {
        // استخراج الإحداثيات من التنبيه
        let alertLat: number | null = null
        let alertLng: number | null = null

        // محاولة استخراج الإحداثيات من التنبيه
        const alertAny = alert as any
        if (alertAny.location) {
          alertLat = alertAny.location.lat || alertAny.location[0]
          alertLng = alertAny.location.lng || alertAny.location[1]
        } else if (alertAny.lat && alertAny.lng) {
          alertLat = alertAny.lat
          alertLng = alertAny.lng
        } else if (alertAny.segmentId) {
          // محاولة الحصول على الإحداثيات من segmentId إذا كان متوفراً
          // في هذه الحالة سنستخدم إحداثيات تقريبية من المدينة
          const cityCoords: Record<string, { lat: number; lng: number }> = {
            'الرياض': { lat: 24.7136, lng: 46.6753 },
            'جدة': { lat: 21.4858, lng: 39.1925 },
            'الدمام': { lat: 26.4207, lng: 50.0888 },
            'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
            'الخبر': { lat: 26.2794, lng: 50.2080 },
            'أبها': { lat: 18.2164, lng: 42.5042 },
            'خميس مشيط': { lat: 18.3000, lng: 42.7333 },
          }
          const coords = cityCoords[(alert as any).city || 'الرياض']
          if (coords) {
            alertLat = coords.lat
            alertLng = coords.lng
          }
        }

        if (!alertLat || !alertLng) return null

        const alertPoint: [number, number] = [alertLat, alertLng]
        const distance = distanceToRoute(alertPoint, route.route)

        if (distance <= MAX_DISTANCE_FROM_ROUTE) {
          // حساب موضع التنبيه على المسار (نسبة المسافة من البداية)
          let routePosition = 0
          let cumulativeDistance = 0
          let totalDistance = 0

          // حساب المسافة الإجمالية للمسار
          for (let i = 0; i < route.route.length - 1; i++) {
            totalDistance += calculateDistance(route.route[i], route.route[i + 1])
          }

          // إيجاد أقرب نقطة على المسار
          let minDistToRoute = Infinity
          let closestIndex = 0
          for (let i = 0; i < route.route.length - 1; i++) {
            const dist = pointToLineDistance(alertPoint, route.route[i], route.route[i + 1])
            if (dist < minDistToRoute) {
              minDistToRoute = dist
              closestIndex = i
            }
          }

          // حساب المسافة المتراكمة حتى أقرب نقطة
          for (let i = 0; i < closestIndex; i++) {
            cumulativeDistance += calculateDistance(route.route[i], route.route[i + 1])
          }

          routePosition = totalDistance > 0 ? cumulativeDistance / totalDistance : 0

          return {
            ...alert,
            distanceFromRoute: distance,
            routePosition, // 0 = البداية، 1 = النهاية
            routeDistance: cumulativeDistance, // المسافة من البداية
          }
        }

        return null
      })
      .filter((alert: any): alert is Alert & { distanceFromRoute: number; routePosition: number; routeDistance: number } => alert !== null)

    // ترتيب التنبيهات حسب موضعها على المسار (من البداية إلى النهاية)   
    return nearbyAlerts.sort((a: any, b: any) => a.routePosition - b.routePosition)
  }, [route, allAlerts])

  // حساب المسافة المتبقية حتى التنبيه التالي
  const nextAlertDistance = useMemo(() => {
    if (!route || !routeAlerts || routeAlerts.length === 0 || !currentLocation) return null

    const currentRoutePosition = route.route.findIndex((point, index) => {
      if (index === route.route.length - 1) return false
      const dist = calculateDistance(currentLocation, point)
      return dist < 100 // ضمن 100 متر
    })

    if (currentRoutePosition === -1) return null

    // إيجاد التنبيه التالي بعد الموقع الحالي
    let currentRouteDistance = 0
    for (let i = 0; i < currentRoutePosition; i++) {
      currentRouteDistance += calculateDistance(route.route[i], route.route[i + 1])
    }

    const nextAlert = routeAlerts.find((alert: any) => alert.routeDistance > currentRouteDistance)
    if (!nextAlert) return null

    return nextAlert.routeDistance - currentRouteDistance
  }, [route, routeAlerts, currentLocation])

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

    // useGeolocation يتولى مراقبة الموقع تلقائياً
    // لا حاجة لـ watchPosition منفصل
  }, [isNavigating, isPaused, route, currentStepIndex])
  
  // تحديث الموقع من useGeolocation أثناء التنقل
  useEffect(() => {
    if (isNavigating && !isPaused && currentLocation && route) {
      updateNavigation(currentLocation)
    }
  }, [currentLocation, isNavigating, isPaused, route])

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
      
      // استخدام الموقع الحالي من useGeolocation
      if (currentLocation && currentLocation.length === 2) {
        console.log('✅ Starting navigation with current location:', {
          lat: currentLocation[0],
          lng: currentLocation[1],
          formatted: `${currentLocation[0]}, ${currentLocation[1]}`,
        })
        
        // إعلان بدء التوجيه مع معلومات المسار
        if (route && route.steps && route.steps.length > 0) {
          const firstStep = route.steps[0]
          const totalDistance = route.distance
          const totalTime = route.estimatedTime
          
          speak(`تم بدء التوجيه. المسافة ${totalDistance.toFixed(1)} كيلومتر. الوقت المتوقع ${Math.round(totalTime)} دقيقة. ${firstStep.instruction || 'تابع المسار'}`)
        } else {
          speak('تم بدء التوجيه. اتبع التعليمات')
        }
      } else {
        // إذا لم يكن هناك موقع، نطلبه
        refreshLocation()
        toast('جاري تحديد موقعك...', { icon: '📍' })
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
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/user')}
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
        <div className="container mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/user')}
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
      <div className="flex flex-col h-screen">
        {/* زر العودة */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/user')}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">العودة</span>
            </button>
            {isDemoMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">
                <span>وضع الديمو</span>
                <button
                  onClick={() => setIsDemoMode(false)}
                  className="text-xs underline hover:text-blue-900"
                >
                  تعطيل
                </button>
              </div>
            )}
          </div>
        </div>

        {/* زر استخدام الموقع الحالي */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <button
            onClick={() => {
              refreshLocation()
              toast('جاري تحديد موقعك...', { icon: '📍' })
            }}
            disabled={locationLoading}
            className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-md"
          >
            {locationLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>جاري تحديد الموقع...</span>
              </>
            ) : (
              <>
                <Navigation className="h-5 w-5" />
                <span>استخدام الموقع الحالي</span>
              </>
            )}
          </button>
        </div>

        {/* حقل البحث عن الوجهة */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            الوجهة (B)
          </label>
          <LocationPicker
            onLocationSelect={(location) => {
              console.log('📍 Location selected from LocationPicker:', {
                name: location.name,
                lat: location.lat,
                lng: location.lng,
                formatted: `${location.lat}, ${location.lng}`,
              })
              
              // التحقق من أن الإحداثيات صحيحة
              if (!location.lat || !location.lng || isNaN(location.lat) || isNaN(location.lng)) {
                toast.error('إحداثيات غير صحيحة')
                console.error('❌ Invalid coordinates:', location)
                return
              }
              
              // التحقق من أن الإحداثيات مختلفة عن موقعك الحالي
              if (currentLocation && 
                  Math.abs(currentLocation[0] - location.lat) < 0.0001 && 
                  Math.abs(currentLocation[1] - location.lng) < 0.0001) {
                toast.error('الوجهة يجب أن تكون مختلفة عن موقعك الحالي')
                console.error('❌ Destination same as current location:', {
                  current: {
                    lat: currentLocation[0],
                    lng: currentLocation[1],
                    formatted: `${currentLocation[0]}, ${currentLocation[1]}`,
                  },
                  destination: {
                    lat: location.lat,
                    lng: location.lng,
                    formatted: `${location.lat}, ${location.lng}`,
                  },
                })
                return
              }
              
              // B: الوجهة - حفظ خط الطول والعرض
              const dest: [number, number] = [location.lat, location.lng]
              setDestination(dest)
              setDestinationName(location.name || 'موقع مختار')
              console.log('✅ Destination (B) saved:', {
                name: location.name,
                lat: dest[0],
                lng: dest[1],
                formatted: `${dest[0]}, ${dest[1]}`,
                currentLocation: currentLocation ? {
                  lat: currentLocation[0],
                  lng: currentLocation[1],
                  formatted: `${currentLocation[0]}, ${currentLocation[1]}`,
                } : null,
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

        {/* قسم الخريطة */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary-600" />
            الخريطة
          </h3>
          <div className="flex-1 relative min-h-[400px] rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm">
            <GoogleTrafficMap
              center={
                isDemoMode && route
                  ? { lat: 24.7318, lng: 46.6877 } // وسط المسار الوهمي في الرياض
                  : currentLocation 
                    ? { lat: currentLocation[0], lng: currentLocation[1] } // مركز الخريطة على موقعك الحالي
                    : (route && route.route && route.route.length > 0 
                      ? { lat: route.route[0][0], lng: route.route[0][1] }
                      : route && route.originLat && route.originLng
                        ? { lat: route.originLat, lng: route.originLng }
                        : { lat: 24.7136, lng: 46.6753 }) // الرياض كموقع افتراضي
              }
              zoom={isDemoMode ? 13 : (currentLocation ? 15 : (isNavigating && currentLocation ? 16 : 14))} // تكبير الخريطة عند وجود موقع حالي
              showTrafficLayer={true}
              route={
                currentLocation && destination
                  ? {
                      origin: { lat: currentLocation[0], lng: currentLocation[1] }, // A: موقعك الحالي دائماً
                      destination: { lat: destination[0], lng: destination[1] }, // B: الوجهة المحددة
                      polyline: route?.route ? route.route.map(([lat, lng]: [number, number]) => ({ lat, lng })) : undefined,
                    }
                  : route && route.destinationLat && route.destinationLng && currentLocation
                    ? {
                        origin: { lat: currentLocation[0], lng: currentLocation[1] }, // A: موقعك الحالي دائماً
                        destination: { lat: route.destinationLat, lng: route.destinationLng }, // B: الوجهة المحفوظة
                        polyline: route.route ? route.route.map(([lat, lng]: [number, number]) => ({ lat, lng })) : undefined,
                      }
                    : route && route.route && route.route.length > 0
                      ? {
                          origin: { lat: route.originLat || route.route[0][0], lng: route.originLng || route.route[0][1] },
                          destination: { lat: route.destinationLat || route.route[route.route.length - 1][0], lng: route.destinationLng || route.route[route.route.length - 1][1] },
                          polyline: route.route.map(([lat, lng]: [number, number]) => ({ lat, lng })),
                        }
                      : undefined
              }
              markers={
                routeAlerts && routeAlerts.length > 0
                  ? routeAlerts
                      .filter((alert: any) => shownAlerts.has(alert.id) || alert.type === 'congestion' || alert.type === 'accident')
                      .map((alert: any) => {
                        const location = alert.location || (alert as any).lat && (alert as any).lng 
                          ? { lat: (alert as any).lat, lng: (alert as any).lng }
                          : null
                        if (!location) return null
                        return {
                          lat: location.lat || location[0],
                          lng: location.lng || location[1],
                          title: alert.message,
                          congestionIndex: alert.congestionIndex || (alert.severity === 'critical' ? 90 : alert.severity === 'high' ? 70 : 50),
                        }
                      })
                      .filter(Boolean)
                  : []
              }
              currentLocation={currentLocation}
              className="w-full h-full"
            />
          </div>
        </div>

        {/* معلومات المسار - في الأسفل */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="container mx-auto px-4 py-4 space-y-4">

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

            {/* القسم الثالث: أزرار التحكم والتقدم - تصميم محسّن للجوال */}
            <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 space-y-4">
              {/* زر التوجيه الرئيسي - كبير وواضح */}
              <button
                onClick={toggleNavigation}
                className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                  isNavigating
                    ? 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                    : 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800'
                }`}
              >
                <div className="flex items-center justify-center gap-3">
                  {isNavigating ? (
                    <>
                      <Pause className="h-6 w-6" />
                      <span>إيقاف التوجيه</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-6 w-6" />
                      <span>بدء التوجيه</span>
                    </>
                  )}
                </div>
              </button>

              {/* الأزرار الثانوية */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  className={`flex-1 py-3 rounded-lg font-medium transition ${
                    isVoiceEnabled
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                      : 'bg-gray-100 text-gray-600 border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isVoiceEnabled ? (
                      <>
                        <Volume2 className="h-5 w-5" />
                        <span className="text-sm">الصوت مفعّل</span>
                      </>
                    ) : (
                      <>
                        <VolumeX className="h-5 w-5" />
                        <span className="text-sm">الصوت معطّل</span>
                      </>
                    )}
                  </div>
                </button>

                <button
                  onClick={resetNavigation}
                  className="flex-1 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition border-2 border-gray-200 font-medium"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    <span className="text-sm">إعادة تعيين</span>
                  </div>
                </button>
              </div>

              {/* شريط التقدم - محسّن وواضح */}
              {route.steps && route.steps.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 border-2 border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                      <span className="text-sm font-bold text-gray-700">التقدم</span>
                    </div>
                    <span className="text-lg font-bold text-primary-600">
                      {currentStepIndex + 1} / {route.steps.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                      style={{ width: `${progress}%` }}
                    >
                      {progress > 10 && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {Math.round(progress)}% مكتمل
                  </p>
                </div>
              )}

              {/* بطاقة المسافة والوقت - تحت التقدم */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Route className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-bold text-gray-700">المسافة</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-1">{route.distance.toFixed(1)}</p>
                  <p className="text-xs text-gray-600 font-medium">كيلومتر</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border-2 border-green-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-bold text-gray-700">الوقت المتوقع</span>
                  </div>
                  <p className="text-3xl font-bold text-green-600 mb-1">
                    {Math.round(route.estimatedTimeWithWeather || route.estimatedTimeInTraffic || route.estimatedTime)}
                  </p>
                  <p className="text-xs text-gray-600 font-medium">
                    {route.estimatedTimeWithWeather 
                      ? `دقيقة (مع الازدحام والطقس${route.weatherDelay ? ` +${route.weatherDelay.toFixed(0)}%` : ''})`
                      : route.estimatedTimeInTraffic 
                        ? 'دقيقة (مع الازدحام)' 
                        : 'دقيقة'}
                  </p>
                </div>
              </div>

              {/* المسافة إلى المنعطف التالي */}
              {isNavigating && distanceToNextTurn !== null && (
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Navigation className="w-5 h-5 text-blue-600" />
                    <p className="text-sm font-bold text-gray-700">المسافة إلى المنعطف التالي</p>
                  </div>
                  <p className="text-3xl font-bold text-primary-600">
                    {formatDistance(distanceToNextTurn)}
                  </p>
                </div>
              )}
            </div>
            
            {/* تفاصيل الحركة المرورية على المسار */}
            {trafficDetails && trafficDetails.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  تفاصيل الحركة المرورية على المسار
                </h3>
                <div className="space-y-3">
                  {trafficDetails.map((detail: any, index: number) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 ${
                        detail.congestionIndex >= 70
                          ? 'bg-red-50 border-red-200'
                          : detail.congestionIndex >= 50
                          ? 'bg-orange-50 border-orange-200'
                          : 'bg-yellow-50 border-yellow-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 text-sm mb-1">{detail.roadName}</p>
                          <p className="text-xs text-gray-600 mb-2">{detail.reason}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              ازدحام: {detail.congestionIndex}%
                            </span>
                            <span className="flex items-center gap-1">
                              <Route className="w-3 h-3" />
                              سرعة: {detail.avgSpeed} كم/س
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              تأخير: {detail.delayMinutes} د
                            </span>
                          </div>
                          {detail.incidents && detail.incidents.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-current/20">
                              <p className="text-xs font-medium mb-1">الحوادث:</p>
                              <div className="flex flex-wrap gap-1">
                                {detail.incidents.map((incident: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 bg-white/50 rounded text-xs"
                                  >
                                    {incident}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {Math.round(detail.position * 100)}% من المسار
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* تفاصيل الطقس (الأمطار والضباب) */}
            {weatherData && (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-4 shadow-sm border-2 border-blue-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  {weatherData.condition === 'rain' ? (
                    <CloudRain className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Cloud className="w-5 h-5 text-gray-600" />
                  )}
                  حالة الطقس
                </h3>
                
                {/* الحالة الحالية */}
                <div className="bg-white rounded-lg p-3 mb-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {weatherData.condition === 'rain' ? (
                        <>
                          <CloudRain className="w-5 h-5 text-blue-600" />
                          <span className="font-bold text-gray-900">أمطار</span>
                        </>
                      ) : (
                        <>
                          <Cloud className="w-5 h-5 text-gray-600" />
                          <span className="font-bold text-gray-900">ضباب</span>
                        </>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {weatherData.temperature}°C
                    </span>
                  </div>
                  
                  {/* تفاصيل الأمطار */}
                  {weatherData.condition === 'rain' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Droplets className="w-4 h-4 text-blue-600" />
                          معدل هطول الأمطار
                        </span>
                        <span className="font-bold text-blue-600">
                          {weatherData.precipitation.toFixed(1)} مم/ساعة
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Droplets className="w-4 h-4 text-blue-500" />
                          احتمال هطول الأمطار
                        </span>
                        <span className="font-bold text-blue-600">
                          {weatherData.precipitationProbability}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Eye className="w-4 h-4 text-gray-600" />
                          الرؤية
                        </span>
                        <span className="font-bold text-orange-600">
                          {weatherData.visibility} متر
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* تفاصيل الضباب */}
                  {weatherData.condition === 'fog' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Eye className="w-4 h-4 text-gray-600" />
                          الرؤية
                        </span>
                        <span className="font-bold text-red-600">
                          {weatherData.visibility} متر
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Wind className="w-4 h-4 text-gray-600" />
                          سرعة الرياح
                        </span>
                        <span className="font-bold text-gray-700">
                          {weatherData.windSpeed} كم/س
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-gray-700">
                          <Thermometer className="w-4 h-4 text-gray-600" />
                          الرطوبة
                        </span>
                        <span className="font-bold text-gray-700">
                          {weatherData.humidity}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* التنبيهات الطقسية */}
                {weatherData.alerts && weatherData.alerts.length > 0 && (
                  <div className="space-y-2">
                    {weatherData.alerts.map((alert: any, index: number) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 ${
                          alert.severity === 'high'
                            ? 'bg-red-50 border-red-200'
                            : 'bg-yellow-50 border-yellow-200'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                            alert.severity === 'high' ? 'text-red-600' : 'text-yellow-600'
                          }`} />
                          <div className="flex-1">
                            <p className="font-bold text-sm mb-1">{alert.message}</p>
                            <p className="text-xs text-gray-700">{alert.advice}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* التوقعات الساعية */}
                {weatherData.hourlyForecast && weatherData.hourlyForecast.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-bold text-gray-700 mb-2">التوقعات الساعية:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {weatherData.hourlyForecast.map((forecast: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white rounded p-2 border border-gray-100"
                        >
                          <p className="text-xs font-medium text-gray-700 mb-1">{forecast.time}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            {forecast.condition === 'rain' ? (
                              <CloudRain className="w-3 h-3 text-blue-600" />
                            ) : (
                              <Cloud className="w-3 h-3 text-gray-600" />
                            )}
                            <span>{forecast.condition === 'rain' ? 'أمطار' : 'ضباب'}</span>
                          </div>
                          {forecast.precipitation > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              {forecast.precipitation.toFixed(1)} مم
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            رؤية: {forecast.visibility}م
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* القسم الرابع: التنبيهات على المسار */}
            {routeAlerts && routeAlerts.length > 0 && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <button
                  onClick={() => setShowAlerts(!showAlerts)}
                  className="w-full flex items-center justify-between mb-3"
                >
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    تنبيهات على المسار ({routeAlerts.length})
                  </h3>
                  {showAlerts ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                
                {showAlerts && (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {routeAlerts
                      .filter((alert: any) => shownAlerts.has(alert.id) || alert.type === 'congestion' || alert.type === 'accident')
                      .map((alert: any, index: number) => {
                      const severityColors = {
                        critical: 'bg-red-50 border-red-300 text-red-800',
                        high: 'bg-orange-50 border-orange-300 text-orange-800',
                        medium: 'bg-yellow-50 border-yellow-300 text-yellow-800',
                        low: 'bg-blue-50 border-blue-300 text-blue-800',
                      }
                      
                      const severityColor = severityColors[alert.severity as keyof typeof severityColors] || severityColors.low
                      
                      const isNew = !shownAlerts.has(alert.id) && (alert.type === 'congestion' || alert.type === 'accident')
                      
                      return (
                        <div
                          key={alert.id || index}
                          className={`p-3 rounded-lg border-2 ${severityColor} ${
                            isNew ? 'animate-pulse ring-2 ring-primary-500' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                              alert.severity === 'critical' ? 'text-red-600' :
                              alert.severity === 'high' ? 'text-orange-600' :
                              alert.severity === 'medium' ? 'text-yellow-600' :
                              'text-blue-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm mb-1">{(alert as any).roadName || alert.message.split(' ').slice(0, 3).join(' ') || 'تنبيه'}</p>
                              <p className="text-xs mb-2">{alert.message}</p>
                              <div className="flex items-center gap-3 text-xs opacity-75">
                                <span className="flex items-center gap-1">
                                  <Route className="w-3 h-3" />
                                  {formatDistance(alert.routeDistance || 0)} على المسار
                                </span>
                                {alert.distanceFromRoute && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {Math.round(alert.distanceFromRoute)}م من المسار
                                  </span>
                                )}
                              </div>
                              {nextAlertDistance !== null && index === 0 && (
                                <div className="mt-2 pt-2 border-t border-current/20">
                                  <p className="text-xs font-medium">
                                    التنبيه التالي بعد: {formatDistance(nextAlertDistance)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* القسم الخامس: موقع الاتجاه في القائمة */}
            {currentLocation && (destination || (route && route.destinationLat && route.destinationLng)) && (
              <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-primary-600" />
                  موقع الاتجاه
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-700">موقعك الحالي (A)</p>
                      <p className="text-xs text-gray-500">
                        {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-primary-50 rounded-lg border-2 border-primary-200">
                    <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-primary-700">الوجهة (B)</p>
                      <p className="text-xs text-gray-600">
                        {destinationName || (destination ? `${destination[0].toFixed(6)}, ${destination[1].toFixed(6)}` : `${route.destinationLat.toFixed(6)}, ${route.destinationLng.toFixed(6)}`)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        خط العرض: {(destination ? destination[0] : route.destinationLat).toFixed(6)}, خط الطول: {(destination ? destination[1] : route.destinationLng).toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* القسم السادس: قائمة الخطوات */}
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
