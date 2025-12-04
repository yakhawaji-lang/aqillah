/**
 * Weather Alerts System
 * نظام التحذيرات الشامل للطقس
 * جميع التحذيرات مبنية على بيانات واقعية فقط - لا بيانات وهمية
 */

export interface WeatherAlert {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  value: number
  icon: string
}

export interface WeatherDayData {
  temperature: number
  temp_min?: number
  temp_max?: number
  humidity?: number
  pressure?: number
  windSpeed?: number
  visibility?: number
  precipitation: number
  rainRate?: number
  condition: string
}

/**
 * فئة التحذيرات الشاملة
 */
export class WeatherAlertsChecker {
  /**
   * 1️⃣ تحذير هطول مطر قوي
   * rain > 5 mm
   */
  static checkHeavyRain(day: WeatherDayData): WeatherAlert | null {
    if (day.precipitation > 5) {
      const severity = day.precipitation > 50 ? 'critical' : 
                      day.precipitation > 25 ? 'high' : 
                      day.precipitation > 15 ? 'medium' : 'low'
      
      return {
        type: 'heavy_rain',
        severity,
        message: '⚠️ أمطار غزيرة — القيادة بحذر',
        value: day.precipitation,
        icon: '🌧',
      }
    }
    return null
  }

  /**
   * 2️⃣ تحذير طرق زلقة
   * temp < 4°C AND rain > 0
   */
  static checkSlipperyRoads(day: WeatherDayData): WeatherAlert | null {
    if (day.temperature < 4 && day.precipitation > 0) {
      const severity = day.temperature < 0 ? 'critical' : 
                      day.temperature < 2 ? 'high' : 'medium'
      
      return {
        type: 'slippery_road',
        severity,
        message: '⚠️ احتمال انزلاق الطريق — انتبه',
        value: day.temperature,
        icon: '🛣️',
      }
    }
    return null
  }

  /**
   * 3️⃣ تحذير موجة حر
   * temp > 45°C
   */
  static checkHeatWave(day: WeatherDayData): WeatherAlert | null {
    const temp = day.temp_max || day.temperature
    if (temp > 45) {
      const severity = temp > 50 ? 'critical' : 'high'
      
      return {
        type: 'heat_wave',
        severity,
        message: '☀️ حرارة مرتفعة — انتبه لسخونة المحرك',
        value: temp,
        icon: '☀️',
      }
    }
    return null
  }

  /**
   * 4️⃣ تحذير موجة برد
   * temp < 0°C
   */
  static checkColdWave(day: WeatherDayData): WeatherAlert | null {
    const temp = day.temp_min || day.temperature
    if (temp < 0) {
      const severity = temp < -5 ? 'critical' : 
                      temp < -2 ? 'high' : 'medium'
      
      return {
        type: 'cold_wave',
        severity,
        message: '❄️ تجمد محتمل — قيادة حذرة',
        value: temp,
        icon: '❄️',
      }
    }
    return null
  }

  /**
   * 5️⃣ تحذير رياح قوية
   * wind_speed > 12 m/s (43.2 km/h)
   */
  static checkStrongWind(day: WeatherDayData): WeatherAlert | null {
    if (day.windSpeed !== undefined && day.windSpeed !== null) {
      // Convert to m/s if needed (assuming km/h if > 20)
      const windSpeedMs = day.windSpeed > 20 ? day.windSpeed / 3.6 : day.windSpeed
      
      if (windSpeedMs > 12) {
        const severity = windSpeedMs > 20 ? 'critical' : 
                        windSpeedMs > 17 ? 'high' : 
                        windSpeedMs > 15 ? 'medium' : 'low'
        
        return {
          type: 'strong_wind',
          severity,
          message: '🌪 رياح قوية — تحكم بالمقود',
          value: day.windSpeed,
          icon: '🌪',
        }
      }
    }
    return null
  }

