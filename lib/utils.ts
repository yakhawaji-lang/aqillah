import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// حساب مؤشر الازدحام بناءً على الكثافة والسرعة
export function calculateCongestionIndex(
  density: number, // جهاز/كم
  avgSpeed: number, // كم/س
  freeFlowSpeed: number = 60 // السرعة الطبيعية للطريق
): number {
  // مؤشر يعتمد على السرعة النسبية والكثافة
  const speedRatio = avgSpeed / freeFlowSpeed
  const densityFactor = Math.min(density / 50, 1) // كثافة عالية = 50+ جهاز/كم
  
  // مؤشر مركب (0-100)
  const index = Math.round(
    (1 - speedRatio) * 60 + densityFactor * 40
  )
  
  return Math.max(0, Math.min(100, index))
}

// تحديد لون الازدحام
export function getCongestionColor(index: number): string {
  if (index < 30) return "traffic-green"
  if (index < 50) return "traffic-yellow"
  if (index < 70) return "traffic-orange"
  if (index < 90) return "traffic-red"
  return "traffic-dark"
}

// تحديد حالة الازدحام
export function getCongestionStatus(index: number): string {
  if (index < 30) return "سلس"
  if (index < 50) return "متوسط"
  if (index < 70) return "مزدحم"
  if (index < 90) return "مزدحم جداً"
  return "اختناق"
}

// تنسيق الوقت
export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '--:--'
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      return '--:--'
    }
    
    return new Intl.DateTimeFormat('ar-SA', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    console.error('Error formatting time:', error)
    return '--:--'
  }
}

// تنسيق التاريخ والوقت
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return 'تاريخ غير صالح'
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date)
    
    // التحقق من صحة التاريخ
    if (isNaN(dateObj.getTime())) {
      return 'تاريخ غير صالح'
    }
    
    return new Intl.DateTimeFormat('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(dateObj)
  } catch (error) {
    console.error('Error formatting date time:', error)
    return 'تاريخ غير صالح'
  }
}

