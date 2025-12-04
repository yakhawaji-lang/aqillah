/**
 * Google Maps Platform Configuration
 * تكوين منصة Google Maps
 */

export const googleMapsConfig = {
  // API Keys (يجب تعيينها في .env)
  apiKey: process.env.AQILLAH_MAPS_WEB_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  routesApiKey: process.env.AQILLAH_ROUTES_KEY || process.env.GOOGLE_ROUTES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  placesApiKey: process.env.AQILLAH_PLACES_KEY || process.env.GOOGLE_PLACES_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
  
  // Base URLs
  mapsApiUrl: 'https://maps.googleapis.com/maps/api',
  routesApiUrl: 'https://routes.googleapis.com',
  
  // Default Settings
  defaultLanguage: 'ar',
  defaultRegion: 'SA', // Saudi Arabia
  
  // Map Settings
  defaultZoom: 12,
  defaultCenter: {
    lat: 24.7136, // الرياض
    lng: 46.6753,
  },
  
  // Route Options
  routeOptions: {
    avoidTolls: false,
    avoidHighways: false,
    avoidFerries: false,
    optimizeWaypoints: false,
    alternatives: true,
    trafficModel: 'best_guess', // best_guess, pessimistic, optimistic
    departureTime: 'now',
  },
  
  // Rate Limiting
  rateLimit: {
    requestsPerSecond: 10,
    requestsPerDay: 25000,
  },
  
  // Caching
  cache: {
    enabled: true,
    ttl: 300, // 5 minutes
  },
}

export type GoogleMapsConfig = typeof googleMapsConfig

