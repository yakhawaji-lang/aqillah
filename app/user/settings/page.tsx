'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { ArrowLeft, Bell, Volume2, VolumeX, Moon, Car } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState({
    notifications: {
      enabled: true,
      critical: true,
      high: true,
      medium: true,
      low: false,
    },
    sound: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '06:00',
    },
    drivingMode: {
      enabled: false,
      silent: false,
    },
  })

  const handleSave = () => {
    // TODO: Save to backend
    toast.success('تم حفظ الإعدادات')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          العودة
        </button>

        <h1 className="text-2xl font-bold mb-6">الإعدادات</h1>

        <div className="space-y-6">
          {/* إعدادات التنبيهات */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              إعدادات التنبيهات
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>تفعيل التنبيهات</span>
                <input
                  type="checkbox"
                  checked={settings.notifications.enabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      notifications: { ...settings.notifications, enabled: e.target.checked },
                    })
                  }
                  className="w-5 h-5"
                />
              </label>
              
              {['critical', 'high', 'medium', 'low'].map((level) => (
                <label key={level} className="flex items-center justify-between">
                  <span>تنبيهات {level === 'critical' ? 'حرجة' : level === 'high' ? 'عالية' : level === 'medium' ? 'متوسطة' : 'منخفضة'}</span>
                  <input
                    type="checkbox"
                    checked={settings.notifications[level as keyof typeof settings.notifications] as boolean}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        notifications: {
                          ...settings.notifications,
                          [level]: e.target.checked,
                        },
                      })
                    }
                    className="w-5 h-5"
                    disabled={!settings.notifications.enabled}
                  />
                </label>
              ))}
            </div>
          </div>

          {/* إعدادات الصوت */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              {settings.sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              إعدادات الصوت
            </h2>
            
            <label className="flex items-center justify-between">
              <span>تفعيل الأصوات</span>
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => setSettings({ ...settings, sound: e.target.checked })}
                className="w-5 h-5"
              />
            </label>
          </div>

          {/* الساعات الهادئة */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Moon className="w-5 h-5" />
              الساعات الهادئة
            </h2>
            
            <label className="flex items-center justify-between mb-4">
              <span>تفعيل الساعات الهادئة</span>
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    quietHours: { ...settings.quietHours, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </label>
            
            {settings.quietHours.enabled && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2">من</label>
                  <input
                    type="time"
                    value={settings.quietHours.start}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, start: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">إلى</label>
                  <input
                    type="time"
                    value={settings.quietHours.end}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        quietHours: { ...settings.quietHours, end: e.target.value },
                      })
                    }
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* وضع القيادة */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Car className="w-5 h-5" />
              وضع القيادة
            </h2>
            
            <label className="flex items-center justify-between mb-4">
              <span>تفعيل وضع القيادة</span>
              <input
                type="checkbox"
                checked={settings.drivingMode.enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    drivingMode: { ...settings.drivingMode, enabled: e.target.checked },
                  })
                }
                className="w-5 h-5"
              />
            </label>
            
            {settings.drivingMode.enabled && (
              <label className="flex items-center justify-between">
                <span>الوضع الصامت أثناء القيادة</span>
                <input
                  type="checkbox"
                  checked={settings.drivingMode.silent}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      drivingMode: { ...settings.drivingMode, silent: e.target.checked },
                    })
                  }
                  className="w-5 h-5"
                />
              </label>
            )}
          </div>

          <button
            onClick={handleSave}
            className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700"
          >
            حفظ الإعدادات
          </button>
        </div>
      </div>
    </div>
  )
}