  /**
   * 6️⃣ تحذير عاصفة رعدية
   * weather = Thunderstorm
   */
  static checkThunderstorm(day: WeatherDayData): WeatherAlert | null {
    const condition = day.condition.toLowerCase()
    if (condition.includes('thunder') || condition.includes('storm') || 
        condition.includes('thunderstorm')) {
      return {
        type: 'thunderstorm',
        severity: 'high',
        message: '⛈ عاصفة رعدية — توخ الحيطة',
        value: 1,
        icon: '⛈',
      }
    }
    return null
  }

  /**
   * 7️⃣ تحذير تدني الرؤية
   * visibility < 1000 m
   */
  static checkLowVisibility(day: WeatherDayData): WeatherAlert | null {
    if (day.visibility !== undefined && day.visibility !== null && day.visibility < 1000) {
      const severity = day.visibility < 100 ? 'critical' : 
                      day.visibility < 200 ? 'high' : 
                      day.visibility < 500 ? 'medium' : 'low'
      
      return {
        type: 'low_visibility',
        severity,
        message: '🌫 رؤية ضعيفة — شغّل الأنوار',
        value: day.visibility,
        icon: '🌫',
      }
    }
    return null
  }

  /**
   * 8️⃣ تحذير غبار / عواصف ترابية
   * weather = Dust OR Sand
   */
  static checkDustStorm(day: WeatherDayData): WeatherAlert | null {
    const condition = day.condition.toLowerCase()
    if (condition.includes('dust') || condition.includes('sand') || 
        condition.includes('haze') || condition.includes('sandstorm')) {
      const severity = condition.includes('storm') ? 'critical' : 'high'
      
      return {
        type: 'dust_storm',
        severity,
        message: '🌪 عاصفة ترابية — اهدأ بالسرعة',
        value: 1,
        icon: '🌪',
      }
    }
    return null
  }

  /**
   * 9️⃣ تحذير تساقط الثلج
   * weather = Snow
   */
  static checkSnow(day: WeatherDayData): WeatherAlert | null {
    const condition = day.condition.toLowerCase()
    if (condition.includes('snow') || condition.includes('sleet')) {
      const severity = day.precipitation > 5 ? 'critical' : 'high'
      
      return {
        type: 'snow',
        severity,
        message: '❄️ ثلوج — خطر انزلاق',
        value: day.precipitation,
        icon: '❄️',
      }
    }
    return null
  }

  /**
   * 🔟 تحذير صقيع ليلي
   * temp_min < -1°C
   */
  static checkFrost(day: WeatherDayData): WeatherAlert | null {
    const tempMin = day.temp_min !== undefined ? day.temp_min : day.temperature
    if (tempMin < -1) {
      const severity = tempMin < -5 ? 'critical' : 
                      tempMin < -3 ? 'high' : 'medium'
      
      return {
        type: 'frost',
        severity,
        message: '🧊 احتمال جليد',
        value: tempMin,
        icon: '🧊',
      }
    }
    return null
  }

  /**
   * 1️⃣1️⃣ تحذير رطوبة عالية جداً
   * humidity > 90%
   */
  static checkHighHumidity(day: WeatherDayData): WeatherAlert | null {
    if (day.humidity !== undefined && day.humidity !== null && day.humidity > 90) {
      const severity = day.humidity > 95 ? 'high' : 'medium'
      
      return {
        type: 'high_humidity',
        severity,
        message: '💦 رطوبة عالية — الجو خانق',
        value: day.humidity,
        icon: '💦',
      }
    }
    return null
  }

  /**
   * 1️⃣2️⃣ تحذير ضغط جوي منخفض
   * pressure < 1000 hPa
   */
  static checkLowPressure(day: WeatherDayData): WeatherAlert | null {
    if (day.pressure !== undefined && day.pressure !== null && day.pressure < 1000) {
      const severity = day.pressure < 980 ? 'high' : 
                      day.pressure < 990 ? 'medium' : 'low'
      
      return {
        type: 'low_pressure',
        severity,
        message: '🌪 ضغط منخفض — تغيّرات جوية قريبة',
        value: day.pressure,
        icon: '🌪',
      }
    }
    return null
  }

