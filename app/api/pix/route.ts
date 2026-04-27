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

const RATE_LIMIT_MAX = 8
const RATE_LIMIT_WINDOW_MS = 60_000
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://www.lovefy.app.br'
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

function sanitizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const clean = value.trim().toLowerCase()
  if (!clean || clean.length > 200) return null
  if (!EMAIL_REGEX.test(clean)) return null
  return clean
}

function sanitizeName(value: unknown, fallback = 'Cliente') {
  if (typeof value !== 'string') return fallback
  const clean = value.trim().replace(/\s+/g, ' ').slice(0, 120)
  return clean || fallback
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
  const limiter = applyRateLimit(`pix:${ip}`)
  const baseHeaders = rateLimitHeaders(limiter)

  if (!limiter.allowed) {
    return jsonError('Muitas tentativas. Tente novamente em instantes.', 429, {
      ...baseHeaders,
      'Retry-After': String(limiter.retryAfterSec),
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

    const body = parsedBody as Record<string, unknown>
    const cartaId = typeof body.carta_id === 'string' ? body.carta_id.trim() : ''
    const plano = normalizePlano(body.plano)

    if (!UUID_REGEX.test(cartaId)) {
      return jsonError('carta_id inválido', 400, baseHeaders)
    }

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
      console.error('[pix] erro ao buscar carta', cartaError)
      return jsonError('Erro ao iniciar pagamento Pix', 500, baseHeaders)
    }

    if (!cartaRaw) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    const carta = cartaRaw as Record<string, unknown>

    if (String(carta.status ?? '') === 'ativo') {
      return jsonError('Essa carta já foi paga/ativada', 409, baseHeaders)
    }

    const email =
      sanitizeEmail(pickString(carta, ['email_pagador', 'email', 'seu_email', 'email_cliente'])) ??
      sanitizeEmail(body.email_pagador)

    if (!email) {
      return jsonError('Complete um e-mail válido antes de pagar', 400, baseHeaders)
    }

    const nomePagador = sanitizeName(
      pickString(carta, ['nome_pagador', 'nome_remetente', 'remetente', 'seu_nome', 'nome']) ??
        body.nome_pagador ??
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
        description: planoData.titulo,
        payment_method_id: 'pix',
        payer: {
          email,
          first_name: nomePagador,
        },
        external_reference: externalReference,
        notification_url: `${baseUrl}/api/webhook`,
      },
    })

    const pixData = response.point_of_interaction?.transaction_data
    const paymentId = response.id ? String(response.id) : null

    if (!pixData?.qr_code || !pixData?.qr_code_base64 || !paymentId) {
      console.error('[pix] MP não retornou QR code completo')
      return jsonError('QR Code não gerado', 502, baseHeaders)
    }

    await supabaseAdmin
      .from(tabela)
      .update({
        mercadopago_payment_id: paymentId,
        status: 'pendente_pagamento',
      })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])

    return NextResponse.json(
      {
        payment_id: paymentId,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        valor: planoData.preco,
      },
      { headers: baseHeaders }
    )
  } catch (error) {
    console.error('[pix] erro interno', error)
    return jsonError('Erro ao iniciar pagamento Pix', 500, baseHeaders)
  }
}