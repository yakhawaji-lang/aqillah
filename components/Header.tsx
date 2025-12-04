'use client'

import { MapPin, Bell, Settings, Menu } from 'lucide-react'
import { useState } from 'react'

export function Header() {
  const [notifications, setNotifications] = useState(3)

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="bg-primary-500 p-2 rounded-lg">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">عَقِلْها</h1>
              <p className="text-xs text-gray-500">نظام تحليل الازدحام المروري</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6 space-x-reverse">
            <a href="/dashboard" className="text-gray-700 hover:text-primary-600 font-medium">
              لوحة التحكم
            </a>
            <a href="/map" className="text-gray-700 hover:text-primary-600 font-medium">
              الخريطة
            </a>
            <a href="/alerts" className="text-gray-700 hover:text-primary-600 font-medium">
              التنبيهات
            </a>
            <a href="/government" className="text-gray-700 hover:text-primary-600 font-medium">
              لوحة الحكومة
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4 space-x-reverse">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-1 left-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Settings className="h-5 w-5" />
            </button>
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition">
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

