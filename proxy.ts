import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = Redis.fromEnv()

const LIMITES: Record<string, number> = {
  '/api/pix':           8,
  '/api/checkout':      6,
  '/api/cartas':        30,
  '/api/upload':        15,
  '/api/mapa-estrelas': 10,
  '/api/webhook':       30,
}

const limiters = new Map<string, Ratelimit>()

function getLimiter(path: string): { limiter: Ratelimit; prefix: string } | null {
  for (const [route, max] of Object.entries(LIMITES)) {
    if (path.startsWith(route)) {
      if (!limiters.has(route)) {
        limiters.set(route, new Ratelimit({
          redis,
          limiter:   Ratelimit.slidingWindow(max, '60s'),
          prefix:    'lovefy:rl:' + route,
          analytics: false,
        }))
      }
      return { limiter: limiters.get(route)!, prefix: route }
    }
  }
  return null
}

function getIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'anonymous'
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const match = getLimiter(pathname)

  if (!match) return NextResponse.next()

  const ip = getIp(request)

  try {
    const { success, limit, remaining, reset } = await match.limiter.limit(ip)

    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em instantes.' },
        {
          status: 429,
          headers: {
            'Retry-After':           String(retryAfter),
            'X-RateLimit-Limit':     String(limit),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset':     String(Math.floor(reset / 1000)),
          },
        }
      )
    }

    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Limit',     String(limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset',     String(Math.floor(reset / 1000)))
    return response

  } catch {
    console.error('[proxy] redis rate limit falhou - passando sem limitar')
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    '/api/pix/:path*',
    '/api/checkout/:path*',
    '/api/cartas/:path*',
    '/api/upload/:path*',
    '/api/mapa-estrelas/:path*',
    '/api/webhook/:path*',
  ],
}