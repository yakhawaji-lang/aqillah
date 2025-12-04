/**
 * محرك التنبؤ الذكي (Prediction Engine)
 * 
 * التنبؤ بالاختناق قبل حدوثه بـ:
 * - 5 دقائق
 * - 10 دقائق
 * - 30 دقيقة
 * - 60 دقيقة
 * 
 * باستخدام:
 * - نماذج زمنية
 * - تعلم آلي
 * - تحليل موسمية
 */

import { TrafficAnalysis } from './traffic-intelligence'

export interface Prediction {
  segmentId: string
  predictedAt: Date
  predictedFor: Date // 5, 10, 30, 60 دقيقة
  predictedIndex: number // 0-100
  predictedDelayMinutes: number
  confidence: number // 0-1
  modelType: 'temporal' | 'ml' | 'seasonal'
  seasonalityFactor: number
  factors: {
    currentCongestion: number
    historicalPattern: number
    timeOfDay: number
    dayOfWeek: number
    trend: 'increasing' | 'decreasing' | 'stable'
  }
}

const PREDICTION_HORIZONS = [5, 10, 30, 60] // دقائق

/**
 * توليد تنبؤات متعددة الأفق الزمني
 */
export function generatePredictions(
  currentAnalysis: TrafficAnalysis,
  historicalData: TrafficAnalysis[],
  timestamp: Date = new Date()
): Prediction[] {
  const predictions: Prediction[] = []

  for (const horizon of PREDICTION_HORIZONS) {
    const predictedFor = new Date(timestamp.getTime() + horizon * 60 * 1000)

    // اختيار النموذج المناسب حسب الأفق الزمني
    let prediction: Prediction

    if (horizon <= 10) {
      // نماذج زمنية للتنبؤات القصيرة
      prediction = temporalModelPrediction(
        currentAnalysis,
        historicalData,
        horizon
      )
    } else if (horizon <= 30) {
      // نماذج تعلم آلي للتنبؤات المتوسطة
      prediction = machineLearningPrediction(
        currentAnalysis,
        historicalData,
        horizon
      )
    } else {
      // تحليل موسمية للتنبؤات الطويلة
      prediction = seasonalPrediction(
        currentAnalysis,
        historicalData,
        horizon,
        timestamp
      )
    }

    predictions.push(prediction)
  }

  return predictions
}

/**
 * نموذج زمني للتنبؤات القصيرة (5-10 دقائق)
 */
function temporalModelPrediction(
  current: TrafficAnalysis,
  historical: TrafficAnalysis[],
  horizon: number
): Prediction {
  // حساب الاتجاه من البيانات التاريخية
  const recentData = historical.slice(-5) // آخر 5 نقاط
  const trend = calculateTrend(recentData)

  // التنبؤ بناءً على الاتجاه الحالي
  let predictedIndex = current.congestionIndex
  let predictedDelay = current.delayMinutes

  if (trend === 'increasing') {
    // زيادة متوقعة
    const increaseRate = horizon / 10 // معدل الزيادة
    predictedIndex = Math.min(100, current.congestionIndex + increaseRate * 10)
    predictedDelay = current.delayMinutes * (1 + increaseRate * 0.3)
  } else if (trend === 'decreasing') {
    // انخفاض متوقع
    const decreaseRate = horizon / 15
    predictedIndex = Math.max(0, current.congestionIndex - decreaseRate * 5)
    predictedDelay = Math.max(0, current.delayMinutes * (1 - decreaseRate * 0.2))
  }

  // الثقة عالية للتنبؤات القصيرة
  const confidence = 0.85 - (horizon / 100)

  return {
    segmentId: current.segmentId,
    predictedAt: new Date(),
    predictedFor: new Date(Date.now() + horizon * 60 * 1000),
    predictedIndex: Math.round(predictedIndex),
    predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
    confidence: Math.max(0.5, Math.min(1, confidence)),
    modelType: 'temporal',
    seasonalityFactor: 1.0,
    factors: {
      currentCongestion: current.congestionIndex,
      historicalPattern: calculateHistoricalPattern(historical, horizon),
      timeOfDay: getTimeOfDayFactor(new Date()),
      dayOfWeek: getDayOfWeekFactor(new Date()),
      trend,
    },
  }
}

/**
 * نموذج تعلم آلي للتنبؤات المتوسطة (10-30 دقيقة)
 */
