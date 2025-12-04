'use client'

import { useEffect } from 'react'
import { Bell, Navigation, Clock } from 'lucide-react'
import { Alert } from '@/types'

interface AbesherIntegrationProps {
  userId?: string
  onAlertReceived?: (alert: Alert) => void
}

/**
 * مكون التكامل مع أبشر
 * هذا المكون يحاكي التكامل مع نظام أبشر الحكومي
 */
export function AbesherIntegration({ userId, onAlertReceived }: AbesherIntegrationProps) {
  useEffect(() => {
    // محاكاة استقبال تنبيهات من أبشر
    // في التطبيق الحقيقي، سيكون هذا عبر WebSocket أو Push Notifications
    const interval = setInterval(() => {
      // محاكاة استقبال تنبيه
      if (Math.random() > 0.7 && onAlertReceived) {
        const mockAlert: Alert = {
          id: `alert-${Date.now()}`,
          segmentId: 'segment-1',
          type: 'congestion',
          severity: Math.random() > 0.5 ? 'high' : 'medium',
          message: 'تنبيه: ازدحام متوقع على طريقك',
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
          isActive: true,
        }
        onAlertReceived(mockAlert)
      }
    }, 60000) // كل دقيقة

    return () => clearInterval(interval)
  }, [onAlertReceived])

  return null
}

/**
 * مكون زر التكامل مع أبشر
 * يعرض في واجهة المستخدم
 */
export function AbesherButton() {
  const handleOpenAbesher = () => {
    // في التطبيق الحقيقي، سيفتح تطبيق أبشر أو يوجه إلى صفحة أبشر
    window.open('https://www.absher.sa', '_blank')
  }

  return (
    <button
      onClick={handleOpenAbesher}
      className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
    >
      <Bell className="h-5 w-5" />
      فتح في أبشر
    </button>
  )
}

/**
 * مكون عرض التنبيهات من أبشر
 */
export function AbesherAlerts({ alerts }: { alerts: Alert[] }) {
  return (
    <div className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="bg-white border-r-4 border-primary-600 rounded-lg p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <Bell className="h-5 w-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-gray-900 mb-1">{alert.message}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>منذ قليل</span>
                </div>
                {alert.alternativeRoute && (
                  <button className="flex items-center gap-1 text-primary-600 hover:text-primary-700">
                    <Navigation className="h-4 w-4" />
                    عرض مسار بديل
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

