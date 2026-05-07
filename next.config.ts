import type { NextConfig } from 'next'

const ALLOWED_ORIGIN = 'https://www.lovefy.app.br'

const nextConfig: NextConfig = {
  async headers() {
    return [
      // ─── Headers globais de segurança ─────────────────
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },

      // ─── APIs — sem cache + CORS restritivo ───────────
      {
        source: '/api/(.*)',
        headers: [
          // Sem cache
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
          { key: 'Pragma',        value: 'no-cache' },
          // ✅ CORS — só aceita requisições do próprio domínio
          { key: 'Access-Control-Allow-Origin',  value: ALLOWED_ORIGIN },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
          { key: 'Access-Control-Max-Age',       value: '86400' },
        ],
      },

      // ─── Webhook — permite origem do Mercado Pago ─────
      {
        source: '/api/webhook',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ]
  },
}

export default nextConfig