/**
 * محرك التحليل المروري (Traffic Intelligence Core)
 * 
 * يحسب:
 * - كثافة الأجهزة لكل كم
 * - متوسط السرعة
 * - مؤشر ازدحام (0-100)
 * - زمن التأخير الحقيقي بالدقائق
 */

import { AnonymizedTrafficData } from './anonymization'
import { calculateCongestionIndex } from '../utils'

export interface TrafficAnalysis {
  segmentId: string
  timestamp: Date
  density: number // جهاز/كم
  avgSpeed: number // كم/س
  congestionIndex: number // 0-100
  delayMinutes: number // دقائق التأخير
  movementDirection: number
  freeFlowSpeed: number // السرعة الطبيعية
}

/**
 * تحليل بيانات المرور
 */
export function analyzeTraffic(
  anonymizedData: AnonymizedTrafficData,
  freeFlowSpeed: number = 60
): TrafficAnalysis {
  // 1. حساب كثافة الأجهزة لكل كم
  const density = anonymizedData.density

  // 2. متوسط السرعة (موجود في البيانات)
  const avgSpeed = anonymizedData.avgSpeed

  // 3. حساب مؤشر الازدحام (0-100)
  const congestionIndex = calculateCongestionIndex(
    density,
    avgSpeed,
    freeFlowSpeed
  )

  // 4. حساب زمن التأخير بالدقائق
  // التأخير = (السرعة الطبيعية - السرعة الفعلية) / السرعة الطبيعية × الوقت
  const speedRatio = avgSpeed / freeFlowSpeed
  const delayFactor = 1 - speedRatio // عامل التأخير (0-1)
  
  // تقدير الوقت المتوقع للعبور
  const estimatedTimeMinutes = (freeFlowSpeed / avgSpeed) * 5 // افتراض 5 دقائق في الحالة الطبيعية
  const delayMinutes = delayFactor * estimatedTimeMinutes

  return {
    segmentId: anonymizedData.segmentId,
    timestamp: anonymizedData.timestamp,
    density,
    avgSpeed,
    congestionIndex: Math.round(congestionIndex),
    delayMinutes: Math.max(0, Math.round(delayMinutes * 10) / 10), // تقريب لخانة عشرية واحدة
    movementDirection: anonymizedData.movementDirection,
    freeFlowSpeed,
  }
}

/**
 * حساب مؤشر الازدحام المتقدم
 */
export function calculateAdvancedCongestionIndex(
  density: number,
  avgSpeed: number,
  freeFlowSpeed: number,
  historicalAvg?: number
): number {
  // مؤشر أساسي
  const baseIndex = calculateCongestionIndex(density, avgSpeed, freeFlowSpeed)

  // تعديل بناءً على المتوسط التاريخي
  if (historicalAvg) {
    const deviation = Math.abs(baseIndex - historicalAvg)
    // إذا كان الانحراف كبير، زيادة المؤشر
    if (deviation > 20) {
      return Math.min(100, baseIndex + 10)
    }
  }

  return baseIndex
}

