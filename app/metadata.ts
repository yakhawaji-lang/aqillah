import { Metadata } from 'next'

export const siteConfig: Metadata = {
  title: {
    default: 'عَقِلْها - نظام وطني ذكي لتحليل الازدحام المروري',
    template: '%s | عَقِلْها',
  },
  description: 'نظام وطني ذكي داخل منظومة أبشر لتحليل الازدحام المروري وتقديم تنبؤات وتوجيهات ذكية',
  keywords: [
    'ازدحام مروري',
    'أبشر',
    'نقل ذكي',
    'مرور',
    'السعودية',
    'الرياض',
    'جدة',
    'تحليل حركة المرور',
    'تنبؤ الازدحام',
  ],
  authors: [
    {
      name: 'عَقِلْها',
    },
  ],
  creator: 'عَقِلْها',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'ar_SA',
    url: '/',
    siteName: 'عَقِلْها',
    title: 'عَقِلْها - نظام وطني ذكي لتحليل الازدحام المروري',
    description: 'نظام وطني ذكي داخل منظومة أبشر لتحليل الازدحام المروري',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'عَقِلْها - نظام وطني ذكي لتحليل الازدحام المروري',
    description: 'نظام وطني ذكي داخل منظومة أبشر لتحليل الازدحام المروري',
  },
  robots: {
    index: true,
    follow: true,
  },
}

