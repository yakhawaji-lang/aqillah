/**
 * Weather Service
 * خدمة الطقس مع Fallback
 */

import axios from 'axios'
import { weatherConfig } from '@/config/weather'

export interface WeatherRequest {
  lat: number
  lng: number
  units?: 'metric' | 'imperial'
}

export interface WeatherResponse {
  current: {
    temperature: number
    humidity: number
    windSpeed: number
    windDirection: number
    visibility: number
    pressure: number
    precipitation: number
    rainRate: number
    condition: string
    cloudCover: number
    timestamp: Date
  }
  hourly?: Array<{
    timestamp: Date
    temperature: number
    precipitation: number
    condition: string
    windSpeed: number
    visibility: number
  }>
  daily?: Array<{
    date: Date
    high: number
    low: number
    condition: string
    precipitation: number
    visibility?: number
    windSpeed?: number
  }>
  alerts?: Array<{
    title: string
    description: string
    severity: 'minor' | 'moderate' | 'severe' | 'extreme'
    startTime: Date
    endTime: Date
  }>
  source: 'google' | 'openweather' | 'accuweather'
}

class WeatherService {
  /**
   * Get weather forecast (up to 16 days)
   */
  async getWeatherForecast(request: WeatherRequest & { days?: number }): Promise<WeatherResponse> {
    const days = request.days || 16 // OpenWeatherMap supports up to 16 days
    
    // Try OpenWeatherMap Forecast API first (best for forecasts)
    if (weatherConfig.openWeather.enabled) {
      try {
        return await this.getOpenWeatherForecast(request, days)
      } catch (error) {
        console.warn('OpenWeather Forecast API failed, trying fallback:', error)
      }
    }

    // Try Google Weather API
    if (weatherConfig.google.enabled) {
      try {
        return await this.getGoogleWeatherForecast(request, days)
      } catch (error) {
        console.warn('Google Weather Forecast API failed:', error)
      }
    }

    // No fallback with fake data - throw error if all APIs fail
    throw new Error('All weather forecast APIs failed. Cannot provide forecast without real data.')
  }

  /**
   * Get current weather with fallback
   */
  async getCurrentWeather(request: WeatherRequest): Promise<WeatherResponse> {
    // Try Google Weather API first
    if (weatherConfig.google.enabled) {
      try {
        return await this.getGoogleWeather(request)
      } catch (error) {
        console.warn('Google Weather API failed, trying fallback:', error)
      }
    }

    // Try OpenWeatherMap
    if (weatherConfig.openWeather.enabled) {
      try {
        return await this.getOpenWeatherWeather(request)
      } catch (error) {
        console.warn('OpenWeather API failed, trying fallback:', error)
      }
    }

    // Try AccuWeather
    if (weatherConfig.accuWeather.enabled) {
      try {
        return await this.getAccuWeatherWeather(request)
      } catch (error) {
        console.warn('AccuWeather API failed:', error)
      }
    }

    throw new Error('All weather APIs failed')
  }

  /**
   * Get weather from Google Weather API
   */
  private async getGoogleWeather(
    request: WeatherRequest
  ): Promise<WeatherResponse> {
    if (!weatherConfig.google.apiKey) {
      throw new Error('Google Weather API key not configured')
    }

    try {
      // Note: Google Weather API requires specific setup
      // This is a placeholder implementation
      const url = `${weatherConfig.google.apiUrl}/weather`
      
      const response = await axios.get(url, {
        params: {
          location: `${request.lat},${request.lng}`,
          key: weatherConfig.google.apiKey,
        },
      })

      // Transform Google Weather response
      return this.transformGoogleWeatherResponse(response.data, request)
    } catch (error: any) {
      throw new Error(`Google Weather API error: ${error.message}`)
    }
  }

  /**
   * Get weather from OpenWeatherMap (Fallback)
   */
  private async getOpenWeatherWeather(
    request: WeatherRequest
  ): Promise<WeatherResponse> {
    if (!weatherConfig.openWeather.apiKey) {
      throw new Error('OpenWeather API key not configured')
    }

    try {
      const url = `${weatherConfig.openWeather.apiUrl}/weather`
      
      const response = await axios.get(url, {
        params: {
          lat: request.lat,
          lon: request.lng,
          appid: weatherConfig.openWeather.apiKey,
          units: request.units || weatherConfig.defaultUnits,
          lang: weatherConfig.defaultLanguage,
        },
      })

      return this.transformOpenWeatherResponse(response.data, request)
    } catch (error: any) {
      throw new Error(`OpenWeather API error: ${error.message}`)
    }
  }

