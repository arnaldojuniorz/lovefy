import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const SLUG_REGEX = /^[a-z0-9-]{3,80}$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:slug',
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`slug:${ip}`)

  if (!success) {
    return NextResponse.json(
      { disponivel: false, error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429 }
    )
  }

  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || slug.length < 3 || slug.length > 80) {
    return NextResponse.json(
      { disponivel: false, error: 'Slug inválido' },
      { status: 400 }
    )
  }

  const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')

  if (!SLUG_REGEX.test(slugLimpo)) {
    return NextResponse.json(
      { disponivel: false, error: 'Slug inválido' },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('cartas')
    .select('id')
    .eq('slug', slugLimpo)
    .maybeSingle()

  if (error) {
    console.error('[cartas/slug] erro ao consultar banco:', error.message)
    return NextResponse.json(
      { disponivel: false, error: 'Erro ao verificar slug' },
      { status: 500 }
    )
  }

  return NextResponse.json({ disponivel: !data }, { status: 200 })
}