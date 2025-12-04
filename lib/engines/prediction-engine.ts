/**
 * Risk Prediction Engine - محرك التنبؤ الذكي للمخاطر
 * يتوقع الخطر قبل وقوعه
 */

import { WeatherResponse } from '@/lib/services/weather'

export interface PredictionInput {
  weather: WeatherResponse['current']
  traffic: {
    congestionIndex: number
    avgSpeed: number
    density: number
  }
  vehicle?: {
    speed: number
    heading: number
    roadType?: 'highway' | 'urban' | 'rural'
  }
  location: {
    lat: number
    lng: number
  }
  historicalData?: {
    accidents: number
    incidents: number
  }
}

export interface PredictionOutput {
  predictions: Array<{
    type: 'hydroplaning' | 'fog' | 'sudden_congestion' | 'temperature_drop' | 'unsafe_speed' | 'wind_hazard'
    probability: number // 0-1
    severity: 'low' | 'medium' | 'high' | 'critical'
    timeframe: number // minutes
    message: string
    recommendation: string
  }>
  overallRisk: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

class PredictionEngine {
  /**
   * Predict risks
   */
  predict(input: PredictionInput): PredictionOutput {
    const predictions: PredictionOutput['predictions'] = []

    // 1. Hydroplaning prediction
    const hydroplaningRisk = this.predictHydroplaning(input)
    if (hydroplaningRisk.probability > 0.3) {
      predictions.push(hydroplaningRisk)
    }

    // 2. Fog prediction
    const fogRisk = this.predictFog(input)
    if (fogRisk.probability > 0.3) {
      predictions.push(fogRisk)
    }

    // 3. Sudden congestion
    const congestionRisk = this.predictSuddenCongestion(input)
    if (congestionRisk.probability > 0.4) {
      predictions.push(congestionRisk)
    }

    // 4. Temperature drop
    const tempDropRisk = this.predictTemperatureDrop(input)
    if (tempDropRisk.probability > 0.3) {
      predictions.push(tempDropRisk)
    }

    // 5. Unsafe speed
    const speedRisk = this.predictUnsafeSpeed(input)
    if (speedRisk.probability > 0.5) {
      predictions.push(speedRisk)
    }

    // 6. Wind hazard
    const windRisk = this.predictWindHazard(input)
    if (windRisk.probability > 0.3) {
      predictions.push(windRisk)
    }

    // Calculate overall risk
    const overallRisk = this.calculateOverallRisk(predictions)
    const riskLevel = this.getRiskLevel(overallRisk)

    return {
      predictions: predictions.sort((a, b) => b.probability - a.probability),
      overallRisk,
      riskLevel,
    }
  }

  /**
   * Predict hydroplaning risk
   */
  private predictHydroplaning(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { weather, vehicle, traffic } = input
    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Rain rate factor
    if (weather.rainRate > 0) {
      probability += Math.min(weather.rainRate / 20, 0.6) // Max 60% from rain
    }

    // Speed factor
    if (vehicle && vehicle.speed > 60) {
      probability += Math.min((vehicle.speed - 60) / 100, 0.4) // Max 40% from speed
    }

    // Road type factor
    if (vehicle?.roadType === 'highway') {
      probability += 0.1
    }

    // Determine severity
    if (probability > 0.7) severity = 'critical'
    else if (probability > 0.5) severity = 'high'
    else if (probability > 0.3) severity = 'medium'

    return {
      type: 'hydroplaning',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 5, // Next 5 minutes
      message: `احتمالية انزلاق مائي: ${(probability * 100).toFixed(0)}%`,
      recommendation: vehicle && vehicle.speed > 60
        ? 'يُنصح بتقليل السرعة إلى أقل من 60 كم/س'
        : 'احذر من الانزلاق المائي',
    }
  }

  /**
   * Predict fog
   */
  private predictFog(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { weather } = input
    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Visibility factor
    if (weather.visibility < 1000) {
      probability = 1 - (weather.visibility / 1000)
    }

    // Humidity factor
    if (weather.humidity > 80) {
      probability += 0.2
    }

    // Temperature factor (fog more likely at specific temps)
    if (weather.temperature > 0 && weather.temperature < 15) {
      probability += 0.1
    }

    // Determine severity
    if (weather.visibility < 100) severity = 'critical'
    else if (weather.visibility < 200) severity = 'high'
    else if (weather.visibility < 500) severity = 'medium'

    return {
      type: 'fog',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 15, // Next 15 minutes
      message: `احتمالية ضباب: ${(probability * 100).toFixed(0)}% - الرؤية: ${weather.visibility.toFixed(0)}م`,
      recommendation: weather.visibility < 200
        ? 'يُنصح بتقليل السرعة واستخدام المصابيح الأمامية'
        : 'احذر من انخفاض الرؤية',
    }
  }

