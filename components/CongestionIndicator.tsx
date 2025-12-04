'use client'

import { getCongestionColor, getCongestionStatus } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CongestionIndicatorProps {
  index: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function CongestionIndicator({ 
  index, 
  showLabel = true,
  size = 'md' 
}: CongestionIndicatorProps) {
  const color = getCongestionColor(index)
  const status = getCongestionStatus(index)
  
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  }

  const colorClasses: Record<string, string> = {
    'traffic-green': 'bg-traffic-green',
    'traffic-yellow': 'bg-traffic-yellow',
    'traffic-orange': 'bg-traffic-orange',
    'traffic-red': 'bg-traffic-red',
    'traffic-dark': 'bg-traffic-dark',
  }

  return (
    <div className="flex items-center gap-2">
      <div 
        className={cn(
          sizeClasses[size],
          'rounded-full animate-pulse-slow',
          colorClasses[color] || 'bg-traffic-green'
        )}
      />
      {showLabel && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{status}</span>
          <span className="text-xs text-gray-500">({index})</span>
        </div>
      )}
    </div>
  )
}

