import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { createHash } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

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

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(6, '60 s'),
  prefix: 'rl:cartao',
})

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
  // Prioriza o header do Cloudflare (proxy/CDN de vocês), que não pode ser
  // falsificado pelo cliente, já que o Cloudflare sempre sobrescreve esse
  // valor. x-forwarded-for/x-real-ip continuam como fallback para cenários
  // onde a requisição não passou pelo Cloudflare.
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

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
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': String(Math.floor(info.reset / 1000)),
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

// Libera a "reserva" feita antes de chamar o Mercado Pago, permitindo que o
// usuário tente novamente caso a chamada ao MP falhe (timeout, erro de rede,
// serviço fora do ar). Sem isso, uma falha na chamada ao MP deixaria a carta
// travada permanentemente em 'processando_pagamento'.
async function liberarReserva(tabela: Tabela, cartaId: string) {
  const { error } = await supabaseAdmin
    .from(tabela)
    .update({ status: 'pendente_pagamento' })
    .eq('id', cartaId)
    .eq('status', 'processando_pagamento')

  if (error) {
    console.error('[cartao] falha ao reverter reserva de pagamento:', error.message)
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success, limit, remaining, reset } = await ratelimit.limit(`cartao:${ip}`)

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
      console.error('[cartao] erro ao buscar carta:', cartaError.message)
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

    // ---- RESERVA ATÔMICA ----
    // Transição condicional de status ANTES de chamar o Mercado Pago. Esta é
    // uma única instrução UPDATE no Postgres, portanto atômica: se duas
    // requisições chegarem simultaneamente (ex: duplo clique no botão pagar),
    // apenas a primeira consegue mover o status para 'processando_pagamento'.
    // A segunda encontra 0 linhas afetadas (o status já não está mais em
    // ['rascunho','pendente_pagamento']) e é barrada aqui, ANTES de gerar uma
    // segunda cobrança real no cartão do cliente.
    const { data: reserva, error: reservaError } = await supabaseAdmin
      .from(tabela)
      .update({ status: 'processando_pagamento' })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])
      .select('id')

    if (reservaError) {
      console.error('[cartao] erro ao reservar carta para pagamento:', reservaError.message)
      return jsonError('Erro ao processar pagamento', 500, baseHeaders)
    }

    if (!reserva || reserva.length === 0) {
      return jsonError('Este pagamento já está sendo processado. Aguarde alguns instantes.', 409, baseHeaders)
    }

    const planoData = PLANOS[plano]
    const externalReference = `${cartaId}|${plano}`
    const baseUrl = getBaseUrl()

    // Idempotency key amarrada a carta+token: uma tentativa reenviada pela
    // rede (mesmo token) é deduplicada pelo próprio Mercado Pago. Uma nova
    // tentativa de verdade (usuário corrige CVV, gera novo token) tem uma
    // idempotency key diferente e é tratada como cobrança nova, normalmente.
    const idempotencyKey = createHash('sha256').update(`${cartaId}:${token}`).digest('hex')

    const payment = new Payment(
      new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    )

    let response
    try {
      response = await payment.create({
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
        requestOptions: { idempotencyKey },
      })
    } catch (mpError) {
      // Chamada ao Mercado Pago falhou: libera a reserva para permitir nova
      // tentativa, e loga apenas a mensagem do erro (nunca o objeto completo,
      // que pode carregar o corpo da requisição — incluindo o token do cartão).
      await liberarReserva(tabela, cartaId)
      console.error(
        '[cartao] erro ao criar pagamento no Mercado Pago:',
        mpError instanceof Error ? mpError.message : 'erro desconhecido'
      )
      return jsonError('Erro ao processar pagamento', 502, baseHeaders)
    }

    const paymentId = response.id ? String(response.id) : null
    if (!paymentId) {
      await liberarReserva(tabela, cartaId)
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
      .eq('status', 'processando_pagamento')

    if (updateError) {
      // ALERTA CRÍTICO: a cobrança FOI criada no Mercado Pago (paymentId
      // existe), mas não conseguimos salvar isso no banco. A carta fica presa
      // em 'processando_pagamento'. Como o external_reference enviado ao MP
      // já contém o cartaId, o webhook (api/webhook/route.ts) provavelmente
      // ainda consegue localizar e ativar a carta por esse campo — mas isso
      // precisa ser confirmado ao revisar o webhook. Até lá, este log serve
      // como sinal para reconciliação manual via painel do Mercado Pago.
      console.error(
        `[cartao] ALERTA CRÍTICO: pagamento ${paymentId} criado no Mercado Pago mas NÃO salvo no banco para carta ${cartaId}. Verificar manualmente.`,
        updateError.message
      )
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
    console.error('[cartao] erro interno:', error instanceof Error ? error.message : 'erro desconhecido')
    return jsonError('Erro ao processar cartão', 500, baseHeaders)
  }
}