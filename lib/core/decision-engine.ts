/**
 * محرك القرار المروري (Traffic Decision Engine)
 * 
 * يقترح:
 * - تحويلات مرورية
 * - تدخلات تشغيلية
 * - ضبط إشارات مؤقت
 * 
 * ويحسب:
 * - أثر كل تدخل
 * - اختيار الحل الأعلى فائدة
 */

import { TrafficAnalysis } from './traffic-intelligence'
import { Bottleneck } from './bottleneck-detection'
import { Prediction } from './prediction-engine'

export type DecisionType = 'diversion' | 'signal_adjustment' | 'intervention' | 'lane_management'

export interface TrafficDecision {
  id: string
  segmentId: string
  decisionType: DecisionType
  recommendedAt: Date
  
  // التأثير المتوقع
  expectedDelayReduction: number // دقائق
  expectedBenefitScore: number // 0-100
  affectedSegments: string[]
  
  // تفاصيل القرار
  details: {
    description: string
    implementation: string
    cost?: number
    duration?: number // مدة التنفيذ (دقيقة)
  }
  
  // الأولوية
  priority: 'low' | 'medium' | 'high' | 'critical'
}

/**
 * توليد قرارات مرورية بناءً على التحليل والتنبؤات
 */
export function generateDecisions(
  currentAnalysis: TrafficAnalysis,
  bottleneck: Bottleneck | null,
  predictions: Prediction[]
): TrafficDecision[] {
  const decisions: TrafficDecision[] = []

  // 1. التحقق من وجود ازدحام حرج
  if (currentAnalysis.congestionIndex >= 80 || bottleneck?.severity === 'critical') {
    // قرارات حرجة
    decisions.push(...generateCriticalDecisions(currentAnalysis, bottleneck))
  }

  // 2. التحقق من تنبؤات ازدحام عالي
  const highCongestionPrediction = predictions.find(p => p.predictedIndex >= 70)
  if (highCongestionPrediction) {
    decisions.push(...generatePreventiveDecisions(currentAnalysis, highCongestionPrediction))
  }

  // 3. ترتيب القرارات حسب الفائدة
  return decisions.sort((a, b) => b.expectedBenefitScore - a.expectedBenefitScore)
}

/**
 * توليد قرارات حرجة
 */
function generateCriticalDecisions(
  analysis: TrafficAnalysis,
  bottleneck: Bottleneck | null
): TrafficDecision[] {
  const decisions: TrafficDecision[] = []

  // 1. تحويل مروري
  if (bottleneck) {
    decisions.push({
      id: `diversion-${Date.now()}`,
      segmentId: analysis.segmentId,
      decisionType: 'diversion',
      recommendedAt: new Date(),
      expectedDelayReduction: calculateDiversionBenefit(analysis, bottleneck),
      expectedBenefitScore: 85,
      affectedSegments: bottleneck.affectedSegments,
      details: {
        description: `تحويل مروري بسبب ازدحام حرج على ${analysis.segmentId}`,
        implementation: 'تفعيل لوحات التحويل الإلكترونية',
        duration: 5,
      },
      priority: 'critical',
    })
  }

  // 2. ضبط إشارات
  decisions.push({
    id: `signal-${Date.now()}`,
    segmentId: analysis.segmentId,
    decisionType: 'signal_adjustment',
    recommendedAt: new Date(),
    expectedDelayReduction: calculateSignalBenefit(analysis),
    expectedBenefitScore: 70,
    affectedSegments: [analysis.segmentId],
    details: {
      description: 'ضبط توقيت الإشارات المرورية',
      implementation: 'زيادة وقت الإشارة الخضراء للاتجاه المزدحم',
      duration: 2,
    },
    priority: 'high',
  })

  return decisions
}

/**
 * توليد قرارات وقائية
 */
function generatePreventiveDecisions(
  analysis: TrafficAnalysis,
  prediction: Prediction
): TrafficDecision[] {
  const decisions: TrafficDecision[] = []

  // قرارات وقائية قبل حدوث الازدحام
  if (prediction.predictedIndex >= 70 && prediction.confidence > 0.7) {
    decisions.push({
      id: `preventive-${Date.now()}`,
      segmentId: analysis.segmentId,
      decisionType: 'intervention',
      recommendedAt: new Date(),
      expectedDelayReduction: prediction.predictedDelayMinutes * 0.5, // تقليل 50% من التأخير المتوقع
      expectedBenefitScore: 75,
      affectedSegments: [analysis.segmentId],
      details: {
        description: `تدخل وقائي قبل ازدحام متوقع خلال ${Math.round((prediction.predictedFor.getTime() - Date.now()) / 60000)} دقيقة`,
        implementation: 'تفعيل مسارات بديلة وتنبيهات للسائقين',
        duration: 10,
      },
      priority: 'high',
    })
  }

  return decisions
}

/**
 * حساب فائدة التحويل المروري
 */
function calculateDiversionBenefit(
  analysis: TrafficAnalysis,
  bottleneck: Bottleneck
): number {
  // تقليل التأخير بناءً على شدة الازدحام
  const baseReduction = analysis.delayMinutes * 0.4 // تقليل 40% أساسي
  
  // زيادة الفائدة بناءً على شدة الاختناق
  const severityMultiplier = {
    critical: 1.5,
    high: 1.3,
    medium: 1.1,
    low: 1.0,
  }[bottleneck.severity]

  return Math.round((baseReduction * severityMultiplier) * 10) / 10
}

/**
 * حساب فائدة ضبط الإشارات
 */
function calculateSignalBenefit(analysis: TrafficAnalysis): number {
  // ضبط الإشارات أكثر فعالية في الازدحام المتوسط
  if (analysis.congestionIndex >= 50 && analysis.congestionIndex < 80) {
    return Math.round(analysis.delayMinutes * 0.3 * 10) / 10 // تقليل 30%
  }
  
  return Math.round(analysis.delayMinutes * 0.15 * 10) / 10 // تقليل 15% في حالات أخرى
}

/**
 * اختيار أفضل قرار من مجموعة قرارات
 */
export function selectBestDecision(decisions: TrafficDecision[]): TrafficDecision | null {
  if (decisions.length === 0) return null

  // اختيار القرار بأعلى درجة فائدة
  return decisions.reduce((best, current) =>
    current.expectedBenefitScore > best.expectedBenefitScore ? current : best
  )
}

/**
 * حساب التأثير الإجمالي للقرارات
 */
export function calculateTotalImpact(decisions: TrafficDecision[]): {
  totalDelayReduction: number
  totalBenefitScore: number
  affectedSegmentsCount: number
} {
  const totalDelayReduction = decisions.reduce(
    (sum, d) => sum + d.expectedDelayReduction,
    0
  )
  
  const totalBenefitScore = decisions.reduce(
    (sum, d) => sum + d.expectedBenefitScore,
    0
  ) / decisions.length

  const affectedSegments = new Set<string>()
  decisions.forEach(d => {
    d.affectedSegments.forEach(s => affectedSegments.add(s))
  })

  return {
    totalDelayReduction: Math.round(totalDelayReduction * 10) / 10,
    totalBenefitScore: Math.round(totalBenefitScore * 10) / 10,
    affectedSegmentsCount: affectedSegments.size,
  }
}

