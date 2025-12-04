'use client'

import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (query: string) => void
  suggestions?: string[]
  className?: string
}

export function SearchBar({
  placeholder = 'ابحث...',
  onSearch,
  suggestions = [],
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])

  useEffect(() => {
    if (query.length > 0) {
      const filtered = suggestions.filter((s) =>
        s.toLowerCase().includes(query.toLowerCase())
      )
      setFilteredSuggestions(filtered.slice(0, 5))
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [query, suggestions])

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setShowSuggestions(false)
    onSearch?.(searchQuery)
  }

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(query)
            }
          }}
          placeholder={placeholder}
          className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              onSearch?.('')
            }}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSearch(suggestion)}
              className="w-full text-right px-4 py-2 hover:bg-gray-50 transition text-sm"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

