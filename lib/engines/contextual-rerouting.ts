/**
 * Contextual Rerouting Engine - تحويل المسارات بالسياق الذكي
 * ليس فقط بسبب الزحمة، بل بسبب الطقس والأحداث
 */

import { WeatherResponse } from '@/lib/services/weather'
import { RiskOutput } from './risk-engine'

export interface ReroutingContext {
  weather: WeatherResponse['current']
  traffic: {
    congestionIndex: number
    avgSpeed: number
  }
  incidents?: Array<{
    type: 'accident' | 'construction' | 'event' | 'weather'
    severity: 'low' | 'medium' | 'high' | 'critical'
    location: { lat: number; lng: number }
  }>
  riskScore?: RiskOutput
}

export interface ReroutingDecision {
  shouldReroute: boolean
  reason: string[]
  priority: 'low' | 'medium' | 'high' | 'critical'
  alternativeRoute?: {
    distance: number
    duration: number
    benefits: string[]
  }
}

class ContextualReroutingEngine {
  /**
   * Decide if rerouting is needed
   */
  decide(context: ReroutingContext): ReroutingDecision {
    const reasons: string[] = []
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low'
    let shouldReroute = false

    // Check weather conditions
    const weatherReasons = this.checkWeather(context.weather)
    if (weatherReasons.length > 0) {
      reasons.push(...weatherReasons)
      shouldReroute = true
      priority = this.getWeatherPriority(context.weather)
    }

    // Check traffic
    if (context.traffic.congestionIndex > 80) {
      reasons.push('ازدحام شديد')
      shouldReroute = true
      if (context.traffic.congestionIndex > 90) {
        priority = 'high'
      }
    }

    // Check incidents
    if (context.incidents && context.incidents.length > 0) {
      const criticalIncidents = context.incidents.filter((i) => i.severity === 'critical' || i.severity === 'high')
      if (criticalIncidents.length > 0) {
        reasons.push(`${criticalIncidents.length} حادث/حدث حرج`)
        shouldReroute = true
        priority = 'critical'
      }
    }

    // Check risk score
    if (context.riskScore && context.riskScore.riskLevel === 'critical') {
      reasons.push('مخاطر حرجة على المسار')
      shouldReroute = true
      priority = 'critical'
    }

    return {
      shouldReroute,
      reason: reasons,
      priority,
    }
  }

  /**
   * Check weather conditions
   */
  private checkWeather(weather: WeatherResponse['current']): string[] {
    const reasons: string[] = []

    // Heavy rain
    if (weather.rainRate > 10) {
      reasons.push('أمطار غزيرة')
    }

    // Low visibility
    if (weather.visibility < 200) {
      reasons.push('انخفاض الرؤية')
    }

    // Strong wind
    if (weather.windSpeed > 40) {
      reasons.push('رياح قوية')
    }

    // Extreme temperature
    if (weather.temperature > 45 || weather.temperature < 0) {
      reasons.push('درجة حرارة متطرفة')
    }

    // Dust/Sandstorm (if condition indicates)
    if (weather.condition.includes('dust') || weather.condition.includes('sand')) {
      reasons.push('عاصفة رملية')
    }

    return reasons
  }

  /**
   * Get weather priority
   */
  private getWeatherPriority(weather: WeatherResponse['current']): 'low' | 'medium' | 'high' | 'critical' {
    if (weather.visibility < 100 || weather.rainRate > 20 || weather.windSpeed > 50) {
      return 'critical'
    }
    if (weather.visibility < 200 || weather.rainRate > 10 || weather.windSpeed > 40) {
      return 'high'
    }
    if (weather.visibility < 500 || weather.rainRate > 5) {
      return 'medium'
    }
    return 'low'
  }

  /**
   * Generate rerouting message
   */
  generateMessage(decision: ReroutingDecision): string {
    if (!decision.shouldReroute) {
      return 'المسار الحالي آمن'
    }

    const reasons = decision.reason.join(' – ')
    return `🚥 تم تغيير المسار بسبب:\n${reasons}`
  }
}

export const contextualReroutingEngine = new ContextualReroutingEngine()

