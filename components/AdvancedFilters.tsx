'use client'

import { useState } from 'react'
import { Filter, X, SlidersHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterOption {
  label: string
  value: string
}

interface AdvancedFiltersProps {
  cities?: FilterOption[]
  severity?: FilterOption[]
  types?: FilterOption[]
  onFilterChange?: (filters: Record<string, string>) => void
}

export function AdvancedFilters({
  cities,
  severity,
  types,
  onFilterChange,
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<Record<string, string>>({
    city: 'all',
    severity: 'all',
    type: 'all',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFilterChange?.(newFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== 'all').length

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg border transition",
          activeFiltersCount > 0
            ? "bg-primary-50 border-primary-300 text-primary-700"
            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        )}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>الفلاتر</span>
        {activeFiltersCount > 0 && (
          <span className="bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {activeFiltersCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">الفلاتر</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {cities && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    المدينة
                  </label>
                  <select
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">الكل</option>
                    {cities.map((city) => (
                      <option key={city.value} value={city.value}>
                        {city.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {severity && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    مستوى الخطورة
                  </label>
                  <select
                    value={filters.severity}
                    onChange={(e) => handleFilterChange('severity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">الكل</option>
                    {severity.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {types && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع التنبيه
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">الكل</option>
                    {types.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    const resetFilters = {
                      city: 'all',
                      severity: 'all',
                      type: 'all',
                    }
                    setFilters(resetFilters)
                    onFilterChange?.(resetFilters)
                  }}
                  className="w-full py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  إعادة تعيين الفلاتر
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

