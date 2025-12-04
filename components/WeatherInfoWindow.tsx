interface WeatherInfoWindowProps {
  weather: {
    temperature: number
    condition: string
    humidity: number
    windSpeed: number
    visibility: number
    pressure: number
    precipitation: number
    rainRate: number
    cloudCover: number
  }
  alerts?: Array<{
    type: string
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }>
}

export function WeatherInfoWindow({ weather, alerts }: WeatherInfoWindowProps) {
  const getConditionIcon = (condition: string) => {
    const conditionLower = condition.toLowerCase()
    if (conditionLower.includes('rain') || conditionLower.includes('مطر')) {
      return '🌧️'
    }
    if (conditionLower.includes('fog') || conditionLower.includes('ضباب')) {
      return '🌫️'
    }
    if (conditionLower.includes('cloud') || conditionLower.includes('غائم')) {
      return '☁️'
    }
    if (conditionLower.includes('sun') || conditionLower.includes('شمس')) {
      return '☀️'
    }
    if (conditionLower.includes('storm') || conditionLower.includes('عاصفة')) {
      return '⛈️'
    }
    return '🌤️'
  }

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-600'
      case 'high':
        return 'bg-orange-600'
      case 'medium':
        return 'bg-yellow-600'
      default:
        return 'bg-blue-600'
    }
  }

  return `
    <div style="padding: 12px; min-width: 250px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl;">
      <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
        <span style="font-size: 32px;">${getConditionIcon(weather.condition)}</span>
        <div>
          <div style="font-size: 24px; font-weight: bold; color: #111827;">
            ${weather.temperature.toFixed(0)}°م
          </div>
          <div style="font-size: 14px; color: #6b7280; text-transform: capitalize;">
            ${weather.condition}
          </div>
        </div>
      </div>
      
      ${alerts && alerts.length > 0 ? `
        <div style="margin-bottom: 12px;">
          ${alerts.map(alert => `
            <div style="background: ${alert.level === 'critical' ? '#dc2626' : alert.level === 'high' ? '#ea580c' : '#f59e0b'}; color: white; padding: 6px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 12px; font-weight: 500;">
              ⚠️ ${alert.message}
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
          <span>💧</span>
          <span>الرطوبة: ${weather.humidity}%</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
          <span>💨</span>
          <span>الرياح: ${weather.windSpeed.toFixed(0)} كم/س</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
          <span>👁️</span>
          <span>الرؤية: ${weather.visibility >= 1000 ? (weather.visibility / 1000).toFixed(1) + ' كم' : weather.visibility.toFixed(0) + ' م'}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
          <span>📊</span>
          <span>الضغط: ${weather.pressure} hPa</span>
        </div>
        ${weather.rainRate > 0 ? `
          <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
            <span>🌧️</span>
            <span>الأمطار: ${weather.rainRate.toFixed(1)} مم/س</span>
          </div>
        ` : ''}
        <div style="display: flex; align-items: center; gap: 6px; color: #374151;">
          <span>☁️</span>
          <span>الغيوم: ${weather.cloudCover}%</span>
        </div>
      </div>
    </div>
  `
}

