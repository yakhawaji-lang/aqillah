import { NextResponse } from 'next/server'

/**
 * API endpoint للتحقق من نسخة التطبيق المرفوعة
 * يمكن الوصول إليه عبر: https://aqillah.vercel.app/api/version
 */
export async function GET() {
  // معلومات الإصدار من آخر commit
  const version = {
    commit: '4e4235e',
    message: 'تحسين: معالجة شاملة لأخطاء MetaMask وإصلاح وحدات الرؤية',
    timestamp: new Date().toISOString(),
    features: [
      'معالجة أخطاء MetaMask في app/providers.tsx',
      'تحسين معالجة الأخطاء في app/error.tsx',
      'إصلاح وحدات الرؤية في lib/services/weather.ts',
    ],
  }

  return NextResponse.json(version, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}

