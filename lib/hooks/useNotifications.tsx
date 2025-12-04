'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Alert } from '@/types'
import toast from 'react-hot-toast'

export function useNotifications(enabled: boolean = true) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [lastAlertId, setLastAlertId] = useState<string | null>(null)

  // طلب الإذن للإشعارات
  useEffect(() => {
    if ('Notification' in window && enabled) {
      Notification.requestPermission().then(setPermission)
    }
  }, [enabled])

  // جلب التنبيهات
  const { data: alerts } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axios.get('/api/alerts?activeOnly=true')
      return res.data.data as Alert[]
    },
    refetchInterval: 60000,
    enabled,
  })

  // إرسال إشعارات للتنبيهات الجديدة
  useEffect(() => {
    if (alerts && alerts.length > 0 && permission === 'granted') {
      const latestAlert = alerts[0]
      
      if (latestAlert.id !== lastAlertId) {
        setLastAlertId(latestAlert.id)
        
        // إشعار المتصفح
        new Notification('عَقِلْها - تنبيه جديد', {
          body: latestAlert.message,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: latestAlert.id,
        })

        // Toast notification
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <span className="text-2xl">
                    {latestAlert.severity === 'critical' ? '🚨' :
                     latestAlert.severity === 'high' ? '🔶' :
                     latestAlert.severity === 'medium' ? '⚠️' : 'ℹ️'}
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {latestAlert.message}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {latestAlert.severity === 'critical' ? 'حرج' :
                     latestAlert.severity === 'high' ? 'عالي' :
                     latestAlert.severity === 'medium' ? 'متوسط' : 'منخفض'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary-600 hover:text-primary-500 focus:outline-none"
              >
                إغلاق
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
        })
      }
    }
  }, [alerts, permission, lastAlertId])

  return {
    alerts,
    permission,
    hasNewAlerts: alerts && alerts.length > 0,
  }
}

