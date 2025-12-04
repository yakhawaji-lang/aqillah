/**
 * Risk Engine - محرك المخاطر
 * يحلل المخاطر بناءً على الطقس والمرور وبيانات المركبة
 */

import { WeatherResponse } from '@/lib/services/weather'

export interface RiskInput {
  // الطقس
  weather: WeatherResponse['current']
  
  // المرور
  traffic: {
    congestionIndex: number // 0-100
    avgSpeed: number // km/h
    density: number // vehicles/km
  }
  
  // المركبة
  vehicle?: {
    speed: number // km/h
    heading: number // degrees
    roadType?: 'highway' | 'urban' | 'rural'
  }
  
  // الموقع
  location: {
    lat: number
    lng: number
  }
  
  // الوقت
  timestamp: Date
}

export interface RiskOutput {
  riskScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskCategory: 'weather' | 'traffic' | 'road' | 'visibility' | 'combined'
  recommendedAction: 'continue' | 'slow_down' | 'reroute' | 'stop' | 'caution'
  confidence: number // 0-1
  factors: {
    weather: number
    traffic: number
    visibility: number
    speed: number
    combined: number
  }
  details: {
    primaryRisk: string
    secondaryRisks: string[]
    mitigation: string[]
  }
}

class RiskEngine {
  /**
   * Calculate risk score
   */
  calculateRisk(input: RiskInput): RiskOutput {
    // Calculate individual risk factors
    const weatherRisk = this.calculateWeatherRisk(input.weather)
    const trafficRisk = this.calculateTrafficRisk(input.traffic)
    const visibilityRisk = this.calculateVisibilityRisk(input.weather)
    const speedRisk = this.calculateSpeedRisk(input.vehicle, input.traffic)
    
    // Combine risks
    const combinedRisk = this.combineRisks({
      weather: weatherRisk,
      traffic: trafficRisk,
      visibility: visibilityRisk,
      speed: speedRisk,
    })
    
    // Determine risk level
    const riskLevel = this.getRiskLevel(combinedRisk)
    
    // Determine recommended action
    const recommendedAction = this.getRecommendedAction(combinedRisk, riskLevel)
    
    // Determine primary risk category
    const riskCategory = this.getRiskCategory({
      weather: weatherRisk,
      traffic: trafficRisk,
      visibility: visibilityRisk,
      speed: speedRisk,
    })
    
    // Calculate confidence
    const confidence = this.calculateConfidence(input)
    
    // Generate details
    const details = this.generateDetails(input, {
      weather: weatherRisk,
      traffic: trafficRisk,
      visibility: visibilityRisk,
      speed: speedRisk,
    })
    
    return {
      riskScore: Math.round(combinedRisk),
      riskLevel,
      riskCategory,
      recommendedAction,
      confidence,
      factors: {
        weather: weatherRisk,
        traffic: trafficRisk,
        visibility: visibilityRisk,
        speed: speedRisk,
        combined: combinedRisk,
      },
      details,
    }
  }
  
  /**
   * Calculate weather risk (0-100)
   */
  private calculateWeatherRisk(weather: RiskInput['weather']): number {
    let risk = 0
    
    // Rain rate
    if (weather.rainRate > 0) {
      risk += Math.min(weather.rainRate * 2, 40) // Max 40 points
    }
    
    // Wind speed
    if (weather.windSpeed > 30) {
      risk += Math.min((weather.windSpeed - 30) * 0.5, 20) // Max 20 points
    }
    
    // Temperature extremes
    if (weather.temperature > 45 || weather.temperature < 0) {
      risk += 15
    }
    
    // Condition
    const conditionRisk: Record<string, number> = {
      clear: 0,
      partly_cloudy: 5,
      cloudy: 10,
      rain: 30,
      heavy_rain: 50,
      snow: 40,
      fog: 60,
      storm: 70,
    }
    risk += conditionRisk[weather.condition] || 20
    
    return Math.min(risk, 100)
  }
  
  /**
   * Calculate traffic risk (0-100)
   */
  private calculateTrafficRisk(traffic: RiskInput['traffic']): number {
    let risk = 0
    
    // Congestion
    risk += traffic.congestionIndex * 0.5 // Max 50 points
    
    // Low speed indicates potential issues
    if (traffic.avgSpeed < 20) {
      risk += 30
    } else if (traffic.avgSpeed < 40) {
      risk += 15
    }
    
    // High density
    if (traffic.density > 50) {
      risk += Math.min((traffic.density - 50) * 0.5, 20) // Max 20 points
    }
    
    return Math.min(risk, 100)
  }
  
  /**
   * Calculate visibility risk (0-100)
   */
  private calculateVisibilityRisk(weather: RiskInput['weather']): number {
    if (weather.visibility >= 1000) return 0
    if (weather.visibility >= 500) return 20
    if (weather.visibility >= 200) return 40
    if (weather.visibility >= 100) return 60
    if (weather.visibility >= 50) return 80
    return 100
  }
  
  /**
   * Calculate speed risk (0-100)
   */
  private calculateSpeedRisk(
    vehicle: RiskInput['vehicle'],
    traffic: RiskInput['traffic']
  ): number {
    if (!vehicle) return 0
    
    let risk = 0
    
    // Speed vs traffic speed
    const speedDiff = vehicle.speed - traffic.avgSpeed
    if (speedDiff > 20) {
      risk += 30 // Driving too fast for conditions
    } else if (speedDiff < -20) {
      risk += 20 // Driving too slow (potential hazard)
    }
    
    // Absolute speed
    if (vehicle.speed > 120) {
      risk += 40
    } else if (vehicle.speed > 100) {
      risk += 20
    }
    
    // Road type consideration
    if (vehicle.roadType === 'highway' && vehicle.speed < 60) {
      risk += 15
    }
    
    return Math.min(risk, 100)
  }
  
