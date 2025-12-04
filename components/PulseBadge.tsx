'use client'

import { cn } from '@/lib/utils'

interface PulseBadgeProps {
  count: number
  className?: string
}

export function PulseBadge({ count, className }: PulseBadgeProps) {
  if (count === 0) return null

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse',
        className
      )}
    >
      {count > 9 ? '9+' : count}
    </span>
  )
}

