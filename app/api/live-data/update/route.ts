import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 بدء تحديث البيانات الحية...')
    
    // تشغيل سكريبت التحديث
    const { stdout, stderr } = await execAsync('tsx scripts/update-live-data.ts', {
      cwd: process.cwd(),
      maxBuffer: 10 * 1024 * 1024,
    })
    
    if (stderr && !stderr.includes('warning')) {
      console.error('⚠️ تحذيرات:', stderr)
    }
    
    console.log('✅ تم تحديث البيانات بنجاح')
    console.log(stdout)
    
    return NextResponse.json({
      success: true,
      message: 'تم تحديث البيانات الحية بنجاح',
      output: stdout,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('❌ خطأ في تحديث البيانات:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'فشل في تحديث البيانات',
        details: error.stdout || error.stderr,
      },
      { status: 500 }
    )
  }
}

