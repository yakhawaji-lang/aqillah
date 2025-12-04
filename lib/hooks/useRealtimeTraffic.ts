'use client'

import { useEffect, useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

export function useRealtimeTraffic(city?: string) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const updateIntervalRef = useRef<NodeJS.Timeout>()

  // جلب البيانات الأولية
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['traffic', 'realtime', city],
    queryFn: async () => {
      const url = city ? `/api/traffic?city=${city}` : '/api/traffic'
      const res = await axios.get(url)
      setLastUpdate(new Date()) // تحديث وقت آخر تحديث
      return res.data.data
    },
    refetchInterval: 30000, // تحديث كل 30 ثانية
  })

  // محاكاة Real-time updates (في الإنتاج سيستخدم WebSocket)
  useEffect(() => {
    setIsConnected(true)
    
    updateIntervalRef.current = setInterval(() => {
      // تحديث البيانات في الخلفية
      queryClient.invalidateQueries({ queryKey: ['traffic', 'realtime', city] })
      setLastUpdate(new Date())
    }, 30000)

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
      setIsConnected(false)
    }
  }, [city, queryClient])

  // دالة تحديث يدوية
  const manualRefetch = async () => {
    setIsConnected(true)
    await refetch()
    setLastUpdate(new Date())
  }

  return {
    data,
    isLoading,
    isConnected,
    lastUpdate,
    refetch: manualRefetch,
  }
}

