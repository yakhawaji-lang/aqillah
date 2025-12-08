import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // محاولة قراءة الملف من public/downloads
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'aqillah.apk')
    
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      // إذا لم يوجد الملف محلياً، إرجاع رابط للتحميل من Vercel
      return NextResponse.json(
        { 
          error: 'الملف غير متوفر محلياً',
          message: 'يرجى تحميل APK من الروابط التالية:',
          downloadLinks: {
            direct: 'https://aqillah.vercel.app/api/download/apk',
            instructions: 'سيتم إضافة ملف APK قريباً. يمكنك بناء APK محلياً باستخدام: npm run build:android && cd android && ./gradlew.bat assembleDebug'
          },
          available: false
        },
        { status: 404 }
      )
    }

    // قراءة الملف
    const fileBuffer = fs.readFileSync(filePath)
    const fileStats = fs.statSync(filePath)

    // إرجاع الملف مع headers مناسبة
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="aqillah.apk"',
        'Content-Length': fileStats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving APK file:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء تحميل الملف',
        message: 'يرجى المحاولة لاحقاً أو التواصل مع الدعم الفني.',
        available: false
      },
      { status: 500 }
    )
  }
}

