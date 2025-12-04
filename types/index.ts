export interface RoadSegment {
  id: string
  roadName: string
  city: string
  direction: string
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  length: number
}

export interface TrafficData {
  id: string
  segmentId: string
  timestamp: Date
  deviceCount: number
  avgSpeed: number
  density: number
  congestionIndex: number
  movementDirection: number
}

export interface Prediction {
  id: string
  segmentId: string
  predictedAt: Date
  predictedFor: Date
  predictedIndex: number
  confidence: number
  factors: Record<string, any>
}

export interface Alert {
  id: string
  segmentId: string
  type: 'congestion' | 'accident' | 'event' | 'weather' | 'construction' | 'road_closed'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  alternativeRoute?: {
    suggested?: boolean
    coordinates?: Array<[number, number]>
    distance?: number
    estimatedTime?: number
    alternativeSegments?: string[]
    [key: string]: any // للسماح بخصائص إضافية من JSON
  }
  createdAt: Date | string
  expiresAt: Date | string
  isActive: boolean
}

export interface MapMarker {
  id: string
  position: [number, number]
  congestionIndex: number
  roadName: string
  direction: string
  fullData?: {
    city?: string
    deviceCount?: number
    avgSpeed?: number
    timestamp?: Date | string
  }
}

