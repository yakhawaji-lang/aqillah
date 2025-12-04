'use client'

import { useEffect, useState } from 'react'
import { Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RealtimeIndicatorProps {
  isConnected: boolean
  lastUpdate?: Date | string
  onRefresh?: () => void
}

export function RealtimeIndicator({ isConnected, lastUpdate, onRefresh }: RealtimeIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('')
  const [statusColor, setStatusColor] = useState<'green' | 'yellow' | 'orange' | 'red'>('green')

  useEffect(() => {
    if (!isConnected || !lastUpdate) {
      setTimeAgo('غير متصل')
      setStatusColor('red')
      return
    }

    const updateTimeAgo = () => {
      const updateDate = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate
      const now = Date.now()
      const diff = now - updateDate.getTime()
      const seconds = Math.floor(diff / 1000)
      const minutes = Math.floor(seconds / 60)
      const hours = Math.floor(minutes / 60)

      // تحديد اللون حسب عمر البيانات
      if (seconds < 10) {
        setStatusColor('green')
      } else if (seconds < 30) {
        setStatusColor('yellow')
      } else if (seconds < 60) {
        setStatusColor('orange')
      } else {
        setStatusColor('red')
      }

      // تنسيق الوقت بشكل أكثر وضوحاً
      if (seconds < 1) {
        setTimeAgo('الآن')
      } else if (seconds < 60) {
        setTimeAgo(`${seconds} ثانية`)
      } else if (minutes < 60) {
        setTimeAgo(`${minutes} دقيقة${minutes > 1 ? '' : ''}`)
      } else {
        setTimeAgo(`${hours} ساعة${hours > 1 ? '' : ''}`)
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 1000) // تحديث كل ثانية

    return () => clearInterval(interval)
  }, [isConnected, lastUpdate])

  const colorClasses = {
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    red: 'text-red-600 bg-red-50 border-red-200',
  }

  const dotColors = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300",
      isConnected ? colorClasses[statusColor] : "text-gray-500 bg-gray-50 border-gray-200"
    )}>
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <>
            <div className={cn(
              "h-2 w-2 rounded-full animate-pulse",
              dotColors[statusColor]
            )} />
            <Wifi className="h-3.5 w-3.5" />
          </>
        ) : (
          <>
            <div className="h-2 w-2 bg-gray-400 rounded-full" />
            <WifiOff className="h-3.5 w-3.5" />
          </>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {isConnected && lastUpdate ? (
          <>
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">
              {timeAgo === 'الآن' ? (
                <span className="flex items-center gap-1">
                  <span className="animate-pulse">●</span>
                  {timeAgo}
                </span>
              ) : (
                `محدث منذ ${timeAgo}`
              )}
            </span>
          </>
        ) : (
          <span className="text-xs font-medium">غير متصل</span>
        )}
      </div>

      {isConnected && onRefresh && (
        <button
          onClick={onRefresh}
          className="ml-1 p-1 hover:bg-white/50 rounded transition-colors"
          title="تحديث البيانات"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

