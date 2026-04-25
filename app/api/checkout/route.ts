import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Preference } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const PLANOS = {
  forever: {
    preco: 12.9,
    titulo: 'Carta Digital Para Sempre',
    categoria: 'services',
  },
  impressao: {
    preco: 9.9,
    titulo: 'Carta para Impressão',
    categoria: 'services',
  },
} as const

type Plano = keyof typeof PLANOS
type Tipo = 'digital' | 'impressao'
type Tabela = 'cartas' | 'cartas_impressao'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const RATE_LIMIT_MAX = 6
const RATE_LIMIT_WINDOW_MS = 60_000
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.APP_URL ??
    'https://www.lovefy.app.br'

  const clean = String(raw).replace(/[\r\n\t ]+/g, '').trim()

  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('invalid protocol')
    }
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

function applyRateLimit(key: string) {
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing || existing.resetAt <= now) {
    const created = { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS }
    rateLimitStore.set(key, created)
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt: created.resetAt,
      retryAfterSec: 0,
    }
  }

  existing.count += 1
  rateLimitStore.set(key, existing)

  const remaining = Math.max(0, RATE_LIMIT_MAX - existing.count)
  const allowed = existing.count <= RATE_LIMIT_MAX
  const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  if (rateLimitStore.size > 5000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetAt <= now) rateLimitStore.delete(k)
    }
  }

  return {
    allowed,
    limit: RATE_LIMIT_MAX,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSec,
  }
}

function rateLimitHeaders(info: {
  limit: number
  remaining: number
  resetAt: number
}) {
  return {
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': String(Math.floor(info.resetAt / 1000)),
  }
}

function normalizePlano(value: unknown): Plano | null {
  if (typeof value !== 'string') return null
  const plano = value.trim().toLowerCase()
  if (plano === 'forever' || plano === 'impressao') return plano
  return null
}

function normalizeTipo(value: unknown, plano: Plano): Tipo | null {
  if (value === undefined || value === null) {
    return plano === 'impressao' ? 'impressao' : 'digital'
  }

  if (typeof value !== 'string') return null
  const tipo = value.trim().toLowerCase()

  if (tipo !== 'digital' && tipo !== 'impressao') return null
  return tipo
}

function sanitizeName(value: unknown, fallback = 'Cliente') {
  if (typeof value !== 'string') return fallback
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, 120)
  return clean || fallback
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.split(' ').filter(Boolean)
  const firstName = parts[0] ?? 'Cliente'
  const lastName = parts.slice(1).join(' ') || firstName
  return { firstName, lastName }
}

function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>
) {
  return NextResponse.json({ error: message }, { status, headers })
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = applyRateLimit(`checkout:${ip}`)
  const baseHeaders = rateLimitHeaders(limiter)

  if (!limiter.allowed) {
    return jsonError('Muitas tentativas. Tente novamente em instantes.', 429, {
      ...baseHeaders,
      'Retry-After': String(limiter.retryAfterSec),
    })
  }

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[checkout] MERCADOPAGO_ACCESS_TOKEN ausente')
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

    const body = parsedBody as Record<string, unknown>
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

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('id, status, nome_pagador, remetente, nome_remetente, email_pagador')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[checkout] erro ao buscar carta')
      return jsonError('Erro ao iniciar checkout', 500, baseHeaders)
    }

    if (!carta) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    if (carta.status === 'ativo') {
      return jsonError('Essa carta já foi paga/ativada', 409, baseHeaders)
    }

    const emailPagador =
      typeof carta.email_pagador === 'string'
        ? carta.email_pagador.trim().toLowerCase()
        : ''

    if (!EMAIL_REGEX.test(emailPagador)) {
      return jsonError('Email do pagador inválido ou ausente', 400, baseHeaders)
    }

    const nomeCompleto = sanitizeName(
      carta.nome_pagador ?? carta.remetente ?? carta.nome_remetente ?? 'Cliente'
    )
    const { firstName, lastName } = splitName(nomeCompleto)

    const baseUrl = getBaseUrl()
    const planoSelecionado = PLANOS[plano]
    const externalReference = `${cartaId}|${plano}`

    const successParams = new URLSearchParams({
      carta_id: cartaId,
      plano,
      tipo,
    })

    const successUrl = `${baseUrl}/obrigado?${successParams.toString()}`
    const failureUrl = tipo === 'impressao' ? `${baseUrl}/imprimir` : `${baseUrl}/criar`

    const preference = new Preference(
      new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    )

    const response = await preference.create({
      body: {
        items: [
          {
            id: cartaId,
            title: planoSelecionado.titulo,
            description: `Lovefy - ${planoSelecionado.titulo}`,
            category_id: planoSelecionado.categoria,
            quantity: 1,
            unit_price: planoSelecionado.preco,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name: nomeCompleto,
          email: emailPagador,
          first_name: firstName,
          last_name: lastName,
        } as any,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        notification_url: `${baseUrl}/api/webhook`,
        statement_descriptor: 'LOVEFY',
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })

    if (!response?.id || !response?.init_point) {
      console.error('[checkout] resposta inválida do Mercado Pago')
      return jsonError('Erro ao criar preferência de pagamento', 502, baseHeaders)
    }

    const { error: updateError } = await supabaseAdmin
      .from(tabela)
      .update({
        mercadopago_preference_id: response.id,
        status: 'pendente_pagamento',
      })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])

    if (updateError) {
      console.error('[checkout] erro ao salvar preference id')
    }

    return NextResponse.json(
      {
        preference_id: response.id,
        checkout_url: response.init_point,
      },
      { headers: baseHeaders }
    )
  } catch (error) {
    console.error('[checkout] erro interno', error)
    return jsonError('Erro ao criar preferência de pagamento', 500, baseHeaders)
  }
}