import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const PLANOS = {
  forever: { preco: 9.9, titulo: 'Lovefy - Carta Digital Para Sempre' },
  impressao: { preco: 6.9, titulo: 'Lovefy - Carta para Impressao' },
} as const

type Plano = keyof typeof PLANOS
type Tipo = 'digital' | 'impressao'
type Tabela = 'cartas' | 'cartas_impressao'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOKEN_REGEX = /^[a-zA-Z0-9_-]{20,600}$/
const PAYMENT_METHOD_REGEX = /^[a-zA-Z0-9_]{2,40}$/

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
    if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('invalid')
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

function rateLimitHeaders(info: { limit: number; remaining: number; resetAt: number }) {
  return {
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': String(Math.floor(info.resetAt / 1000)),
  }
}

function jsonError(
  message: string,
  status: number,
  headers?: Record<string, string>
) {
  return NextResponse.json({ error: message }, { status, headers })
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

function sanitizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase()
  if (!clean || clean.length > 200) return null
  if (!EMAIL_REGEX.test(clean)) return null
  return clean
}

function normalizeInstallments(value: unknown): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return 1
  const int = Math.floor(n)
  if (int < 1) return 1
  if (int > 12) return 12
  return int
}

function normalizeIssuerId(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined

  const n = Number(value)
  if (!Number.isInteger(n)) return undefined
  if (n <= 0 || n > Number.MAX_SAFE_INTEGER) return undefined

  return n
}

function normalizeMpStatus(status: string | null | undefined): string {
  const s = String(status ?? '').toLowerCase()
  if (s === 'approved') return 'approved'
  if (s === 'rejected' || s === 'cancelled' || s === 'charged_back') return 'failed'
  if (s === 'in_process' || s === 'pending') return 'pending'
  return 'pending'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = applyRateLimit(`cartao:${ip}`)
  const baseHeaders = rateLimitHeaders(limiter)

  if (!limiter.allowed) {
    return jsonError('Muitas tentativas. Tente novamente em instantes.', 429, {
      ...baseHeaders,
      'Retry-After': String(limiter.retryAfterSec),
    })
  }

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[cartao] MERCADOPAGO_ACCESS_TOKEN ausente')
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

    const token = typeof body.token === 'string' ? body.token.trim() : ''
    if (!TOKEN_REGEX.test(token)) {
      return jsonError('token de cartão inválido', 400, baseHeaders)
    }

    const paymentMethodId =
      typeof body.payment_method_id === 'string' ? body.payment_method_id.trim() : ''
    if (!PAYMENT_METHOD_REGEX.test(paymentMethodId)) {
      return jsonError('payment_method_id inválido', 400, baseHeaders)
    }

    const installments = normalizeInstallments(body.installments)
    const issuerId = normalizeIssuerId(body.issuer_id)

    const tabela: Tabela = tipo === 'impressao' ? 'cartas_impressao' : 'cartas'

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('id, status, nome_pagador, remetente, nome_remetente, email_pagador')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[cartao] erro ao buscar carta')
      return jsonError('Erro ao processar pagamento', 500, baseHeaders)
    }

    if (!carta) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    if (carta.status === 'ativo') {
      return jsonError('Essa carta já foi paga/ativada', 409, baseHeaders)
    }

    const emailFromDb = sanitizeEmail(carta.email_pagador)
    const emailFromBody =
      sanitizeEmail((body.payer as { email?: unknown } | undefined)?.email) ??
      sanitizeEmail(body.email_pagador)

    const emailPagador = emailFromDb ?? emailFromBody
    if (!emailPagador) {
      return jsonError('Email do pagador inválido ou ausente', 400, baseHeaders)
    }

    const nomePagador = sanitizeName(
      carta.nome_pagador ??
        carta.remetente ??
        carta.nome_remetente ??
        body.nome_pagador ??
        (body.payer as { first_name?: unknown } | undefined)?.first_name ??
        'Cliente'
    )

    const planoData = PLANOS[plano]
    const externalReference = `${cartaId}|${plano}`
    const baseUrl = getBaseUrl()

    const payment = new Payment(
      new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    )

    const response = await payment.create({
      body: {
        transaction_amount: planoData.preco,
        token,
        issuer_id: issuerId,
        payment_method_id: paymentMethodId,
        installments,
        description: planoData.titulo,
        external_reference: externalReference,
        notification_url: `${baseUrl}/api/webhook`,
        payer: {
          email: emailPagador,
          first_name: nomePagador,
        },
      },
    })

    const paymentId = response.id ? String(response.id) : null
    if (!paymentId) {
      console.error('[cartao] Mercado Pago não retornou payment id')
      return jsonError('Erro ao processar pagamento', 502, baseHeaders)
    }

    const { error: updateError } = await supabaseAdmin
      .from(tabela)
      .update({
        mercadopago_payment_id: paymentId,
        status: 'pendente_pagamento',
      })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])

    if (updateError) {
      console.error('[cartao] erro ao salvar mercadopago_payment_id')
    }

    return NextResponse.json(
      {
        status: normalizeMpStatus(response.status),
        status_detail:
          typeof response.status_detail === 'string' ? response.status_detail : null,
        payment_id: paymentId,
      },
      { headers: baseHeaders }
    )
  } catch (error) {
    console.error('[cartao] erro interno', error)
    return jsonError('Erro ao processar cartão', 500, baseHeaders)
  }
}