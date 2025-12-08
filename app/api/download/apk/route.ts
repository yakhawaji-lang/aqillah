import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const filePath = path.join(process.cwd(), 'public', 'downloads', 'aqillah.apk')
    
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { 
          error: 'الملف غير متوفر حالياً',
          message: 'سيتم إضافة ملف APK قريباً. يرجى المحاولة لاحقاً أو استخدام روابط App Store أو Google Play.',
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

