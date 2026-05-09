import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Headers de segurança para todas as rotas
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',            value: 'nosniff' },
          { key: 'X-Frame-Options',                   value: 'DENY' },
          { key: 'Referrer-Policy',                   value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',                value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security',         value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Cache: API routes nunca devem ser cacheadas
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
        ],
      },
    ]
  },
}

export default nextConfig