  /**
   * Combine multiple risk factors
   */
  private combineRisks(factors: {
    weather: number
    traffic: number
    visibility: number
    speed: number
  }): number {
    // Weighted combination
    const weights = {
      weather: 0.25,
      traffic: 0.20,
      visibility: 0.35, // Visibility is critical
      speed: 0.20,
    }
    
    const combined =
      factors.weather * weights.weather +
      factors.traffic * weights.traffic +
      factors.visibility * weights.visibility +
      factors.speed * weights.speed
    
    // Add penalty for multiple high risks
    const highRisks = Object.values(factors).filter((r) => r > 50).length
    if (highRisks >= 2) {
      return Math.min(combined * 1.2, 100)
    }
    
    return Math.min(combined, 100)
  }
  
  /**
   * Get risk level from score
   */
  private getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical'
    if (score >= 60) return 'high'
    if (score >= 30) return 'medium'
    return 'low'
  }
  
  /**
   * Get recommended action
   */
  private getRecommendedAction(
    score: number,
    level: RiskOutput['riskLevel']
  ): RiskOutput['recommendedAction'] {
    if (level === 'critical') {
      return score > 90 ? 'stop' : 'reroute'
    }
    if (level === 'high') {
      return 'reroute'
    }
    if (level === 'medium') {
      return 'slow_down'
    }
    if (score > 20) {
      return 'caution'
    }
    return 'continue'
  }
  
  /**
   * Get primary risk category
   */
  private getRiskCategory(factors: {
    weather: number
    traffic: number
    visibility: number
    speed: number
  }): RiskOutput['riskCategory'] {
    const maxFactor = Math.max(
      factors.weather,
      factors.traffic,
      factors.visibility,
      factors.speed
    )
    
    if (factors.visibility === maxFactor) return 'visibility'
    if (factors.weather === maxFactor) return 'weather'
    if (factors.traffic === maxFactor) return 'traffic'
    if (factors.speed === maxFactor) return 'road'
    
    return 'combined'
  }
  
  /**
   * Calculate confidence level
   */
  private calculateConfidence(input: RiskInput): number {
    let confidence = 1.0
    
    // Reduce confidence if vehicle data is missing
    if (!input.vehicle) {
      confidence -= 0.2
    }
    
    // Reduce confidence if weather data is incomplete
    if (!input.weather.visibility || input.weather.visibility === 0) {
      confidence -= 0.1
    }
    
    return Math.max(confidence, 0.5)
  }
  
  /**
   * Generate risk details
   */
  private generateDetails(
    input: RiskInput,
    factors: {
      weather: number
      traffic: number
      visibility: number
      speed: number
    }
  ): RiskOutput['details'] {
    const primaryRisk = this.getPrimaryRisk(factors)
    const secondaryRisks = this.getSecondaryRisks(factors)
    const mitigation = this.getMitigation(input, factors)
    
    return {
      primaryRisk,
      secondaryRisks,
      mitigation,
    }
  }
  
  /**
   * Get primary risk description
   */
  private getPrimaryRisk(factors: {
    weather: number
    traffic: number
    visibility: number
    speed: number
  }): string {
    const maxFactor = Math.max(
      factors.weather,
      factors.traffic,
      factors.visibility,
      factors.speed
    )
    
    if (factors.visibility === maxFactor) {
      return 'انخفاض الرؤية'
    }
    if (factors.weather === maxFactor) {
      return 'ظروف طقس صعبة'
    }
    if (factors.traffic === maxFactor) {
      return 'ازدحام مروري'
    }
    if (factors.speed === maxFactor) {
      return 'سرعة غير مناسبة'
    }
    
    return 'مخاطر متعددة'
  }
  
  /**
   * Get secondary risks
   */
  private getSecondaryRisks(factors: {
    weather: number
    traffic: number
    visibility: number
    speed: number
  }): string[] {
    const risks: string[] = []
    
    if (factors.weather > 30 && factors.weather !== Math.max(...Object.values(factors))) {
      risks.push('ظروف طقس')
    }
    if (factors.traffic > 30 && factors.traffic !== Math.max(...Object.values(factors))) {
      risks.push('ازدحام')
    }
    if (factors.visibility > 30 && factors.visibility !== Math.max(...Object.values(factors))) {
      risks.push('رؤية')
    }
    if (factors.speed > 30 && factors.speed !== Math.max(...Object.values(factors))) {
      risks.push('سرعة')
    }
    
    return risks
  }
  
  /**
   * Get mitigation recommendations
   */
  private getMitigation(
    input: RiskInput,
    factors: {
      weather: number
      traffic: number
      visibility: number
      speed: number
    }
  ): string[] {
    const mitigation: string[] = []
    
    if (factors.visibility > 50) {
      mitigation.push('تقليل السرعة بسبب انخفاض الرؤية')
      mitigation.push('استخدام المصابيح الأمامية')
    }
    
    if (factors.weather > 50) {
      mitigation.push('الحذر من الطرق الزلقة')
      mitigation.push('زيادة مسافة الأمان')
    }
    
    if (factors.traffic > 50) {
      mitigation.push('النظر في مسار بديل')
    }
    
    if (factors.speed > 50 && input.vehicle) {
      mitigation.push('تقليل السرعة لتناسب الظروف')
    }
    
    return mitigation
  }
}

export const riskEngine = new RiskEngine()

