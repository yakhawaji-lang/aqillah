/**
 * Severe Conditions Alerts - تنبيهات الأحداث الكبرى
 */

import { WeatherResponse } from '@/lib/services/weather'

export interface SevereAlert {
  type: 'storm' | 'heavy_rain' | 'extreme_heat' | 'strong_wind' | 'dust_storm' | 'official_warning'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  impact: string[]
  recommendations: string[]
  validUntil: Date
}

class SevereConditionsAlerts {
  /**
   * Check for severe conditions
   */
  check(weather: WeatherResponse['current'], alerts?: WeatherResponse['alerts']): SevereAlert[] {
    const severeAlerts: SevereAlert[] = []

    // Check weather alerts from API
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert) => {
        const mappedSeverity = this.mapSeverity(alert.severity)
        severeAlerts.push({
          type: this.mapAlertType(alert.severity),
          severity: mappedSeverity,
          title: alert.title,
          message: alert.description,
          impact: this.getImpact(mappedSeverity),
          recommendations: this.getRecommendations(mappedSeverity),
          validUntil: alert.endTime,
        })
      })
    }

    // Check for storms
    if (weather.condition.includes('storm') || weather.rainRate > 20) {
      severeAlerts.push({
        type: 'storm',
        severity: weather.rainRate > 30 ? 'critical' : 'high',
        title: 'عاصفة رعدية',
        message: `أمطار غزيرة: ${weather.rainRate.toFixed(1)} مم/ساعة`,
        impact: ['انخفاض الرؤية', 'خطر انزلاق', 'رياح قوية'],
        recommendations: ['توقف في مكان آمن', 'لا تقود في هذه الظروف'],
        validUntil: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      })
    }

    // Check for extreme heat
    if (weather.temperature > 45) {
      severeAlerts.push({
        type: 'extreme_heat',
        severity: 'high',
        title: 'حرارة عالية جداً',
        message: `درجة الحرارة: ${weather.temperature.toFixed(1)}°م`,
        impact: ['خطر على الإطارات', 'تأثير على أداء المركبة'],
        recommendations: ['تجنب القيادة الطويلة', 'تحقق من الإطارات'],
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
      })
    }

    // Check for strong wind
    if (weather.windSpeed > 50) {
      severeAlerts.push({
        type: 'strong_wind',
        severity: 'critical',
        title: 'رياح قوية جداً',
        message: `سرعة الرياح: ${weather.windSpeed.toFixed(0)} كم/س`,
        impact: ['تأثير شديد على التحكم', 'خطر للشاحنات'],
        recommendations: ['تقليل السرعة', 'تجنب القيادة للشاحنات'],
        validUntil: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
      })
    }

    // Check for dust storm
    if (weather.condition.includes('dust') || weather.condition.includes('sand')) {
      severeAlerts.push({
        type: 'dust_storm',
        severity: weather.visibility < 200 ? 'critical' : 'high',
        title: 'عاصفة رملية',
        message: `الرؤية: ${weather.visibility.toFixed(0)} متر`,
        impact: ['انخفاض شديد في الرؤية', 'خطر الاصطدام'],
        recommendations: ['توقف فوراً', 'لا تقود في هذه الظروف'],
        validUntil: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours
      })
    }

    return severeAlerts
  }

  /**
   * Map severity from API format to internal format
   */
  private mapSeverity(severity: 'minor' | 'moderate' | 'severe' | 'extreme'): 'low' | 'medium' | 'high' | 'critical' {
    const map: Record<'minor' | 'moderate' | 'severe' | 'extreme', 'low' | 'medium' | 'high' | 'critical'> = {
      minor: 'low',
      moderate: 'medium',
      severe: 'high',
      extreme: 'critical',
    }
    return map[severity] || 'medium'
  }

  /**
   * Map alert type
   */
  private mapAlertType(severity: string): SevereAlert['type'] {
    const map: Record<string, SevereAlert['type']> = {
      extreme: 'official_warning',
      severe: 'storm',
      moderate: 'heavy_rain',
      minor: 'strong_wind',
    }
    return map[severity] || 'official_warning'
  }

  /**
   * Get impact
   */
  private getImpact(severity: string): string[] {
    const impacts: Record<string, string[]> = {
      critical: ['خطر شديد', 'توقف فوراً'],
      high: ['خطر عالي', 'احذر'],
      medium: ['ظروف صعبة', 'انتبه'],
      low: ['ظروف متوسطة'],
    }
    return impacts[severity] || []
  }

  /**
   * Get recommendations
   */
  private getRecommendations(severity: string): string[] {
    const recommendations: Record<string, string[]> = {
      critical: ['توقف في مكان آمن', 'لا تقود'],
      high: ['تقليل السرعة', 'احذر'],
      medium: ['انتبه', 'تقليل السرعة'],
      low: ['احذر'],
    }
    return recommendations[severity] || []
  }
}

export const severeConditionsAlerts = new SevereConditionsAlerts()

