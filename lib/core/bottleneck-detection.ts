/**
 * كشف نقطة انطلاق الازدحام (Bottleneck Origin Detection)
 * 
 * يحدد:
 * - مكان أول هبوط حاد في السرعة
 * - ربط الامتداد الخلفي للاختناق
 */

import { TrafficAnalysis } from './traffic-intelligence'

export interface Bottleneck {
  segmentId: string
  originLat: number
  originLng: number
  detectedAt: Date
  severity: 'low' | 'medium' | 'high' | 'critical'
  speedDrop: number // نسبة هبوط السرعة (%)
  backwardExtent: number // امتداد الاختناق الخلفي (كم)
  affectedSegments: string[] // المقاطع المتأثرة
}

const SPEED_DROP_THRESHOLD = 0.3 // 30% هبوط في السرعة
const CRITICAL_SPEED_DROP = 0.5 // 50% هبوط حرج

/**
 * كشف نقطة انطلاق الازدحام
 */
export function detectBottleneck(
  currentAnalysis: TrafficAnalysis,
  previousAnalysis: TrafficAnalysis | null,
  freeFlowSpeed: number
): Bottleneck | null {
  if (!previousAnalysis) {
    return null // لا يمكن الكشف بدون بيانات سابقة
  }

  // حساب نسبة هبوط السرعة
  const speedDrop = (previousAnalysis.avgSpeed - currentAnalysis.avgSpeed) / previousAnalysis.avgSpeed

  // التحقق من وجود هبوط حاد
  if (speedDrop < SPEED_DROP_THRESHOLD) {
    return null // لا يوجد هبوط كافٍ
  }

  // تحديد مستوى الخطورة
  let severity: Bottleneck['severity'] = 'low'
  if (speedDrop >= CRITICAL_SPEED_DROP) {
    severity = 'critical'
  } else if (speedDrop >= 0.4) {
    severity = 'high'
  } else if (speedDrop >= 0.35) {
    severity = 'medium'
  }

  // تقدير الامتداد الخلفي بناءً على الكثافة والازدحام
  const backwardExtent = estimateBackwardExtent(
    currentAnalysis.congestionIndex,
    currentAnalysis.density
  )

  return {
    segmentId: currentAnalysis.segmentId,
    originLat: 0, // سيتم ملؤه من بيانات المقطع
    originLng: 0, // سيتم ملؤه من بيانات المقطع
    detectedAt: new Date(),
    severity,
    speedDrop: Math.round(speedDrop * 100) / 100, // تقريب لخانتين عشريتين
    backwardExtent,
    affectedSegments: [currentAnalysis.segmentId],
  }
}

/**
 * تقدير الامتداد الخلفي للاختناق
 */
function estimateBackwardExtent(
  congestionIndex: number,
  density: number
): number {
  // كلما زاد الازدحام والكثافة، زاد الامتداد الخلفي
  const congestionFactor = congestionIndex / 100
  const densityFactor = Math.min(density / 50, 1) // كثافة عالية = 50+ جهاز/كم

  // تقدير الامتداد بالكيلومتر
  const extent = (congestionFactor * 2) + (densityFactor * 1.5)

  return Math.round(extent * 10) / 10 // تقريب لخانة عشرية واحدة
}

/**
 * ربط الامتداد الخلفي مع المقاطع المجاورة
 */
export function linkBackwardExtent(
  bottleneck: Bottleneck,
  adjacentSegments: Array<{
    id: string
    congestionIndex: number
    distance: number // المسافة من نقطة الانطلاق
  }>
): Bottleneck {
  const affected: string[] = [bottleneck.segmentId]

  // إضافة المقاطع المتأثرة ضمن الامتداد الخلفي
  for (const segment of adjacentSegments) {
    if (
      segment.distance <= bottleneck.backwardExtent &&
      segment.congestionIndex > 50 // ازدحام متوسط أو أعلى
    ) {
      affected.push(segment.id)
    }
  }

  return {
    ...bottleneck,
    affectedSegments: affected,
  }
}