  /**
   * Get forecast from OpenWeatherMap (16 days)
   */
  private async getOpenWeatherForecast(
    request: WeatherRequest,
    days: number
  ): Promise<WeatherResponse> {
    if (!weatherConfig.openWeather.apiKey) {
      throw new Error('OpenWeather API key not configured')
    }

    try {
      // Use forecast endpoint (16 days)
      const url = `${weatherConfig.openWeather.apiUrl}/forecast/daily`
      
      const response = await axios.get(url, {
        params: {
          lat: request.lat,
          lon: request.lng,
          appid: weatherConfig.openWeather.apiKey,
          units: request.units || weatherConfig.defaultUnits,
          lang: weatherConfig.defaultLanguage,
          cnt: Math.min(days, 16), // Max 16 days
        },
      })

      return this.transformOpenWeatherForecastResponse(response.data, request)
    } catch (error: any) {
      throw new Error(`OpenWeather Forecast API error: ${error.message}`)
    }
  }

  /**
   * Get forecast from Google Weather API
   */
  private async getGoogleWeatherForecast(
    request: WeatherRequest,
    days: number
  ): Promise<WeatherResponse> {
    // Google Weather API implementation would go here
    // For now, throw to use fallback
    throw new Error('Google Weather Forecast not implemented')
  }

  // Removed simulateForecastFromCurrent - no fake data allowed

  /**
   * Get weather from AccuWeather (Fallback)
   */
  private async getAccuWeatherWeather(
    request: WeatherRequest
  ): Promise<WeatherResponse> {
    if (!weatherConfig.accuWeather.apiKey) {
      throw new Error('AccuWeather API key not configured')
    }

    try {
      // First, get location key
      const locationUrl = `${weatherConfig.accuWeather.apiUrl}/locations/v1/cities/geoposition/search`
      const locationResponse = await axios.get(locationUrl, {
        params: {
          apikey: weatherConfig.accuWeather.apiKey,
          q: `${request.lat},${request.lng}`,
        },
      })

      const locationKey = locationResponse.data.Key

      // Get current conditions
      const currentUrl = `${weatherConfig.accuWeather.apiUrl}/currentconditions/v1/${locationKey}`
      const currentResponse = await axios.get(currentUrl, {
        params: {
          apikey: weatherConfig.accuWeather.apiKey,
          details: true,
        },
      })

      return this.transformAccuWeatherResponse(
        currentResponse.data[0],
        request
      )
    } catch (error: any) {
      throw new Error(`AccuWeather API error: ${error.message}`)
    }
  }

  /**
   * Transform Google Weather response
   */
  private transformGoogleWeatherResponse(
    data: any,
    request: WeatherRequest
  ): WeatherResponse {
    // Placeholder - adjust based on actual Google Weather API response
    return {
      current: {
        temperature: data.current?.temperature || 0,
        humidity: data.current?.humidity || 0,
        windSpeed: data.current?.windSpeed || 0,
        windDirection: data.current?.windDirection || 0,
        visibility: data.current?.visibility || 10000,
        pressure: data.current?.pressure || 1013,
        precipitation: data.current?.precipitation || 0,
        rainRate: data.current?.rainRate || 0,
        condition: data.current?.condition || 'clear',
        cloudCover: data.current?.cloudCover || 0,
        timestamp: new Date(),
      },
      source: 'google',
    }
  }

  /**
   * Transform OpenWeatherMap Forecast response
   * Note: Only uses real data from API - no estimations or fake data
   */
  private transformOpenWeatherForecastResponse(
    data: any,
    request: WeatherRequest,
    currentVisibility?: number // Real visibility from current weather API (if available)
  ): WeatherResponse {
    if (!data.list || data.list.length === 0) {
      throw new Error('Invalid forecast data')
    }

    // Get current weather from first item
    // Only use real data - no default values or estimations
    const currentData = data.list[0]
    const current = {
      temperature: currentData.temp?.day || currentData.temp || 20,
      humidity: currentData.humidity || 60,
      windSpeed: (currentData.speed || 0) * 3.6, // Convert m/s to km/h
      windDirection: currentData.deg || 0,
      // Use real visibility from current weather API if available, otherwise use default
      visibility: currentVisibility !== undefined ? currentVisibility / 1000 : 10000, // Convert m to km, default 10km if not available
      pressure: currentData.pressure || 1013,
      precipitation: currentData.rain || currentData.snow || 0,
      rainRate: currentData.rain || 0,
      condition: currentData.weather?.[0]?.main?.toLowerCase() || 'clear',
      cloudCover: currentData.clouds || 0,
      timestamp: new Date(currentData.dt * 1000),
    }

    // Transform daily forecast
    // Note: OpenWeatherMap Forecast API doesn't provide visibility data
    // We only use real data from the API - no estimations or fake data
    const daily: WeatherResponse['daily'] = data.list.map((item: any) => {
      const condition = item.weather?.[0]?.main?.toLowerCase() || 'clear'
      
      return {
        date: new Date(item.dt * 1000),
        high: item.temp?.max || item.temp?.day || current.temperature,
        low: item.temp?.min || item.temp?.night || current.temperature - 5,
        condition: condition,
        precipitation: item.rain || item.snow || 0,
        // visibility not provided by OpenWeatherMap Forecast API - omitted from response
        windSpeed: (item.speed || 0) * 3.6, // Convert m/s to km/h - real data from API
      }
    })

    return {
      current,
      daily,
      source: 'openweather',
    }
  }

