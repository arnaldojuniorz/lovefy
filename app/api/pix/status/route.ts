import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAYMENT_ID_REGEX = /^\d{3,30}$/

const RATE_LIMIT_MAX = 20
const RATE_LIMIT_WINDOW_MS = 60_000
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

type Tipo = 'digital' | 'impressao'
type Tabela = 'cartas' | 'cartas_impressao'

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

function normalizeTipo(value: string | null): Tipo | null {
  if (!value) return 'digital'
  const clean = value.trim().toLowerCase()
  if (clean === 'digital' || clean === 'impressao') return clean
  return null
}

function mapMpStatus(status: string | null | undefined): string {
  if (!status) return 'pending'

  const s = status.toLowerCase()
  if (s === 'approved') return 'approved'
  if (s === 'rejected' || s === 'cancelled' || s === 'charged_back') return 'failed'
  if (s === 'in_process' || s === 'pending') return 'pending'
  return 'pending'
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const limiter = applyRateLimit(`pix-status:${ip}`)
  const baseHeaders = rateLimitHeaders(limiter)

  if (!limiter.allowed) {
    return jsonError('Muitas tentativas. Tente novamente em instantes.', 429, {
      ...baseHeaders,
      'Retry-After': String(limiter.retryAfterSec),
    })
  }

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      console.error('[pix/status] MERCADOPAGO_ACCESS_TOKEN ausente')
      return jsonError('Serviço temporariamente indisponível', 500, baseHeaders)
    }

    const { searchParams } = new URL(request.url)

    const paymentId = (searchParams.get('payment_id') ?? '').trim()
    const cartaId = (searchParams.get('carta_id') ?? '').trim()
    const tipo = normalizeTipo(searchParams.get('tipo'))

    if (!paymentId || !cartaId) {
      return jsonError('payment_id e carta_id são obrigatórios', 400, baseHeaders)
    }

    if (!PAYMENT_ID_REGEX.test(paymentId)) {
      return jsonError('payment_id inválido', 400, baseHeaders)
    }

    if (!UUID_REGEX.test(cartaId)) {
      return jsonError('carta_id inválido', 400, baseHeaders)
    }

    if (!tipo) {
      return jsonError('tipo inválido. Use "digital" ou "impressao"', 400, baseHeaders)
    }

    const tabela: Tabela = tipo === 'impressao' ? 'cartas_impressao' : 'cartas'

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('id, status, slug, mercadopago_payment_id')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[pix/status] erro ao consultar carta')
      return jsonError('Erro ao verificar status', 500, baseHeaders)
    }

    if (!carta) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    if (
      carta.mercadopago_payment_id &&
      String(carta.mercadopago_payment_id) !== String(paymentId)
    ) {
      return jsonError('payment_id não corresponde à carta', 409, baseHeaders)
    }

    if (carta.status === 'ativo') {
      return NextResponse.json(
        {
          status: 'approved',
          carta_status: 'ativo',
          slug: tipo === 'digital' ? carta.slug ?? null : null,
          pdf_url: null,
        },
        { headers: baseHeaders }
      )
    }

    const payment = new Payment(
      new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    )

    const mpResponse = await payment.get({ id: paymentId })
    const normalized = mapMpStatus(mpResponse.status)

    if (normalized === 'approved') {
      // Não ativa aqui; ativação oficial só no webhook.
      return NextResponse.json(
        {
          status: 'approved',
          carta_status: carta.status ?? 'pendente_pagamento',
          slug: null,
          pdf_url: null,
        },
        { headers: baseHeaders }
      )
    }

    return NextResponse.json(
      {
        status: normalized,
        carta_status: carta.status ?? 'pendente_pagamento',
        slug: null,
        pdf_url: null,
      },
      { headers: baseHeaders }
    )
  } catch (error) {
    console.error('[pix/status] erro interno', error)
    return jsonError('Erro ao verificar status', 500, baseHeaders)
  }
}