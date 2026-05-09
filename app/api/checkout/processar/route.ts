import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { moverFotos } from '@/lib/mover-fotos'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { PLANOS } from '@/lib/planos'
import type { Plano } from '@/lib/planos'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(6, '60 s'),
  prefix: 'rl:checkout:processar',
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

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lovefy.app.br'
  const clean = String(raw).replace(/[\r\n\t ]+/g, '').trim()
  try { return new URL(clean).origin } catch { return 'https://www.lovefy.app.br' }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function gerarSlug(nomeRemetente: string, nomeDestinatario: string): string {
  const normalizar = (s: string) =>
    s.normalize('NFD')
     .replace(/[\u0300-\u036f]/g, '')
     .toLowerCase()
     .replace(/[^a-z0-9]/g, '')
     .slice(0, 20)
  const base   = normalizar(nomeRemetente) + 'e' + normalizar(nomeDestinatario)
  const sufixo = randomBytes(4).toString('hex')
  return `${base}${sufixo}`
}

async function garantirSlug(
  cartaId: string,
  nomeRemetente: string,
  nomeDestinatario: string,
): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const slug = gerarSlug(nomeRemetente, nomeDestinatario)
    const { data } = await supabaseAdmin
      .from('cartas').select('id').eq('slug', slug).maybeSingle()
    if (!data) {
      await supabaseAdmin.from('cartas').update({ slug }).eq('id', cartaId)
      return slug
    }
  }
  const slug = randomBytes(8).toString('hex')
  await supabaseAdmin.from('cartas').update({ slug }).eq('id', cartaId)
  return slug
}

