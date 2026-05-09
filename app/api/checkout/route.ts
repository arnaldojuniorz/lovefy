import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const PLANOS = {
  forever:   { preco: 9.9,  titulo: 'Carta Digital Para Sempre', categoria: 'services' },
  impressao: { preco: 6.9,  titulo: 'Carta para Impressão',      categoria: 'services' },
} as const

type Plano  = keyof typeof PLANOS
type Tipo   = 'digital' | 'impressao'
type Tabela = 'cartas' | 'cartas_impressao'

const UUID_REGEX  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(6, '60 s'),
  prefix: 'rl:checkout',
})

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://www.lovefy.app.br'
  const clean = String(raw).replace(/[\r\n\t ]+/g, '').trim()
  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid protocol')
    return url.origin
  } catch {
    return 'https://www.lovefy.app.br'
  }
}

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

function rateLimitHeaders(info: { limit: number; remaining: number; reset: number }) {
  return {
    'X-RateLimit-Limit':     String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset':     String(Math.floor(info.reset / 1000)),
  }
}

function jsonError(message: string, status: number, headers?: Record<string, string>) {
  return NextResponse.json({ error: message }, { status, headers })
}

function normalizePlano(value: unknown): Plano | null {
  if (typeof value !== 'string') return null
  const p = value.trim().toLowerCase()
  if (p === 'forever' || p === 'impressao') return p
  return null
}

function normalizeTipo(value: unknown, plano: Plano): Tipo | null {
  if (value === undefined || value === null) return plano === 'impressao' ? 'impressao' : 'digital'
  if (typeof value !== 'string') return null
  const t = value.trim().toLowerCase()
  if (t !== 'digital' && t !== 'impressao') return null
  return t
}

function sanitizeName(value: unknown, fallback = 'Cliente') {
  if (typeof value !== 'string') return fallback
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, 120)
  return clean || fallback
}

function splitName(fullName: string) {
  const parts = fullName.split(' ').filter(Boolean)
  const firstName = parts[0] ?? 'Cliente'
  const lastName  = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success, limit, remaining, reset } = await ratelimit.limit(`checkout:${ip}`)
  const baseHeaders = rateLimitHeaders({ limit, remaining, reset })

  if (!success) {
    const retryAfterSec = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    return jsonError('Muitas tentativas. Tente novamente em instantes.', 429, {
      ...baseHeaders,
      'Retry-After': String(retryAfterSec),
    })
  }

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return jsonError('Serviço temporariamente indisponível', 500, baseHeaders)
    }

    let parsedBody: unknown
    try {
      parsedBody = await request.json()
    } catch {
      return jsonError('JSON inválido', 400, baseHeaders)
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return jsonError('Payload inválido', 400, baseHeaders)
    }

    const body    = parsedBody as Record<string, unknown>
    const cartaId = typeof body.carta_id === 'string' ? body.carta_id.trim() : ''

    if (!UUID_REGEX.test(cartaId)) {
      return jsonError('carta_id inválido', 400, baseHeaders)
    }

    const plano = normalizePlano(body.plano)
    if (!plano) {
      return jsonError('plano inválido. Use "forever" ou "impressao"', 400, baseHeaders)
    }

    const tipo = normalizeTipo(body.tipo, plano)
    if (!tipo) {
      return jsonError('tipo inválido. Use "digital" ou "impressao"', 400, baseHeaders)
    }

    if (plano === 'impressao' && tipo !== 'impressao') {
      return jsonError('Inconsistência entre plano e tipo', 400, baseHeaders)
    }

    if (plano === 'forever' && tipo === 'impressao') {
      return jsonError('Inconsistência entre plano e tipo', 400, baseHeaders)
    }

    const tabela: Tabela = tipo === 'impressao' ? 'cartas_impressao' : 'cartas'

    const { data: cartaRaw, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('*')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[checkout] erro ao buscar carta')
      return jsonError('Erro ao iniciar checkout', 500, baseHeaders)
    }

    if (!cartaRaw) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    const carta = cartaRaw as Record<string, unknown>

    if (String(carta.status ?? '') === 'ativo') {
      return jsonError('Essa carta já foi paga/ativada', 409, baseHeaders)
    }

    const email = pickString(carta, ['email_pagador', 'email', 'seu_email', 'email_cliente'])?.toLowerCase() ?? ''
    if (!EMAIL_REGEX.test(email)) {
      return jsonError('Complete um e-mail válido antes de pagar', 400, baseHeaders)
    }

    const nomeCompleto = sanitizeName(
      pickString(carta, ['nome_pagador', 'nome_remetente', 'remetente', 'seu_nome', 'nome']) ?? 'Cliente'
    )
    const { firstName, lastName } = splitName(nomeCompleto)

    const baseUrl          = getBaseUrl()
    const planoSelecionado = PLANOS[plano]
    const externalReference = `${cartaId}|${plano}`

    const successParams = new URLSearchParams({ carta_id: cartaId, plano, tipo })
    const successUrl    = `${baseUrl}/obrigado?${successParams.toString()}`
    const failureUrl    = tipo === 'impressao' ? `${baseUrl}/imprimir` : `${baseUrl}/criar`

    const preference = new Preference(new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN }))

    const response = await preference.create({
      body: {
        items: [
          {
            id:          cartaId,
            title:       planoSelecionado.titulo,
            description: `Lovefy - ${planoSelecionado.titulo}`,
            category_id: planoSelecionado.categoria,
            quantity:    1,
            unit_price:  planoSelecionado.preco,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name:       nomeCompleto,
          email,
          first_name: firstName,
          last_name:  lastName,
        } as never,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl,
        },
        auto_return:          'approved',
        external_reference:   externalReference,
        notification_url:     `${baseUrl}/api/webhook`,
        statement_descriptor: 'LOVEFY',
        expires:              true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to:   new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })

    if (!response?.id || !response?.init_point) {
      return jsonError('Erro ao criar preferência de pagamento', 502, baseHeaders)
    }

    await supabaseAdmin
      .from(tabela)
      .update({
        mercadopago_preference_id: response.id,
        status: 'pendente_pagamento',
      })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])

    return NextResponse.json(
      { preference_id: response.id, checkout_url: response.init_point },
      { headers: baseHeaders }
    )

  } catch (error) {
    console.error('[checkout] erro interno:', error)
    return jsonError('Erro ao criar preferência de pagamento', 500, baseHeaders)
  }
}