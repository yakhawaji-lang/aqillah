/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // تجاهل تحذيرات ESLint أثناء البناء
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['tile.openstreetmap.org'],
    unoptimized: process.env.NODE_ENV === 'production' && process.env.BUILD_FOR_ANDROID === 'true',
  },
  // للبناء كتطبيق Android
  ...(process.env.BUILD_FOR_ANDROID === 'true' && {
    output: 'export',
    trailingSlash: true,
  }),
  // إخفاء overlay الأخطاء في وضع التطوير لأخطاء MetaMask
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  // تعطيل overlay الأخطاء في وضع التطوير (اختياري - يمكن تفعيله لاحقاً)
  // webpack: (config, { dev, isServer }) => {
  //   if (dev && !isServer) {
  //     config.optimization = {
  //       ...config.optimization,
  //       minimize: false,
  //     }
  //   }
  //   return config
  // },
}

module.exports = nextConfig

