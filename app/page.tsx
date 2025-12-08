'use client'

import Link from 'next/link'
import { MapPin, Building2, Users, ArrowLeft, Download, Smartphone, Package } from 'lucide-react'

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

        {/* تحميل التطبيق */}
        <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Smartphone className="h-8 w-8 text-white" />
              <h2 className="text-2xl md:text-3xl font-bold text-white">حمّل التطبيق الآن</h2>
            </div>
            <p className="text-white/90 text-lg mb-6">
              احصل على أحدث نسخة من تطبيق عَقِلْها واستمتع بجميع المميزات
            </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
               <a
                 href="https://apps.apple.com/app/aqillah"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="group flex items-center gap-3 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-900 transition-all hover:scale-105 shadow-lg"
               >
                 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                 </svg>
                 <div className="text-right">
                   <div className="text-xs opacity-80">حمّل من</div>
                   <div className="text-lg font-bold">App Store</div>
                 </div>
                 <Download className="w-5 h-5 opacity-80 group-hover:opacity-100 transition" />
               </a>
               <a
                 href="https://play.google.com/store/apps/details?id=com.aqillah.app"
                 target="_blank"
                 rel="noopener noreferrer"
                 className="group flex items-center gap-3 bg-black text-white px-6 py-4 rounded-xl hover:bg-gray-900 transition-all hover:scale-105 shadow-lg"
               >
                 <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                 </svg>
                 <div className="text-right">
                   <div className="text-xs opacity-80">حمّل من</div>
                   <div className="text-lg font-bold">Google Play</div>
                 </div>
                 <Download className="w-5 h-5 opacity-80 group-hover:opacity-100 transition" />
               </a>
               <div className="group flex items-center gap-3 bg-primary-600/50 text-white px-6 py-4 rounded-xl shadow-lg relative cursor-not-allowed">
                 <Package className="w-8 h-8 opacity-60" />
                 <div className="text-right">
                   <div className="text-xs opacity-70">تحميل مباشر</div>
                   <div className="text-lg font-bold opacity-80">APK</div>
                   <div className="text-xs opacity-60 mt-1">قريباً</div>
                 </div>
                 <Download className="w-5 h-5 opacity-50" />
                 <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                   <span className="text-xs font-medium opacity-80">سيتم إضافته قريباً</span>
                 </div>
               </div>
             </div>
            <p className="text-white/70 text-sm mt-4">
              النسخة المحدثة • آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
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
