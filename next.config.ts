import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Impede MIME sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Impede clickjacking
          { key: 'X-Frame-Options',           value: 'DENY' },
          // Proteção XSS legada
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          // Controla informações no Referer
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Desativa features desnecessárias
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          // Força HTTPS por 2 anos
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
      {
        // Headers específicos para APIs — sem cache
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