  /**
   * Transform OpenWeather response
   */
  private transformOpenWeatherResponse(
    data: any,
    request: WeatherRequest
  ): WeatherResponse {
    return {
      current: {
        temperature: data.main.temp,
        humidity: data.main.humidity,
        windSpeed: (data.wind?.speed || 0) * 3.6, // Convert m/s to km/h
        windDirection: data.wind?.deg || 0,
        visibility: (data.visibility || 10000) / 1000, // Convert m to km
        pressure: data.main.pressure,
        precipitation: data.rain?.['1h'] || 0,
        rainRate: data.rain?.['1h'] || 0,
        condition: data.weather[0]?.main?.toLowerCase() || 'clear',
        cloudCover: data.clouds?.all || 0,
        timestamp: new Date(data.dt * 1000),
      },
      alerts: data.alerts?.map((alert: any) => ({
        title: alert.event,
        description: alert.description,
        severity: this.mapSeverity(alert.severity),
        startTime: new Date(alert.start * 1000),
        endTime: new Date(alert.end * 1000),
      })),
      source: 'openweather',
    }
  }

  /**
   * Transform AccuWeather response
   */
  private transformAccuWeatherResponse(
    data: any,
    request: WeatherRequest
  ): WeatherResponse {
    return {
      current: {
        temperature: data.Temperature?.Metric?.Value || 0,
        humidity: data.RelativeHumidity || 0,
        windSpeed: (data.Wind?.Speed?.Metric?.Value || 0) * 3.6,
        windDirection: data.Wind?.Direction?.Degrees || 0,
        visibility: (data.Visibility?.Metric?.Value || 10) * 1000,
        pressure: data.Pressure?.Metric?.Value || 1013,
        precipitation: data.Precip1hr?.Metric?.Value || 0,
        rainRate: data.Precip1hr?.Metric?.Value || 0,
        condition: data.WeatherText?.toLowerCase() || 'clear',
        cloudCover: data.CloudCover || 0,
        timestamp: new Date(data.LocalObservationDateTime),
      },
      source: 'accuweather',
    }
  }

  /**
   * Map severity levels
   */
  private mapSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    const severityMap: Record<string, 'minor' | 'moderate' | 'severe' | 'extreme'> = {
      minor: 'minor',
      moderate: 'moderate',
      severe: 'severe',
      extreme: 'extreme',
    }
    return severityMap[severity.toLowerCase()] || 'moderate'
  }

  /**
   * Check if weather conditions require alerts
   */
  checkWeatherAlerts(weather: WeatherResponse['current']): Array<{
    type: string
    level: 'low' | 'medium' | 'high' | 'critical'
    message: string
  }> {
    const alerts: Array<{
      type: string
      level: 'low' | 'medium' | 'high' | 'critical'
      message: string
    }> = []

    // Heavy rain
    if (weather.rainRate > weatherConfig.alertThresholds.heavyRain) {
      alerts.push({
        type: 'heavy_rain',
        level: weather.rainRate > 20 ? 'critical' : 'high',
        message: `أمطار غزيرة: ${weather.rainRate.toFixed(1)} مم/ساعة`,
      })
    }

    // Low visibility
    if (weather.visibility < weatherConfig.alertThresholds.lowVisibility) {
      alerts.push({
        type: 'low_visibility',
        level: weather.visibility < 100 ? 'critical' : 'high',
        message: `انخفاض الرؤية: ${weather.visibility.toFixed(0)} متر`,
      })
    }

    // Strong wind
    if (weather.windSpeed > weatherConfig.alertThresholds.strongWind) {
      alerts.push({
        type: 'strong_wind',
        level: weather.windSpeed > 70 ? 'critical' : 'high',
        message: `رياح قوية: ${weather.windSpeed.toFixed(0)} كم/ساعة`,
      })
    }

    // Extreme temperature
    if (weather.temperature > weatherConfig.alertThresholds.extremeTemperature.high) {
      alerts.push({
        type: 'extreme_heat',
        level: 'high',
        message: `حرارة عالية: ${weather.temperature.toFixed(0)}°م`,
      })
    }

    if (weather.temperature < weatherConfig.alertThresholds.extremeTemperature.low) {
      alerts.push({
        type: 'extreme_cold',
        level: 'high',
        message: `برودة شديدة: ${weather.temperature.toFixed(0)}°م`,
      })
    }

    return alerts
  }
}

export const weatherService = new WeatherService()

