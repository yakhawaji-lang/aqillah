'use client'

import Link from 'next/link'
import { MapPin, Building2, Users, ArrowLeft } from 'lucide-react'

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12 text-white">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
              <MapPin className="h-12 w-12 text-white" />
            </div>
            <div className="text-right">
              <h1 className="text-4xl md:text-5xl font-bold mb-2">عَقِلْها</h1>
              <p className="text-xl md:text-2xl opacity-90">نظام وطني ذكي لتحليل الازدحام المروري</p>
            </div>
          </div>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            نظام ذكي يعتمد على بيانات تحركات الجوال المجهولة لتحليل الازدحام المروري وتقديم تنبؤات وتوجيهات ذكية
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* تطبيق المستخدم */}
          <Link
            href="/user"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-right block"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <ArrowLeft className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">تطبيق المستخدم</h2>
            <p className="text-gray-600 mb-4">
              تطبيق جوال تفاعلي للمستخدمين الأفراد
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                خريطة تفاعلية لحالة الازدحام
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                تنبيهات فورية وذكية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                حساب المسار الأسرع
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                تنبؤات مستقبلية
              </li>
            </ul>
          </Link>

          {/* لوحة الحكومة */}
          <Link
            href="/government"
            className="group bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-right block"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="p-4 bg-primary-100 rounded-xl group-hover:bg-primary-200 transition">
                <Building2 className="h-8 w-8 text-primary-600" />
              </div>
              <ArrowLeft className="h-6 w-6 text-gray-400 group-hover:text-primary-600 transition" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">لوحة التحكم الحكومية</h2>
            <p className="text-gray-600 mb-4">
              لوحة قيادة متقدمة للمسؤولين والجهات الحكومية
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                نظرة شاملة على حالة المرور الوطنية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                رسوم بيانية وتحليلات متقدمة
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                قرارات مرورية ذكية
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary-600">✓</span>
                تقييم أثر التدخلات
              </li>
            </ul>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition font-medium"
          >
            لوحة التحكم العامة
          </Link>
          <Link
            href="/map"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition font-medium"
          >
            الخريطة التفاعلية
          </Link>
          <Link
            href="/alerts"
            className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 transition font-medium"
          >
            التنبيهات
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/80 text-sm">
          <p>نظام وطني ذكي - عَقِلْها</p>
          <p className="mt-2">بيانات مجهولة • خصوصية محمية • ذكاء استباقي</p>
        </div>
      </div>
    </div>
  )
}
