// المدن المدعومة
export const CITIES = [
  'الرياض',
  'جدة',
  'الدمام',
  'المدينة المنورة',
  'الخبر',
  'الطائف',
  'بريدة',
  'خميس مشيط',
  'حائل',
  'نجران',
] as const

// إحداثيات المدن (مراكز)
export const CITY_CENTERS: Record<string, [number, number]> = {
  'الرياض': [24.7136, 46.6753],
  'جدة': [21.4858, 39.1925],
  'الدمام': [26.4207, 50.0888],
  'المدينة المنورة': [24.5247, 39.5692],
  'الخبر': [26.2794, 50.2080],
  'الطائف': [21.2703, 40.4158],
  'بريدة': [26.3260, 43.9750],
  'خميس مشيط': [18.3000, 42.7333],
  'حائل': [27.5114, 41.7208],
  'نجران': [17.4917, 44.1277],
}

// مستويات الازدحام
export const CONGESTION_LEVELS = {
  SMOOTH: { min: 0, max: 30, label: 'سلس', color: 'traffic-green' },
  MODERATE: { min: 30, max: 50, label: 'متوسط', color: 'traffic-yellow' },
  BUSY: { min: 50, max: 70, label: 'مزدحم', color: 'traffic-orange' },
  VERY_BUSY: { min: 70, max: 90, label: 'مزدحم جداً', color: 'traffic-red' },
  CONGESTED: { min: 90, max: 100, label: 'اختناق', color: 'traffic-dark' },
} as const

// أنواع التنبيهات
export const ALERT_TYPES = {
  CONGESTION: 'congestion',
  ACCIDENT: 'accident',
  EVENT: 'event',
  WEATHER: 'weather',
} as const

export const ALERT_TYPE_LABELS: Record<string, string> = {
  [ALERT_TYPES.CONGESTION]: 'ازدحام',
  [ALERT_TYPES.ACCIDENT]: 'حادث',
  [ALERT_TYPES.EVENT]: 'فعالية',
  [ALERT_TYPES.WEATHER]: 'طقس',
}

// مستويات الخطورة
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
} as const

export const SEVERITY_LABELS: Record<string, string> = {
  [SEVERITY_LEVELS.LOW]: 'منخفض',
  [SEVERITY_LEVELS.MEDIUM]: 'متوسط',
  [SEVERITY_LEVELS.HIGH]: 'عالي',
  [SEVERITY_LEVELS.CRITICAL]: 'حرج',
}

// فترات التحديث (بالميلي ثانية)
export const REFETCH_INTERVALS = {
  TRAFFIC: 30000, // 30 ثانية
  PREDICTIONS: 60000, // دقيقة
  ALERTS: 60000, // دقيقة
  STATS: 30000, // 30 ثانية
} as const

