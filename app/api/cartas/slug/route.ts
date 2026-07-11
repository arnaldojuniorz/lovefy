import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getClientIp } from '@/lib/get-client-ip'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Esta rota depende inteiramente de dados por requisição (query string, IP)
// e consulta o banco a cada chamada — nunca deve ser servida de cache. O
// Next.js já trata isso como dinâmico automaticamente por causa do uso de
// request.headers/request.nextUrl, mas deixamos explícito para remover
// ambiguidade e blindar contra regressão futura caso o código mude.
export const dynamic = 'force-dynamic'

// Slug deve ter só letras minúsculas, números e hífens simples entre
// caracteres alfanuméricos: sem hífen no início/fim, sem hífens
// consecutivos. Isso evita slugs degenerados como "---" ou
// "--ana--e--lucas--", que a regex anterior aceitava por serem tecnicamente
// compostos só por [a-z0-9-].
//
// IMPORTANTE: esta mesma regra precisa ser espelhada no endpoint que
// efetivamente grava o slug (provavelmente api/cartas/route.ts), para que a
// checagem de disponibilidade e a criação real nunca aceitem conjuntos
// diferentes de slugs válidos.
const SLUG_REGEX = /^(?=.{3,80}$)[a-z0-9]+(?:-[a-z0-9]+)*$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:slug',
})

const NO_STORE = { 'Cache-Control': 'no-store' } as const

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`slug:${ip}`)

  if (!success) {
    return NextResponse.json(
      { disponivel: false, error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429, headers: NO_STORE }
    )
  }

  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || slug.length < 3 || slug.length > 80) {
    return NextResponse.json(
      { disponivel: false, error: 'Slug inválido' },
      { status: 400, headers: NO_STORE }
    )
  }

  const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')

  if (!SLUG_REGEX.test(slugLimpo)) {
    return NextResponse.json(
      { disponivel: false, error: 'Slug inválido' },
      { status: 400, headers: NO_STORE }
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
      { status: 500, headers: NO_STORE }
    )
  }

  // Resposta é uma checagem em tempo real (o slug pode ser reservado por
  // outra pessoa no instante seguinte) — nunca deve ser cacheada em nenhuma
  // camada (CDN, navegador, etc).
  return NextResponse.json(
    { disponivel: !data },
    { status: 200, headers: NO_STORE }
  )
}