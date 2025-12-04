import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { MapMarker } from '@/types'

export function useTrafficData(city?: string) {
  return useQuery({
    queryKey: ['traffic', city],
    queryFn: async () => {
      const url = city ? `/api/traffic?city=${city}` : '/api/traffic'
      const res = await axios.get(url)
      return res.data.data
    },
    refetchInterval: 30000,
  })
}

export function useTrafficMarkers(city?: string): MapMarker[] {
  const { data } = useTrafficData(city)
  
  if (!data) return []
  
  return data.map((item: any) => ({
    id: item.id,
    position: item.position,
    congestionIndex: item.congestionIndex,
    roadName: item.roadName,
    direction: item.direction,
  }))
}

