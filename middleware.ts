import { NextRequest, NextResponse } from 'next/server'

const WINDOW_MS = 60_000 // 1 minuto

const LIMITES: Record<string, number> = {
  '/api/pix':               5,
  '/api/checkout':          5,
  '/api/cartas':           20,
  '/api/upload':           10,
  '/api/upload-destaque':  10,
  '/api/mapa-estrelas':     5,
}

const store = new Map<string, { count: number; resetAt: number }>()

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}

function getLimit(pathname: string): number | null {
  for (const [path, limit] of Object.entries(LIMITES)) {
    if (pathname.startsWith(path)) return limit
  }
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const limit = getLimit(pathname)
  if (!limit) return NextResponse.next()

  const ip  = getIp(request)
  const key = `${ip}:${pathname}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return NextResponse.next()
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      {
        status: 429,
        headers: {
          'Retry-After':          String(retryAfter),
          'X-RateLimit-Limit':    String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset':    String(Math.floor(entry.resetAt / 1000)),
        },
      }
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/pix/:path*',
    '/api/checkout/:path*',
    '/api/cartas/:path*',
    '/api/upload/:path*',
    '/api/mapa-estrelas/:path*',
  ],
}