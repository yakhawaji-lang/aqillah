/**
 * Driving Decision Engine - محرك قرارات قيادة
 */

import { WeatherResponse } from '@/lib/services/weather'
import { RiskOutput } from './risk-engine'
import { PredictionOutput } from './prediction-engine'

export interface DrivingDecision {
  action: 'continue' | 'slow_down' | 'reroute' | 'delay' | 'stop'
  confidence: number // 0-1
  reason: string
  details: {
    suggestedSpeed?: number
    alternativeRoute?: {
      distance: number
      duration: number
    }
    delayMinutes?: number
    stopReason?: string
  }
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface DecisionInput {
  weather: WeatherResponse['current']
  traffic: {
    congestionIndex: number
    avgSpeed: number
  }
  vehicle?: {
    speed: number
    roadType?: 'highway' | 'urban' | 'rural'
  }
  route: {
    distance: number
    duration: number
  }
  riskScore: RiskOutput
  predictions: PredictionOutput
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

class DrivingDecisionEngine {
  /**
   * Make driving decision
   */
  decide(input: DecisionInput): DrivingDecision {
    // Critical conditions - STOP
    if (this.shouldStop(input)) {
      return {
        action: 'stop',
        confidence: 0.95,
        reason: 'ظروف خطيرة جداً - لا تقود',
        details: {
          stopReason: this.getStopReason(input),
        },
        priority: 'critical',
      }
    }

    // High risk - REROUTE
    if (this.shouldReroute(input)) {
      return {
        action: 'reroute',
        confidence: 0.85,
        reason: 'مسار بديل أكثر أماناً',
        details: {
          alternativeRoute: {
            distance: input.route.distance * 1.2, // Estimate
            duration: input.route.duration * 0.9, // Faster but longer
          },
        },
        priority: 'high',
      }
    }

    // Medium risk - DELAY
    if (this.shouldDelay(input)) {
      const delayMinutes = this.calculateDelay(input)
      return {
        action: 'delay',
        confidence: 0.7,
        reason: `تأجيل الرحلة ${delayMinutes} دقيقة لظروف أفضل`,
        details: {
          delayMinutes,
        },
        priority: 'medium',
      }
    }

    // Low risk - SLOW DOWN
    if (this.shouldSlowDown(input)) {
      const suggestedSpeed = this.calculateSafeSpeed(input)
      return {
        action: 'slow_down',
        confidence: 0.8,
        reason: 'تقليل السرعة للظروف الحالية',
        details: {
          suggestedSpeed,
        },
        priority: 'medium',
      }
    }

    // Safe - CONTINUE
    return {
      action: 'continue',
      confidence: 0.9,
      reason: 'ظروف قيادة آمنة',
      details: {},
      priority: 'low',
    }
  }

  /**
   * Check if should stop
   */
  private shouldStop(input: DecisionInput): boolean {
    // Critical visibility
    if (input.weather.visibility < 50) return true

    // Critical risk score
    if (input.riskScore.riskLevel === 'critical' && input.riskScore.riskScore > 90) return true

    // Critical predictions
    const criticalPredictions = input.predictions.predictions.filter(
      (p) => p.severity === 'critical' && p.probability > 0.8
    )
    if (criticalPredictions.length > 0) return true

    // Extreme weather
    if (input.weather.rainRate > 30 || input.weather.windSpeed > 60) return true

    return false
  }

  /**
   * Check if should reroute
   */
  private shouldReroute(input: DecisionInput): boolean {
    // High risk score
    if (input.riskScore.riskLevel === 'high' || input.riskScore.riskLevel === 'critical') {
      return true
    }

    // High congestion
    if (input.traffic.congestionIndex > 85) return true

    // Multiple high-risk predictions
    const highRiskPredictions = input.predictions.predictions.filter(
      (p) => (p.severity === 'high' || p.severity === 'critical') && p.probability > 0.6
    )
    if (highRiskPredictions.length >= 2) return true

    return false
  }

  /**
   * Check if should delay
   */
  private shouldDelay(input: DecisionInput): boolean {
    // Medium risk with improving conditions
    if (input.riskScore.riskLevel === 'medium' && input.predictions.predictions.length > 0) {
      const nearTermPredictions = input.predictions.predictions.filter((p) => p.timeframe <= 60)
      if (nearTermPredictions.some((p) => p.probability > 0.5 && p.severity === 'high')) {
        return true
      }
    }

    return false
  }

  /**
   * Check if should slow down
   */
  private shouldSlowDown(input: DecisionInput): boolean {
    if (!input.vehicle) return false

    const safeSpeed = this.calculateSafeSpeed(input)
    return input.vehicle.speed > safeSpeed * 1.1 // 10% over safe speed
  }

  /**
   * Calculate safe speed
   */
  private calculateSafeSpeed(input: DecisionInput): number {
    let safeSpeed = 100 // Default

    // Reduce for visibility
    if (input.weather.visibility < 200) {
      safeSpeed = 30
    } else if (input.weather.visibility < 500) {
      safeSpeed = 50
    }

    // Reduce for rain
    if (input.weather.rainRate > 10) {
      safeSpeed -= 30
    } else if (input.weather.rainRate > 5) {
      safeSpeed -= 20
    }

    // Reduce for wind
    if (input.weather.windSpeed > 40) {
      safeSpeed -= 20
    }

    // Reduce for congestion
    if (input.traffic.congestionIndex > 70) {
      safeSpeed = Math.min(safeSpeed, input.traffic.avgSpeed + 10)
    }

    return Math.max(safeSpeed, 30)
  }

  /**
   * Calculate delay minutes
   */
  private calculateDelay(input: DecisionInput): number {
    // Find worst prediction timeframe
    const worstPrediction = input.predictions.predictions
      .filter((p) => p.severity === 'high' || p.severity === 'critical')
      .sort((a, b) => b.timeframe - a.timeframe)[0]

    if (worstPrediction) {
      return worstPrediction.timeframe + 15 // Add buffer
    }

    return 30 // Default delay
  }

  /**
   * Get stop reason
   */
  private getStopReason(input: DecisionInput): string {
    if (input.weather.visibility < 50) {
      return 'رؤية خطيرة جداً'
    }
    if (input.weather.rainRate > 30) {
      return 'أمطار غزيرة جداً'
    }
    if (input.weather.windSpeed > 60) {
      return 'رياح قوية جداً'
    }
    return 'ظروف خطيرة'
  }
}

export const drivingDecisionEngine = new DrivingDecisionEngine()