  /**
   * Predict sudden congestion
   */
  private predictSuddenCongestion(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { traffic, historicalData } = input
    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Current congestion
    if (traffic.congestionIndex > 70) {
      probability += 0.4
    }

    // Speed drop
    if (traffic.avgSpeed < 30) {
      probability += 0.3
    }

    // Historical incidents
    if (historicalData && historicalData.incidents > 0) {
      probability += Math.min(historicalData.incidents / 10, 0.3)
    }

    // Determine severity
    if (traffic.congestionIndex > 85) severity = 'critical'
    else if (traffic.congestionIndex > 70) severity = 'high'
    else if (traffic.congestionIndex > 50) severity = 'medium'

    return {
      type: 'sudden_congestion',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 10, // Next 10 minutes
      message: `احتمالية ازدحام مفاجئ: ${(probability * 100).toFixed(0)}%`,
      recommendation: 'يُنصح بالنظر في مسار بديل',
    }
  }

  /**
   * Predict temperature drop
   */
  private predictTemperatureDrop(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { weather } = input
    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Current temperature
    if (weather.temperature < 5) {
      probability = 0.6
    } else if (weather.temperature < 10) {
      probability = 0.3
    }

    // Precipitation increases risk
    if (weather.precipitation > 0 && weather.temperature < 3) {
      probability += 0.3
      severity = 'critical'
    }

    return {
      type: 'temperature_drop',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 30, // Next 30 minutes
      message: `انخفاض حراري متوقع - الحرارة الحالية: ${weather.temperature.toFixed(1)}°م`,
      recommendation: weather.temperature < 3
        ? 'احذر من تجمد الطريق - استخدم إطارات شتوية'
        : 'احذر من انخفاض الحرارة',
    }
  }

  /**
   * Predict unsafe speed
   */
  private predictUnsafeSpeed(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { vehicle, weather, traffic } = input
    if (!vehicle) {
      return {
        type: 'unsafe_speed',
        probability: 0,
        severity: 'low',
        timeframe: 0,
        message: '',
        recommendation: '',
      }
    }

    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Speed vs conditions
    const safeSpeed = this.calculateSafeSpeed(weather, traffic)
    if (vehicle.speed > safeSpeed) {
      probability = Math.min((vehicle.speed - safeSpeed) / safeSpeed, 1)
    }

    // Determine severity
    const speedDiff = vehicle.speed - safeSpeed
    if (speedDiff > 30) severity = 'critical'
    else if (speedDiff > 20) severity = 'high'
    else if (speedDiff > 10) severity = 'medium'

    return {
      type: 'unsafe_speed',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 0, // Immediate
      message: `السرعة غير آمنة للظروف الحالية - السرعة الحالية: ${vehicle.speed} كم/س - الموصى بها: ${safeSpeed.toFixed(0)} كم/س`,
      recommendation: `يُنصح بتقليل السرعة إلى ${safeSpeed.toFixed(0)} كم/س`,
    }
  }

  /**
   * Predict wind hazard
   */
  private predictWindHazard(input: PredictionInput): PredictionOutput['predictions'][0] {
    const { weather } = input
    let probability = 0
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low'

    // Wind speed
    if (weather.windSpeed > 50) {
      probability = 0.8
      severity = 'critical'
    } else if (weather.windSpeed > 40) {
      probability = 0.6
      severity = 'high'
    } else if (weather.windSpeed > 30) {
      probability = 0.4
      severity = 'medium'
    }

    return {
      type: 'wind_hazard',
      probability: Math.min(probability, 1),
      severity,
      timeframe: 15, // Next 15 minutes
      message: `رياح قوية: ${weather.windSpeed.toFixed(0)} كم/س`,
      recommendation: weather.windSpeed > 40
        ? 'يُنصح بتقليل السرعة خاصة للشاحنات والمركبات المرتفعة'
        : 'احذر من تأثير الرياح على التحكم',
    }
  }

  /**
   * Calculate safe speed based on conditions
   */
  private calculateSafeSpeed(
    weather: PredictionInput['weather'],
    traffic: PredictionInput['traffic']
  ): number {
    let safeSpeed = 100 // Default highway speed

    // Reduce for rain
    if (weather.rainRate > 10) {
      safeSpeed -= 30
    } else if (weather.rainRate > 5) {
      safeSpeed -= 20
    }

    // Reduce for visibility
    if (weather.visibility < 100) {
      safeSpeed = 30
    } else if (weather.visibility < 200) {
      safeSpeed = Math.min(safeSpeed, 50)
    } else if (weather.visibility < 500) {
      safeSpeed = Math.min(safeSpeed, 70)
    }

    // Reduce for wind
    if (weather.windSpeed > 40) {
      safeSpeed -= 20
    } else if (weather.windSpeed > 30) {
      safeSpeed -= 10
    }

    // Reduce for congestion
    if (traffic.congestionIndex > 70) {
      safeSpeed = Math.min(safeSpeed, traffic.avgSpeed + 10)
    }

    return Math.max(safeSpeed, 30) // Minimum 30 km/h
  }

  /**
   * Calculate overall risk
   */
  private calculateOverallRisk(
    predictions: PredictionOutput['predictions']
  ): number {
    if (predictions.length === 0) return 0

    const weights: Record<string, number> = {
      critical: 1.0,
      high: 0.7,
      medium: 0.4,
      low: 0.2,
    }

    const weightedSum = predictions.reduce((sum, pred) => {
      return sum + pred.probability * weights[pred.severity] * 100
    }, 0)

    return Math.min(weightedSum / predictions.length, 100)
  }

  /**
   * Get risk level
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
  }
}

export const predictionEngine = new PredictionEngine()

