import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { moverFotos } from '@/lib/mover-fotos'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const UUID_REGEX       = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const PAYMENT_ID_REGEX = /^\d{3,30}$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '60 s'),
  prefix: 'rl:pix:status',
})

type Tipo   = 'digital' | 'impressao'
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

function pickString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

async function executarAcoesPosPagamento(
  carta: Record<string, unknown>,
  cartaId: string,
  tipo: Tipo,
  paymentId: string,
  emailPagador: string,
): Promise<void> {
  if (tipo === 'impressao') return

  const slug = pickString(carta, ['slug']) ?? ''
  if (!slug) return

  Promise.allSettled([
    moverFotos(cartaId),
    gerarQRCode(cartaId, slug).then(qrCodeUrl =>
      enviarEmail({
        nome_pagador:      pickString(carta, ['nome_pagador'])      ?? '',
        email_pagador:     pickString(carta, ['email_pagador'])     || emailPagador,
        nome_destinatario: pickString(carta, ['nome_destinatario']) ?? '',
        nome_remetente:    pickString(carta, ['nome_remetente'])    ?? '',
        slug,
        qr_code_url: qrCodeUrl,
      })
    ),
  ]).then(results => {
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        console.error(`[pix/status] erro background task ${i}:`, result.reason)
      }
    })
  })
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const { success, limit, remaining, reset } = await ratelimit.limit(`pix-status:${ip}`)
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
      console.error('[pix/status] MERCADOPAGO_ACCESS_TOKEN ausente')
      return jsonError('Serviço temporariamente indisponível', 500, baseHeaders)
    }

    const { searchParams } = new URL(request.url)

    const paymentId = (searchParams.get('payment_id') ?? '').trim()
    const cartaId   = (searchParams.get('carta_id')   ?? '').trim()
    const tipo      = normalizeTipo(searchParams.get('tipo'))

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

    const { data: cartaRaw, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('*')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[pix/status] erro ao consultar carta')
      return jsonError('Erro ao verificar status', 500, baseHeaders)
    }

    if (!cartaRaw) {
      return jsonError('Carta não encontrada', 404, baseHeaders)
    }

    const carta = cartaRaw as Record<string, unknown>

    const paymentIdDaCarta =
      carta.mercadopago_payment_id !== undefined && carta.mercadopago_payment_id !== null
        ? String(carta.mercadopago_payment_id)
        : null

    if (paymentIdDaCarta && paymentIdDaCarta !== paymentId) {
      return jsonError('payment_id não corresponde à carta', 409, baseHeaders)
    }

    // Carta já ativa — retorna imediatamente sem chamar Mercado Pago
    if (String(carta.status ?? '') === 'ativo') {
      return NextResponse.json(
        {
          status:       'approved',
          carta_status: 'ativo',
          slug:         tipo === 'digital' ? pickString(carta, ['slug']) ?? null : null,
          pdf_url:      null,
        },
        { headers: baseHeaders }
      )
    }

    const payment = new Payment(
      new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    )

    const mpResponse  = await payment.get({ id: paymentId })
    const normalized  = mapMpStatus(mpResponse.status)
    const emailPagador = pickString(carta, ['email_pagador']) ?? ''

    if (normalized === 'approved') {
      const extRef = String(mpResponse.external_reference ?? '')
      if (!extRef.startsWith(`${cartaId}|`) && extRef !== cartaId) {
        return jsonError('payment_id não corresponde à carta', 409, baseHeaders)
      }

      // Guard de status — evita dupla ativação em race condition com o webhook
      const { data: ativada } = await supabaseAdmin
        .from(tabela)
        .update({
          status:                 'ativo',
          paid_at:                new Date().toISOString(),
          mercadopago_payment_id: paymentId,
        })
        .eq('id', cartaId)
        .in('status', ['rascunho', 'pendente_pagamento'])
        .select('*')
        .maybeSingle()

      const cartaFinal = (ativada ?? carta) as Record<string, unknown>

      // Executa ações pós-pagamento em background caso o webhook tenha falhado
      // Se webhook já executou, moverFotos e enviarEmail devem ser idempotentes
      if (ativada) {
        executarAcoesPosPagamento(cartaFinal, cartaId, tipo, paymentId, emailPagador)
      }

      return NextResponse.json(
        {
          status:       'approved',
          carta_status: 'ativo',
          slug:         tipo === 'digital' ? pickString(cartaFinal, ['slug']) ?? null : null,
          pdf_url:      null,
        },
        { headers: baseHeaders }
      )
    }

    return NextResponse.json(
      {
        status:       normalized,
        carta_status: String(carta.status ?? 'pendente_pagamento'),
        slug:         null,
        pdf_url:      null,
      },
      { headers: baseHeaders }
    )

  } catch (error) {
    console.error('[pix/status] erro interno', error)
    return jsonError('Erro ao verificar status', 500, baseHeaders)
  }
}