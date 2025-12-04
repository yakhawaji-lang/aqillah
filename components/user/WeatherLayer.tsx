'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'

interface WeatherLayerProps {
  weatherData?: Array<{
    location: { lat: number; lng: number }
    weather: {
      condition: string
      temperature: number
      rainRate: number
      visibility: number
    }
  }>
}

export default function WeatherLayer({ weatherData }: WeatherLayerProps) {
  const map = useMap()

  useEffect(() => {
    if (!weatherData || weatherData.length === 0) return

    const markers: L.Marker[] = []

    weatherData.forEach((point) => {
      const { condition, temperature, rainRate, visibility } = point.weather
      
      // Determine icon color based on conditions
      let iconColor = 'blue'
      if (rainRate > 10 || visibility < 200) {
        iconColor = 'red'
      } else if (rainRate > 5 || visibility < 500) {
        iconColor = 'orange'
      }

      const icon = L.divIcon({
        className: 'weather-marker',
        html: `
          <div style="
            background: ${iconColor};
            color: white;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          ">
            ${condition === 'rain' ? '🌧️' : condition === 'fog' ? '🌫️' : '☁️'}
          </div>
        `,
        iconSize: [30, 30],
      })

      const marker = L.marker([point.location.lat, point.location.lng], { icon })
      marker.addTo(map)
      markers.push(marker)
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [map, weatherData])

  return null
}

