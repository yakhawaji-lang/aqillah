/**
 * Weather API Configuration
 * تكوين واجهات برمجة تطبيقات الطقس
 */

export const weatherConfig = {
  // Primary: Google Weather API
  google: {
    apiKey: process.env.GOOGLE_WEATHER_API_KEY || '',
    apiUrl: 'https://weatherkit.googleapis.com/v1',
    enabled: !!process.env.GOOGLE_WEATHER_API_KEY,
  },
  
  // Fallback: OpenWeatherMap
  openWeather: {
    apiKey: process.env.OPENWEATHER_API_KEY || '',
    apiUrl: 'https://api.openweathermap.org/data/2.5',
    enabled: !!process.env.OPENWEATHER_API_KEY,
  },
  
  // Fallback: AccuWeather
  accuWeather: {
    apiKey: process.env.ACCUWEATHER_API_KEY || '',
    apiUrl: 'http://dataservice.accuweather.com',
    enabled: !!process.env.ACCUWEATHER_API_KEY,
  },
  
  // Default Settings
  defaultUnits: 'metric', // metric, imperial
  defaultLanguage: 'ar',
  
  // Update Intervals
  updateIntervals: {
    current: 15 * 60 * 1000, // 15 minutes
    hourly: 60 * 60 * 1000,  // 1 hour
    daily: 6 * 60 * 60 * 1000, // 6 hours
  },
  
  // Cache Settings
  cache: {
    enabled: true,
    ttl: {
      current: 10 * 60 * 1000,  // 10 minutes
      hourly: 30 * 60 * 1000,   // 30 minutes
      daily: 2 * 60 * 60 * 1000, // 2 hours
    },
  },
  
  // Alert Thresholds
  alertThresholds: {
    heavyRain: 10, // mm/h
    lowVisibility: 200, // meters
    strongWind: 50, // km/h
    extremeTemperature: {
      high: 45, // Celsius
      low: 0,   // Celsius
    },
  },
}

export type WeatherConfig = typeof weatherConfig

