/**
 * Weather Driving Assistant - مركز الطقس الذكي للسائق
 * يحول بيانات الطقس إلى "تأثير على القيادة"
 */

import { WeatherResponse } from '@/lib/services/weather'

export interface DrivingImpact {
  temperature: {
    value: number
    impact: 'safe' | 'caution' | 'warning' | 'danger'
    message: string
    roadEffect: string
  }
  wind: {
    speed: number
    impact: 'safe' | 'caution' | 'warning' | 'danger'
    message: string
    controlEffect: string
  }
  rain: {
    rate: number
    impact: 'safe' | 'caution' | 'warning' | 'danger'
    message: string
    hydroplaningRisk: number // 0-100
  }
  visibility: {
    distance: number
    impact: 'safe' | 'caution' | 'warning' | 'danger'
    message: string
    recommendation: string
  }
  overall: {
    safetyScore: number // 0-100
    level: 'safe' | 'caution' | 'warning' | 'danger'
    summary: string
    recommendations: string[]
  }
}

class WeatherDrivingAssistant {
  /**
   * Analyze weather impact on driving
   */
  analyze(weather: WeatherResponse['current']): DrivingImpact {
    const temperature = this.analyzeTemperature(weather.temperature)
    const wind = this.analyzeWind(weather.windSpeed, weather.windDirection)
    const rain = this.analyzeRain(weather.rainRate, weather.precipitation)
    const visibility = this.analyzeVisibility(weather.visibility, weather.condition)

    // Calculate overall safety score
    const safetyScore = this.calculateSafetyScore([temperature, wind, rain, visibility])
    const level = this.getSafetyLevel(safetyScore)
    const summary = this.generateSummary(level, { temperature, wind, rain, visibility })
    const recommendations = this.generateRecommendations({ temperature, wind, rain, visibility })

    return {
      temperature,
      wind,
      rain,
      visibility,
      overall: {
        safetyScore,
        level,
        summary,
        recommendations,
      },
    }
  }

  /**
   * Analyze temperature impact
   */
  private analyzeTemperature(temp: number): DrivingImpact['temperature'] {
    let impact: 'safe' | 'caution' | 'warning' | 'danger' = 'safe'
    let message = 'درجة حرارة مناسبة'
    let roadEffect = 'حالة الطريق طبيعية'

    if (temp > 45) {
      impact = 'danger'
      message = 'حرارة عالية جداً'
      roadEffect = 'قد يؤثر على الإطارات والفرامل - خطر انفجار إطارات'
    } else if (temp > 40) {
      impact = 'warning'
      message = 'حرارة عالية'
      roadEffect = 'قد يؤثر على أداء المركبة'
    } else if (temp < 0) {
      impact = 'danger'
      message = 'درجة حرارة تحت الصفر'
      roadEffect = 'خطر تجمد الطريق - استخدم إطارات شتوية'
    } else if (temp < 5) {
      impact = 'warning'
      message = 'درجة حرارة منخفضة'
      roadEffect = 'احذر من الجليد على الطريق'
    }

    return {
      value: temp,
      impact,
      message,
      roadEffect,
    }
  }

  /**
   * Analyze wind impact
   */
  private analyzeWind(speed: number, direction: number): DrivingImpact['wind'] {
    let impact: 'safe' | 'caution' | 'warning' | 'danger' = 'safe'
    let message = 'رياح خفيفة'
    let controlEffect = 'لا تأثير على التحكم'

    if (speed > 50) {
      impact = 'danger'
      message = 'رياح قوية جداً'
      controlEffect = 'تأثير شديد على التحكم - خطر للشاحنات والمركبات المرتفعة'
    } else if (speed > 40) {
      impact = 'warning'
      message = 'رياح قوية'
      controlEffect = 'تأثير على التحكم - يُنصح بتقليل السرعة'
    } else if (speed > 30) {
      impact = 'caution'
      message = 'رياح متوسطة'
      controlEffect = 'تأثير طفيف على التحكم'
    }

    return {
      speed,
      impact,
      message,
      controlEffect,
    }
  }

