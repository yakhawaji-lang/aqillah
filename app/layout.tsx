import type { Metadata } from "next";
import { Cairo, Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  variable: "--font-tajawal",
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "عَقِلْها - نظام وطني ذكي لتحليل الازدحام المروري",
  description: "نظام وطني ذكي داخل منظومة أبشر لتحليل الازدحام المروري وتقديم تنبؤات وتوجيهات ذكية",
  keywords: ["ازدحام مروري", "أبشر", "نقل ذكي", "مرور", "السعودية"],
  icons: {
    icon: '/favicon.ico',
    apple: '/icon-192.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${cairo.variable} ${tajawal.variable} font-arabic`}>
        <Providers>
          {children}
          <Toaster 
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                fontFamily: 'var(--font-cairo)',
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}

