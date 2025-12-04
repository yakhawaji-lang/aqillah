'use client'

import { AlertCircle, Clock, MapPin, Navigation } from 'lucide-react'
import { Alert } from '@/types'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  alert: Alert
  onRouteClick?: () => void
}

const severityColors = {
  low: 'bg-blue-50 border-blue-200 text-blue-800',
  medium: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  high: 'bg-orange-50 border-orange-200 text-orange-800',
  critical: 'bg-red-50 border-red-200 text-red-800',
}

const severityIcons = {
  low: 'ℹ️',
  medium: '⚠️',
  high: '🔶',
  critical: '🚨',
}

export function AlertCard({ alert, onRouteClick }: AlertCardProps) {
  const severityColor = severityColors[alert.severity]
  const severityIcon = severityIcons[alert.severity]

  return (
    <div className={cn(
      "bg-white rounded-lg border-2 p-4 shadow-sm",
      severityColor
    )}>
      <div className="flex items-start gap-3">
        <div className="text-2xl">{severityIcon}</div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg">{alert.message}</h3>
            <span className="text-xs font-medium px-2 py-1 bg-white/50 rounded">
              {alert.type === 'congestion' ? 'ازدحام' :
               alert.type === 'accident' ? 'حادث' :
               alert.type === 'event' ? 'فعالية' : 'طقس'}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-700 mb-3">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{formatDateTime(alert.createdAt)}</span>
            </div>
            {alert.alternativeRoute && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>مسار بديل متاح</span>
              </div>
            )}
          </div>

          {alert.alternativeRoute && (
            <div className="bg-white/70 rounded-lg p-3 mb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">مسار بديل مقترح</p>
                  <p className="text-xs text-gray-600">
                    {alert.alternativeRoute && typeof alert.alternativeRoute === 'object' && 'distance' in alert.alternativeRoute && alert.alternativeRoute.distance
                      ? `${Number(alert.alternativeRoute.distance).toFixed(1)} كم • `
                      : ''}
                    {alert.alternativeRoute && typeof alert.alternativeRoute === 'object' && 'estimatedTime' in alert.alternativeRoute && alert.alternativeRoute.estimatedTime
                      ? `${Math.round(Number(alert.alternativeRoute.estimatedTime))} دقيقة`
                      : alert.alternativeRoute && typeof alert.alternativeRoute === 'object' && 'suggested' in alert.alternativeRoute
                      ? 'مسار بديل متاح'
                      : 'مسار بديل متاح'}
                  </p>
                </div>
                {onRouteClick && (
                  <button
                    onClick={onRouteClick}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                  >
                    <Navigation className="h-4 w-4" />
                    فتح في الملاح
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

