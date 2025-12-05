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
}

module.exports = nextConfig

