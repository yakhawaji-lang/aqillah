import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 بدء إنشاء البيانات الوهمية الواقعية...')

    // تشغيل السكريبت
    const { stdout, stderr } = await execAsync('npm run db:seed', {
      cwd: process.cwd(),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer
    })

    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️ تحذيرات:', stderr)
    }

    console.log('✅ تم إنشاء البيانات بنجاح')
    console.log(stdout)

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء البيانات الوهمية الواقعية بنجاح',
      output: stdout,
    })
  } catch (error: any) {
    console.error('❌ خطأ في إنشاء البيانات:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل في إنشاء البيانات',
        details: error.stdout || error.stderr,
      },
      { status: 500 }
    )
  }
}

