/**
 * وحدة الإشارات الذكية (Adaptive Signal Interface)
 * 
 * دعم توصيات زمن الإشارة
 * التكامل مع النظام الإشاري
 */

import { TrafficAnalysis } from './traffic-intelligence'
import { Prediction } from './prediction-engine'

export interface SignalRecommendation {
  segmentId: string
  signalId?: string
  recommendedAt: Date
  
  // توصيات التوقيت
  greenTimeSeconds: number // وقت الإشارة الخضراء (ثانية)
  cycleTimeSeconds: number // وقت الدورة الكاملة (ثانية)
  priority: 'normal' | 'high' | 'emergency'
  
  // التأثير المتوقع
  expectedImpact: {
    delayReduction: number // تقليل التأخير (دقيقة)
    throughputIncrease: number // زيادة الإنتاجية (%)
    queueLengthReduction: number // تقليل طول الطابور (%)
  }
  
  // حالة التنفيذ
  implemented: boolean
  implementedAt?: Date
}

const DEFAULT_GREEN_TIME = 30 // ثانية
const DEFAULT_CYCLE_TIME = 90 // ثانية
const MIN_GREEN_TIME = 15 // الحد الأدنى
const MAX_GREEN_TIME = 60 // الحد الأقصى

/**
 * توليد توصيات إشارات ذكية
 */
export function generateSignalRecommendations(
  analysis: TrafficAnalysis,
  predictions: Prediction[]
): SignalRecommendation[] {
  const recommendations: SignalRecommendation[] = []

  // 1. توصية بناءً على الازدحام الحالي
  if (analysis.congestionIndex >= 50) {
    recommendations.push(generateCurrentCongestionRecommendation(analysis))
  }

  // 2. توصية بناءً على التنبؤات
  const highCongestionPrediction = predictions.find(p => p.predictedIndex >= 70)
  if (highCongestionPrediction) {
    recommendations.push(generatePredictiveRecommendation(analysis, highCongestionPrediction))
  }

  return recommendations
}

/**
 * توصية بناءً على الازدحام الحالي
 */
function generateCurrentCongestionRecommendation(
  analysis: TrafficAnalysis
): SignalRecommendation {
  // حساب وقت الإشارة الخضراء المثالي بناءً على الكثافة
  const densityFactor = Math.min(analysis.density / 50, 1) // كثافة عالية = 50+ جهاز/كم
  const congestionFactor = analysis.congestionIndex / 100

  // زيادة وقت الإشارة الخضراء في حالة الازدحام
  const greenTime = Math.min(
    MAX_GREEN_TIME,
    Math.max(
      MIN_GREEN_TIME,
      DEFAULT_GREEN_TIME + (densityFactor * 20) + (congestionFactor * 10)
    )
  )

  const cycleTime = greenTime * 2 + 20 // وقت الإشارة الحمراء + وقت الانتقال

  // تحديد الأولوية
  let priority: SignalRecommendation['priority'] = 'normal'
  if (analysis.congestionIndex >= 80) {
    priority = 'emergency'
  } else if (analysis.congestionIndex >= 60) {
    priority = 'high'
  }

  // حساب التأثير المتوقع
  const delayReduction = calculateDelayReduction(analysis, greenTime)
  const throughputIncrease = calculateThroughputIncrease(analysis, greenTime)
  const queueLengthReduction = calculateQueueReduction(analysis, greenTime)

  return {
    segmentId: analysis.segmentId,
    recommendedAt: new Date(),
    greenTimeSeconds: Math.round(greenTime),
    cycleTimeSeconds: Math.round(cycleTime),
    priority,
    expectedImpact: {
      delayReduction: Math.round(delayReduction * 10) / 10,
      throughputIncrease: Math.round(throughputIncrease * 10) / 10,
      queueLengthReduction: Math.round(queueLengthReduction * 10) / 10,
    },
    implemented: false,
  }
}

/**
 * توصية بناءً على التنبؤات
 */
function generatePredictiveRecommendation(
  analysis: TrafficAnalysis,
  prediction: Prediction
): SignalRecommendation {
  // توصية وقائية قبل حدوث الازدحام
  const minutesUntilCongestion = Math.round(
    (prediction.predictedFor.getTime() - Date.now()) / 60000
  )

  // زيادة وقت الإشارة الخضراء بشكل تدريجي
  const predictiveGreenTime = DEFAULT_GREEN_TIME + (prediction.predictedIndex / 100) * 20

  return {
    segmentId: analysis.segmentId,
    recommendedAt: new Date(),
    greenTimeSeconds: Math.round(Math.min(MAX_GREEN_TIME, predictiveGreenTime)),
    cycleTimeSeconds: Math.round(predictiveGreenTime * 2 + 20),
    priority: minutesUntilCongestion <= 10 ? 'high' : 'normal',
    expectedImpact: {
      delayReduction: prediction.predictedDelayMinutes * 0.4, // تقليل 40% من التأخير المتوقع
      throughputIncrease: 15,
      queueLengthReduction: 25,
    },
    implemented: false,
  }
}

/**
 * حساب تقليل التأخير المتوقع
 */
function calculateDelayReduction(
  analysis: TrafficAnalysis,
  greenTime: number
): number {
  // تقليل التأخير بناءً على زيادة وقت الإشارة الخضراء
  const greenTimeIncrease = (greenTime - DEFAULT_GREEN_TIME) / DEFAULT_GREEN_TIME
  return analysis.delayMinutes * greenTimeIncrease * 0.5 // تقليل 50% من الزيادة
}

/**
 * حساب زيادة الإنتاجية المتوقعة
 */
function calculateThroughputIncrease(
  analysis: TrafficAnalysis,
  greenTime: number
): number {
  // زيادة الإنتاجية بناءً على وقت الإشارة الخضراء
  const greenTimeIncrease = (greenTime - DEFAULT_GREEN_TIME) / DEFAULT_GREEN_TIME
  return Math.min(30, greenTimeIncrease * 100) // زيادة حتى 30%
}

/**
 * حساب تقليل طول الطابور المتوقع
 */
function calculateQueueReduction(
  analysis: TrafficAnalysis,
  greenTime: number
): number {
  // تقليل الطابور بناءً على زيادة وقت الإشارة الخضراء
  const congestionFactor = analysis.congestionIndex / 100
  const greenTimeFactor = (greenTime - DEFAULT_GREEN_TIME) / DEFAULT_GREEN_TIME
  
  return Math.min(40, congestionFactor * greenTimeFactor * 100) // تقليل حتى 40%
}

/**
 * التحقق من جدوى التوصية
 */
export function validateRecommendation(
  recommendation: SignalRecommendation
): { valid: boolean; reason?: string } {
  // التحقق من الحدود
  if (recommendation.greenTimeSeconds < MIN_GREEN_TIME) {
    return { valid: false, reason: 'وقت الإشارة الخضراء أقل من الحد الأدنى' }
  }

  if (recommendation.greenTimeSeconds > MAX_GREEN_TIME) {
    return { valid: false, reason: 'وقت الإشارة الخضراء أكبر من الحد الأقصى' }
  }

  if (recommendation.cycleTimeSeconds < recommendation.greenTimeSeconds * 2) {
    return { valid: false, reason: 'وقت الدورة غير كافٍ' }
  }

  return { valid: true }
}