  /**
   * Analyze rain impact
   */
  private analyzeRain(rate: number, precipitation: number): DrivingImpact['rain'] {
    let impact: 'safe' | 'caution' | 'warning' | 'danger' = 'safe'
    let message = 'لا أمطار'
    let hydroplaningRisk = 0

    if (rate > 20) {
      impact = 'danger'
      message = 'أمطار غزيرة جداً'
      hydroplaningRisk = 90
    } else if (rate > 10) {
      impact = 'warning'
      message = 'أمطار غزيرة'
      hydroplaningRisk = 60
    } else if (rate > 5) {
      impact = 'caution'
      message = 'أمطار متوسطة'
      hydroplaningRisk = 30
    } else if (rate > 0) {
      impact = 'safe'
      message = 'أمطار خفيفة'
      hydroplaningRisk = 10
    }

    return {
      rate,
      impact,
      message,
      hydroplaningRisk,
    }
  }

  /**
   * Analyze visibility impact
   */
  private analyzeVisibility(distance: number, condition: string): DrivingImpact['visibility'] {
    let impact: 'safe' | 'caution' | 'warning' | 'danger' = 'safe'
    let message = 'رؤية ممتازة'
    let recommendation = ''

    if (distance < 50) {
      impact = 'danger'
      message = 'رؤية خطيرة جداً'
      recommendation = 'توقف فوراً - لا تقود في هذه الظروف'
    } else if (distance < 100) {
      impact = 'danger'
      message = 'رؤية خطيرة'
      recommendation = 'تقليل السرعة إلى أقل من 30 كم/س - استخدم المصابيح الأمامية'
    } else if (distance < 200) {
      impact = 'warning'
      message = 'رؤية منخفضة'
      recommendation = 'تقليل السرعة - استخدم المصابيح الأمامية والضبابية'
    } else if (distance < 500) {
      impact = 'caution'
      message = 'رؤية متوسطة'
      recommendation = 'احذر من انخفاض الرؤية'
    }

    return {
      distance,
      impact,
      message,
      recommendation,
    }
  }

  /**
   * Calculate overall safety score
   */
  private calculateSafetyScore(impacts: Array<{ impact: string }>): number {
    const weights: Record<string, number> = {
      danger: 20,
      warning: 50,
      caution: 75,
      safe: 100,
    }

    const scores = impacts.map((i) => weights[i.impact] || 100)
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  /**
   * Get safety level
   */
  private getSafetyLevel(score: number): 'safe' | 'caution' | 'warning' | 'danger' {
    if (score < 30) return 'danger'
    if (score < 50) return 'warning'
    if (score < 75) return 'caution'
    return 'safe'
  }

  /**
   * Generate summary
   */
  private generateSummary(
    level: string,
    impacts: {
      temperature: DrivingImpact['temperature']
      wind: DrivingImpact['wind']
      rain: DrivingImpact['rain']
      visibility: DrivingImpact['visibility']
    }
  ): string {
    const critical = [
      impacts.temperature.impact === 'danger' && impacts.temperature.message,
      impacts.wind.impact === 'danger' && impacts.wind.message,
      impacts.rain.impact === 'danger' && impacts.rain.message,
      impacts.visibility.impact === 'danger' && impacts.visibility.message,
    ].filter(Boolean)

    if (critical.length > 0) {
      return `⚠️ ظروف خطيرة: ${critical.join('، ')}`
    }

    if (level === 'warning') {
      return '⚠️ ظروف قيادة صعبة - يُنصح بالحذر'
    }

    if (level === 'caution') {
      return '⚠️ ظروف قيادة متوسطة - انتبه'
    }

    return '✅ ظروف قيادة آمنة'
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(impacts: {
    temperature: DrivingImpact['temperature']
    wind: DrivingImpact['wind']
    rain: DrivingImpact['rain']
    visibility: DrivingImpact['visibility']
  }): string[] {
    const recommendations: string[] = []

    if (impacts.visibility.impact === 'danger' || impacts.visibility.impact === 'warning') {
      recommendations.push(impacts.visibility.recommendation)
    }

    if (impacts.rain.hydroplaningRisk > 50) {
      recommendations.push('تقليل السرعة لتجنب الانزلاق المائي')
    }

    if (impacts.wind.impact === 'danger' || impacts.wind.impact === 'warning') {
      recommendations.push(impacts.wind.controlEffect)
    }

    if (impacts.temperature.impact === 'danger') {
      recommendations.push(impacts.temperature.roadEffect)
    }

    return recommendations
  }
}

export const weatherDrivingAssistant = new WeatherDrivingAssistant()