function machineLearningPrediction(
  current: TrafficAnalysis,
  historical: TrafficAnalysis[],
  horizon: number
): Prediction {
  // محاكاة نموذج ML مبسط
  // في الإنتاج، سيتم استخدام نموذج مدرب فعلي

  const features = extractFeatures(current, historical)
  
  // تنبؤ مبسط بناءً على الميزات
  const mlPrediction = features.reduce((sum, f) => sum + f.weight * f.value, 0)
  const predictedIndex = Math.min(100, Math.max(0, current.congestionIndex + mlPrediction))
  
  const predictedDelay = (predictedIndex / 100) * 15 // تقدير التأخير

  return {
    segmentId: current.segmentId,
    predictedAt: new Date(),
    predictedFor: new Date(Date.now() + horizon * 60 * 1000),
    predictedIndex: Math.round(predictedIndex),
    predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
    confidence: 0.75,
    modelType: 'ml',
    seasonalityFactor: 1.0,
    factors: {
      currentCongestion: current.congestionIndex,
      historicalPattern: calculateHistoricalPattern(historical, horizon),
      timeOfDay: getTimeOfDayFactor(new Date()),
      dayOfWeek: getDayOfWeekFactor(new Date()),
      trend: 'stable',
    },
  }
}

/**
 * تحليل موسمية للتنبؤات الطويلة (30-60 دقيقة)
 */
function seasonalPrediction(
  current: TrafficAnalysis,
  historical: TrafficAnalysis[],
  horizon: number,
  timestamp: Date
): Prediction {
  // حساب عامل الموسمية
  const seasonalityFactor = calculateSeasonalityFactor(timestamp, horizon)
  
  // التنبؤ بناءً على الأنماط الموسمية
  const basePrediction = current.congestionIndex * seasonalityFactor
  const predictedIndex = Math.min(100, Math.max(0, basePrediction))
  const predictedDelay = (predictedIndex / 100) * 20

  return {
    segmentId: current.segmentId,
    predictedAt: new Date(),
    predictedFor: new Date(Date.now() + horizon * 60 * 1000),
    predictedIndex: Math.round(predictedIndex),
    predictedDelayMinutes: Math.round(predictedDelay * 10) / 10,
    confidence: 0.65, // ثقة أقل للتنبؤات الطويلة
    modelType: 'seasonal',
    seasonalityFactor,
    factors: {
      currentCongestion: current.congestionIndex,
      historicalPattern: calculateHistoricalPattern(historical, horizon),
      timeOfDay: getTimeOfDayFactor(timestamp),
      dayOfWeek: getDayOfWeekFactor(timestamp),
      trend: 'stable',
    },
  }
}

// دوال مساعدة

function calculateTrend(data: TrafficAnalysis[]): 'increasing' | 'decreasing' | 'stable' {
  if (data.length < 2) return 'stable'
  
  const first = data[0].congestionIndex
  const last = data[data.length - 1].congestionIndex
  
  const diff = last - first
  
  if (diff > 5) return 'increasing'
  if (diff < -5) return 'decreasing'
  return 'stable'
}

function calculateHistoricalPattern(historical: TrafficAnalysis[], horizon: number): number {
  if (historical.length === 0) return 50
  
  // متوسط الازدحام في نفس الوقت تقريباً
  const avg = historical.reduce((sum, h) => sum + h.congestionIndex, 0) / historical.length
  return avg
}

function getTimeOfDayFactor(date: Date): number {
  const hour = date.getHours()
  
  // أوقات الذروة: 7-9 صباحاً، 5-7 مساءً
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    return 1.3 // زيادة 30%
  }
  
  return 1.0
}

function getDayOfWeekFactor(date: Date): number {
  const day = date.getDay()
  
  // نهاية الأسبوع أقل ازدحاماً
  if (day === 0 || day === 6) {
    return 0.8
  }
  
  return 1.0
}

function calculateSeasonalityFactor(timestamp: Date, horizon: number): number {
  // عوامل موسمية مبسطة
  const hour = timestamp.getHours()
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)
  
  if (isRushHour) {
    return 1.2 // زيادة متوقعة في أوقات الذروة
  }
  
  return 1.0
}

function extractFeatures(
  current: TrafficAnalysis,
  historical: TrafficAnalysis[]
): Array<{ value: number; weight: number }> {
  // استخراج ميزات للتعلم الآلي
  return [
    { value: current.congestionIndex, weight: 0.4 },
    { value: current.density, weight: 0.3 },
    { value: current.avgSpeed, weight: 0.2 },
    { value: historical.length > 0 ? historical[historical.length - 1].congestionIndex : 50, weight: 0.1 },
  ]
}

