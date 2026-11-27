import type { NextConfig } from 'next'

const NOINDEX_HEADER = [
  {
    key: 'X-Robots-Tag',
    value: 'noindex, nofollow',
  },
]

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async headers() {
    return [
      { source: '/admin', headers: NOINDEX_HEADER },
      { source: '/admin/:path*', headers: NOINDEX_HEADER },
      { source: '/cart', headers: NOINDEX_HEADER },
      { source: '/cart/:path*', headers: NOINDEX_HEADER },
      { source: '/orders/:path*', headers: NOINDEX_HEADER },
      { source: '/profile', headers: NOINDEX_HEADER },
      { source: '/profile/:path*', headers: NOINDEX_HEADER },
      { source: '/login', headers: NOINDEX_HEADER },
      { source: '/signup', headers: NOINDEX_HEADER },
      { source: '/forgot-password', headers: NOINDEX_HEADER },
      { source: '/reset-password', headers: NOINDEX_HEADER },
      { source: '/auth/:path*', headers: NOINDEX_HEADER },
      { source: '/api/:path*', headers: NOINDEX_HEADER },
    ]
  },
}

export default nextConfig
