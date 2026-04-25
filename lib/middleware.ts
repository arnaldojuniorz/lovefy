import { NextRequest, NextResponse } from 'next/server'

const DEFAULT_ORIGINS = ['https://www.lovefy.app.br', 'https://lovefy.app.br']

function toOrigin(value: string | null | undefined): string | null {
  if (!value) return null
  const clean = value.replace(/[\r\n\t ]+/g, '').trim()
  if (!clean) return null

  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.origin
  } catch {
    return null
  }
}

function getAllowedOrigins(): Set<string> {
  const fromEnv = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((v) => toOrigin(v))
    .filter((v): v is string => Boolean(v))

  const appOrigin = toOrigin(process.env.NEXT_PUBLIC_APP_URL ?? '')
  const allowed = new Set<string>([...DEFAULT_ORIGINS, ...fromEnv])

  if (appOrigin) allowed.add(appOrigin)
  return allowed
}

const ALLOWED_ORIGINS = getAllowedOrigins()

function applySecurityHeaders(res: NextResponse) {
  res.headers.set('X-Frame-Options', 'DENY')
  res.headers.set('X-Content-Type-Options', 'nosniff')
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  res.headers.set('Cache-Control', 'no-store')
  return res
}

function applyCorsHeaders(res: NextResponse, origin: string | null) {
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin)
    res.headers.set('Vary', 'Origin')
  }

  res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS')
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-signature, x-request-id'
  )
  res.headers.set('Access-Control-Max-Age', '600')

  return res
}

export function middleware(request: NextRequest) {
  const origin = toOrigin(request.headers.get('origin'))

  if (request.method === 'OPTIONS') {
    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return NextResponse.json({ error: 'Origin não permitido' }, { status: 403 })
    }

    const preflight = new NextResponse(null, { status: 204 })
    applyCorsHeaders(preflight, origin)
    return applySecurityHeaders(preflight)
  }

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return NextResponse.json({ error: 'Origin não permitido' }, { status: 403 })
  }

  const response = NextResponse.next()
  applyCorsHeaders(response, origin)
  return applySecurityHeaders(response)
}

export const config = {
  matcher: ['/api/:path*'],
}