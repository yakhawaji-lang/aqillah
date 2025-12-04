'use client'

import { useEffect, useRef } from 'react'

interface SmoothScrollProps {
  children: React.ReactNode
  className?: string
}

export function SmoothScroll({ children, className }: SmoothScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault()
        container.scrollBy({
          top: e.deltaY,
          behavior: 'smooth',
        })
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