async function ativarCartaDigital(
  cartaId: string,
  paymentId: string,
  emailPagador: string,
): Promise<string | null> {
  try {
    const { data: cartaAtual } = await supabaseAdmin
      .from('cartas')
      .select('*')
      .eq('id', cartaId)
      .maybeSingle()

    if (!cartaAtual) {
      console.error('[processar] carta não encontrada')
      return null
    }

    if (cartaAtual.status === 'ativo') {
      console.log('[processar] carta já ativa — idempotente')
      return cartaAtual.slug ?? null
    }

    let slug = cartaAtual.slug as string | null
    if (!slug) {
      slug = await garantirSlug(
        cartaId,
        cartaAtual.nome_remetente    ?? '',
        cartaAtual.nome_destinatario ?? '',
      )
    }

    const { data: atualizado } = await supabaseAdmin
      .from('cartas')
      .update({
        status:                 'ativo',
        mercadopago_payment_id: paymentId,
        paid_at:                new Date().toISOString(),
        email_pagador:          cartaAtual.email_pagador || emailPagador,
        slug,
      })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])
      .select('id')
      .maybeSingle()

    if (!atualizado) {
      const { data: recheck } = await supabaseAdmin
        .from('cartas').select('slug').eq('id', cartaId).maybeSingle()
      return (recheck as { slug?: string } | null)?.slug ?? slug
    }

    // allSettled nunca rejeita — erros individuais são capturados nos results
    Promise.allSettled([
      moverFotos(cartaId),
      gerarQRCode(cartaId, slug).then(qrCodeUrl =>
        enviarEmail({
          nome_pagador:      cartaAtual.nome_pagador      ?? '',
          email_pagador:     cartaAtual.email_pagador     || emailPagador,
          nome_destinatario: cartaAtual.nome_destinatario ?? '',
          nome_remetente:    cartaAtual.nome_remetente    ?? '',
          slug:              slug!,
          qr_code_url:       qrCodeUrl,
        })
      ),
    ]).then(results => {
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.error(`[processar] erro background task ${i}:`, result.reason)
        }
      })
    })

    return slug

  } catch (err) {
    console.error('[processar] erro ao ativar carta:', err)
    return null
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`processar:${ip}`)
  if (!success) return jsonError('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return jsonError('Serviço temporariamente indisponível', 500)
    }

    let parsedBody: unknown
    try { parsedBody = await request.json() }
    catch { return jsonError('JSON inválido', 400) }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return jsonError('Payload inválido', 400)
    }

    const body = parsedBody as Record<string, unknown>
    const { carta_id, plano: planoRaw, formData } = body

    if (typeof carta_id !== 'string' || !UUID_REGEX.test(carta_id.trim())) {
      return jsonError('carta_id inválido', 400)
    }

    const planoKey = typeof planoRaw === 'string' ? planoRaw.trim().toLowerCase() : ''
    if (planoKey !== 'forever' && planoKey !== 'impressao') {
      return jsonError('plano inválido', 400)
    }
    const plano     = planoKey as Plano
    const planoData = PLANOS[plano]

    const { data: cartaCheck } = await supabaseAdmin
      .from('cartas')
      .select('status')
      .eq('id', carta_id.trim())
      .maybeSingle()

    if (cartaCheck?.status === 'ativo') {
      return jsonError('Essa carta já foi paga e ativada', 409)
    }

    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      return jsonError('Dados do cartão ausentes', 400)
    }

    const card = formData as Record<string, unknown>

    const token           = typeof card.token             === 'string' ? card.token.trim()             : ''
    const paymentMethodId = typeof card.payment_method_id === 'string' ? card.payment_method_id.trim() : ''
    const issuerId        = card.issuer_id !== undefined ? Number(card.issuer_id) : undefined

    if (!token)           return jsonError('Token do cartão ausente', 400)
    if (!paymentMethodId) return jsonError('Método de pagamento ausente', 400)

    const payer = card.payer && typeof card.payer === 'object' && !Array.isArray(card.payer)
      ? card.payer as Record<string, unknown>
      : {}

    const payerEmail     = typeof payer.email      === 'string' ? payer.email.trim().toLowerCase()     : ''
    const payerFirstName = typeof payer.first_name === 'string' ? payer.first_name.trim().slice(0, 80) : ''
    const payerLastName  = typeof payer.last_name  === 'string' ? payer.last_name.trim().slice(0, 80)  : ''

    if (!payerEmail) return jsonError('E-mail do pagador ausente', 400)

    const identification = payer.identification && typeof payer.identification === 'object' && !Array.isArray(payer.identification)
      ? payer.identification as Record<string, unknown>
      : {}

    const identType   = typeof identification.type   === 'string' ? identification.type.trim()   : ''
    const identNumber = typeof identification.number === 'string' ? identification.number.trim()
      : typeof identification.number === 'number'                  ? String(identification.number) : ''

    console.log('[processar] method:', paymentMethodId, '| identType:', identType)

    const client  = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    const payment = new Payment(client)
    const baseUrl = getBaseUrl()

    const response = await payment.create({
      body: {
        transaction_amount: planoData.preco,
        description:        planoData.titulo,
        token,
        installments:       1,
        payment_method_id:  paymentMethodId,
        ...(issuerId && !isNaN(issuerId) ? { issuer_id: issuerId } : {}),
        payer: {
          email:      payerEmail,
          first_name: payerFirstName || 'Cliente',
          last_name:  payerLastName  || '',
          ...(identType && identNumber ? {
            identification: { type: identType, number: identNumber },
          } : {}),
        },
        external_reference:   `${carta_id.trim()}|${plano}`,
        notification_url:     `${baseUrl}/api/webhook`,
        statement_descriptor: 'LOVEFY',
      },
    })

    console.log('[processar] status:', response.status, '| detail:', response.status_detail)

    if (response.status === 'approved' && response.id) {
      const slug = await ativarCartaDigital(
        carta_id.trim(),
        String(response.id),
        payerEmail,
      )

      return NextResponse.json({
        status:     response.status,
        payment_id: response.id,
        slug,
      })
    }

    return NextResponse.json({
      status:     response.status,
      payment_id: response.id,
    })

  } catch (err) {
    console.error('[processar] erro interno:', err)
    return jsonError('Erro ao processar pagamento', 500)
  }
}