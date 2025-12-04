'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { Alert } from '@/types'
import toast from 'react-hot-toast'
import { soundManager } from '@/lib/utils/sounds'

export function useNotifications(enabled: boolean = true) {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [lastAlertIds, setLastAlertIds] = useState<Set<string>>(new Set())
  const [soundEnabled, setSoundEnabled] = useState(true)

  // طلب الإذن للإشعارات
  useEffect(() => {
    if ('Notification' in window && enabled) {
      Notification.requestPermission().then(setPermission)
    }
  }, [enabled])

  // جلب التنبيهات - كل 10 ثواني للتفاعلية العالية
  const { data: alerts } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await axios.get('/api/alerts?activeOnly=true')
      return res.data.data as Alert[]
    },
    refetchInterval: 10000, // كل 10 ثواني
    enabled,
  })

  // إرسال إشعارات للتنبيهات الجديدة مع أصوات
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      alerts.forEach((alert) => {
        if (!lastAlertIds.has(alert.id)) {
          const newIds = new Set(lastAlertIds)
          newIds.add(alert.id)
          setLastAlertIds(newIds)

          // تحديد نوع الصوت بناءً على نوع التنبيه
          let soundType: 'alert' | 'prediction' | 'warning' | 'critical' | 'info' = 'info'
          
          if (alert.severity === 'critical') {
            soundType = 'critical'
          } else if (alert.severity === 'high') {
            soundType = 'warning'
          } else {
            soundType = 'alert'
          }

          // تشغيل الصوت
          if (soundEnabled && soundManager) {
            soundManager.playSound(soundType)
          }

          // إشعار المتصفح
          if (permission === 'granted') {
            new Notification('عَقِلْها - تنبيه جديد', {
              body: alert.message,
              icon: '/icon-192.png',
              badge: '/icon-192.png',
              tag: alert.id,
              requireInteraction: alert.severity === 'critical',
            })
          }

          // Toast notification
          const icon = alert.severity === 'critical' ? '🚨' :
                      alert.severity === 'high' ? '🔶' :
                      alert.severity === 'medium' ? '⚠️' : 'ℹ️'

          toast(alert.message, {
            duration: alert.severity === 'critical' ? 8000 : 5000,
            icon,
            style: {
              background: alert.severity === 'critical' ? '#991B1B' :
                         alert.severity === 'high' ? '#F59E0B' :
                         alert.severity === 'medium' ? '#F97316' : '#363636',
              color: '#fff',
              fontFamily: 'var(--font-cairo)',
              fontSize: '14px',
              padding: '16px',
              borderRadius: '8px',
            },
          })
        }
      })
    }
  }, [alerts, permission, lastAlertIds, soundEnabled])

  return {
    alerts,
    permission,
    hasNewAlerts: alerts && alerts.length > 0,
    soundEnabled,
    setSoundEnabled: (enabled: boolean) => {
      setSoundEnabled(enabled)
      if (soundManager) {
        soundManager.setEnabled(enabled)
      }
    },
  }
}