  /**
   * ✅ تحذيرات ذكية مركبة
   */

  /**
   * خطر انزلاق مركب
   * rain > 3 && temp < 5
   */
  static checkSlipperyRisk(day: WeatherDayData): WeatherAlert | null {
    if (day.precipitation > 3 && day.temperature < 5) {
      const severity = day.temperature < 2 ? 'critical' : 
                      day.temperature < 3 ? 'high' : 'medium'
      
      return {
        type: 'slippery_risk',
        severity,
        message: '⚠️ الطريق زلق — خطر انزلاق',
        value: day.temperature,
        icon: '⚠️',
      }
    }
    return null
  }

  /**
   * قيادة خطرة مركبة
   * visibility < 800 || wind > 15 m/s
   */
  static checkDangerousDriving(day: WeatherDayData): WeatherAlert | null {
    const windSpeedMs = day.windSpeed !== undefined && day.windSpeed !== null
      ? (day.windSpeed > 20 ? day.windSpeed / 3.6 : day.windSpeed)
      : 0
    
    const lowVisibility = day.visibility !== undefined && day.visibility !== null && day.visibility < 800
    const strongWind = windSpeedMs > 15
    
    if (lowVisibility || strongWind) {
      let message = '⚠️ ظروف قيادة خطرة'
      if (lowVisibility && strongWind) {
        message = '⚠️ ظروف قيادة خطرة جداً — رؤية ضعيفة ورياح قوية'
      } else if (lowVisibility) {
        message = '⚠️ ظروف قيادة خطرة — رؤية ضعيفة'
      } else if (strongWind) {
        message = '⚠️ ظروف قيادة خطرة — رياح قوية'
      }
      
      const severity = (lowVisibility && day.visibility! < 200) || windSpeedMs > 20 
        ? 'critical' 
        : (lowVisibility && day.visibility! < 500) || windSpeedMs > 17
        ? 'high'
        : 'medium'
      
      return {
        type: 'dangerous_driving',
        severity,
        message,
        value: lowVisibility ? day.visibility! : windSpeedMs,
        icon: '⚠️',
      }
    }
    return null
  }

  /**
   * فحص جميع التحذيرات لليوم الواحد
   */
  static checkAllAlerts(day: WeatherDayData): WeatherAlert[] {
    const alerts: WeatherAlert[] = []
    
    // التحذيرات الأساسية
    const checks = [
      this.checkHeavyRain,
      this.checkSlipperyRoads,
      this.checkHeatWave,
      this.checkColdWave,
      this.checkStrongWind,
      this.checkThunderstorm,
      this.checkLowVisibility,
      this.checkDustStorm,
      this.checkSnow,
      this.checkFrost,
      this.checkHighHumidity,
      this.checkLowPressure,
      // التحذيرات المركبة (يتم فحصها بعد الأساسية)
      this.checkSlipperyRisk,
      this.checkDangerousDriving,
    ]
    
    for (const check of checks) {
      const alert = check(day)
      if (alert) {
        // تجنب التكرار - إذا كان هناك تحذير مركب مشابه، نفضل المركب
        const existingSimilar = alerts.find(a => 
          (a.type === 'slippery_road' && alert.type === 'slippery_risk') ||
          (a.type === 'slippery_risk' && alert.type === 'slippery_road')
        )
        
        if (!existingSimilar) {
          alerts.push(alert)
        } else if (alert.type === 'slippery_risk' || alert.type === 'dangerous_driving') {
          // استبدال التحذير البسيط بالمركب
          const index = alerts.indexOf(existingSimilar)
          alerts[index] = alert
        }
      }
    }
    
    return alerts
  }
}

