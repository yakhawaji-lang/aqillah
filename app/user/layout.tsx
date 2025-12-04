import { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'عَقِلْها - تطبيق المستخدم',
  description: 'تطبيق جوال لتحليل الازدحام المروري وتوجيهات ذكية',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'عَقِلْها',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#006633',
}

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-md mx-auto bg-gray-50 min-h-screen">
      {children}
    </div>
  )
}

