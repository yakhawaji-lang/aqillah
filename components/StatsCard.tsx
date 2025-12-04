'use client'

import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number | React.ReactNode
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  className?: string
}

export function StatsCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  className 
}: StatsCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-primary-50 rounded-lg">
          <Icon className="h-6 w-6 text-primary-600" />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium",
            trend.isPositive ? "text-green-600" : "text-red-600"
          )}>
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900">
        {typeof value === 'string' || typeof value === 'number' ? value : value}
      </div>
    </div>
  )
}

