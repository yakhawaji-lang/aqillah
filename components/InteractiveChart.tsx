'use client'

import { useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface InteractiveChartProps {
  data: ChartData[]
  type?: 'line' | 'area' | 'bar'
  dataKey: string
  title?: string
  color?: string
  showTrend?: boolean
}

export function InteractiveChart({
  data,
  type = 'line',
  dataKey,
  title,
  color = '#006633',
  showTrend = true,
}: InteractiveChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const calculateTrend = () => {
    if (data.length < 2) return null
    const first = data[0][dataKey] || data[0].value || 0
    const last = data[data.length - 1][dataKey] || data[data.length - 1].value || 0
    if (first === 0) return null
    const trend = ((last - first) / first) * 100
    return trend
  }

  const trend = showTrend ? calculateTrend() : null

  const ChartComponent = {
    line: Line,
    area: Area,
    bar: Bar,
  }[type]

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          {trend !== null && (
            <div className={`flex items-center gap-1 ${trend >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              {trend >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      )}

      {(!data || data.length === 0) ? (
        <div className="h-[300px] flex items-center justify-center text-gray-500">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>لا توجد بيانات للعرض</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {type === 'area' ? (
            <AreaChart
              data={data}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setHoveredIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={data.length > 0 && data[0]?.name ? "name" : data.length > 0 && data[0]?.time ? "time" : "name"} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                fill={color}
                fillOpacity={0.2}
              />
            </AreaChart>
          ) : type === 'bar' ? (
            <BarChart
              data={data}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setHoveredIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={data.length > 0 && data[0]?.name ? "name" : data.length > 0 && data[0]?.time ? "time" : "name"} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart
              data={data}
              onMouseMove={(state) => {
                if (state?.activeTooltipIndex !== undefined) {
                  setHoveredIndex(state.activeTooltipIndex)
                }
              }}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={data.length > 0 && data[0]?.name ? "name" : data.length > 0 && data[0]?.time ? "time" : "name"} />
              <YAxis />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={color}
                strokeWidth={2}
                dot={{ fill: color, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      )}

      {hoveredIndex !== null && data && data[hoveredIndex] && (
        <div className="mt-4 text-center text-sm text-gray-600">
          {data[hoveredIndex]?.name || data[hoveredIndex]?.time || 'N/A'}: {data[hoveredIndex]?.[dataKey] || data[hoveredIndex]?.value || 0}
        </div>
      )}
    </div>
  )
}

