/**
 * واجهة الطوارئ (Emergency Routing API)
 * 
 * اختيار المسار الأسرع
 * تحديث حي كل 30 ثانية
 */

export interface EmergencyRoute {
  id: string
  originLat: number
  originLng: number
  destinationLat: number
  destinationLng: number
  
  route: Array<[number, number]> // إحداثيات المسار
  distance: number // المسافة (كم)
  estimatedTime: number // الوقت المتوقع (دقيقة)
  estimatedTimeInTraffic?: number // الوقت المتوقع مع الازدحام (دقيقة)
  
  // تحديثات حية
  lastUpdate: Date
  updateInterval: number // فترة التحديث (ثانية)
  
  // حالة المسار
  isActive: boolean
  congestionAlongRoute: Array<{
    segmentId: string
    congestionIndex: number
    delayMinutes: number
  }>
  
  // خطوات التوجيه
  steps?: Array<{
    instruction: string
    distance: number // meters
    duration: number // seconds
    startLocation: [number, number]
    endLocation: [number, number]
    maneuver?: string
  }>
}

const DEFAULT_UPDATE_INTERVAL = 30 // ثانية

/**
 * حساب مسار طوارئ
 */
export function calculateEmergencyRoute(
  origin: [number, number],
  destination: [number, number],
  currentCongestion: Map<string, { index: number; delay: number }> = new Map()
): EmergencyRoute {
  // حساب المسار (مبسط - في الإنتاج سيستخدم خوارزمية A* أو Dijkstra)
  const route = calculateOptimalRoute(origin, destination, currentCongestion)
  
  // حساب المسافة
  const distance = calculateRouteDistance(route)
  
  // حساب الوقت المتوقع
  const estimatedTime = calculateEstimatedTime(route, currentCongestion)

  // تحديد الازدحام على طول المسار
  const congestionAlongRoute = route.map((point, index) => {
    const segmentId = `segment-${index}`
    const congestion = currentCongestion.get(segmentId) || { index: 0, delay: 0 }
    
    return {
      segmentId,
      congestionIndex: congestion.index,
      delayMinutes: congestion.delay,
    }
  })

  return {
    id: `emergency-${Date.now()}`,
    originLat: origin[0],
    originLng: origin[1],
    destinationLat: destination[0],
    destinationLng: destination[1],
    route,
    distance: Math.round(distance * 10) / 10,
    estimatedTime: Math.round(estimatedTime * 10) / 10,
    lastUpdate: new Date(),
    updateInterval: DEFAULT_UPDATE_INTERVAL,
    isActive: true,
    congestionAlongRoute,
  }
}

/**
 * تحديث مسار الطوارئ
 */
export function updateEmergencyRoute(
  route: EmergencyRoute,
  currentCongestion: Map<string, { index: number; delay: number }>
): EmergencyRoute {
  // إعادة حساب المسار بناءً على الازدحام الحالي
  const origin: [number, number] = [route.originLat, route.originLng]
  const destination: [number, number] = [route.destinationLat, route.destinationLng]
  
  const updatedRoute = calculateOptimalRoute(origin, destination, currentCongestion)
  
  // تحديث البيانات
  const distance = calculateRouteDistance(updatedRoute)
  const estimatedTime = calculateEstimatedTime(updatedRoute, currentCongestion)

  const congestionAlongRoute = updatedRoute.map((point, index) => {
    const segmentId = `segment-${index}`
    const congestion = currentCongestion.get(segmentId) || { index: 0, delay: 0 }
    
    return {
      segmentId,
      congestionIndex: congestion.index,
      delayMinutes: congestion.delay,
    }
  })

  return {
    ...route,
    route: updatedRoute,
    distance: Math.round(distance * 10) / 10,
    estimatedTime: Math.round(estimatedTime * 10) / 10,
    lastUpdate: new Date(),
    congestionAlongRoute,
  }
}

/**
 * حساب المسار الأمثل (مبسط)
 * في الإنتاج سيستخدم خوارزمية متقدمة
 */
function calculateOptimalRoute(
  origin: [number, number],
  destination: [number, number],
  congestion: Map<string, { index: number; delay: number }>
): Array<[number, number]> {
  // مسار مبسط مباشر (في الإنتاج سيستخدم خوارزمية A* مع تجنب الازدحام)
  const steps = 10
  const route: Array<[number, number]> = []
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps
    const lat = origin[0] + (destination[0] - origin[0]) * ratio
    const lng = origin[1] + (destination[1] - origin[1]) * ratio
    route.push([lat, lng])
  }
  
  return route
}

/**
 * حساب مسافة المسار
 */
function calculateRouteDistance(route: Array<[number, number]>): number {
  let distance = 0
  
  for (let i = 1; i < route.length; i++) {
    const [lat1, lng1] = route[i - 1]
    const [lat2, lng2] = route[i]
    
    // حساب المسافة باستخدام Haversine formula (مبسط)
    const R = 6371 // نصف قطر الأرض بالكيلومتر
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    distance += R * c
  }
  
  return distance
}

/**
 * حساب الوقت المتوقع
 */
function calculateEstimatedTime(
  route: Array<[number, number]>,
  congestion: Map<string, { index: number; delay: number }>
): number {
  const baseSpeed = 50 // كم/س (سرعة افتراضية)
  const distance = calculateRouteDistance(route)
  
  // الوقت الأساسي
  let time = (distance / baseSpeed) * 60 // بالدقائق
  
  // إضافة التأخير بسبب الازدحام
  route.forEach((point, index) => {
    const segmentId = `segment-${index}`
    const congestionData = congestion.get(segmentId)
    
    if (congestionData) {
      time += congestionData.delay
    }
  })
  
  return time
}

/**
 * التحقق من الحاجة للتحديث
 */
export function shouldUpdateRoute(route: EmergencyRoute): boolean {
  const now = new Date()
  const timeSinceUpdate = (now.getTime() - route.lastUpdate.getTime()) / 1000
  
  return timeSinceUpdate >= route.updateInterval
}

