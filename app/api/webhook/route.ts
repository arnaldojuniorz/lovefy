import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'

import { supabaseAdmin } from '@/lib/supabase'
import { moverFotos } from '@/lib/mover-fotos'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'
import { gerarPDF } from '@/lib/gerar-pdf'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? ''
const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''

const mpClient = MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
  : null

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Plano = 'forever' | 'impressao'

type WebhookBody = {
  type?: string
  data?: {
    id?: string | number
  }
}

type CartaDigital = {
  id: string
  slug: string | null
  nome_pagador: string | null
  email_pagador: string | null
  nome_destinatario: string | null
  nome_remetente: string | null
}

function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function secureCompareHex(expectedHex: string, receivedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex')
    const b = Buffer.from(receivedHex, 'hex')
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function validarAssinatura(request: NextRequest): boolean {
  if (!MERCADOPAGO_WEBHOOK_SECRET) return false

  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) return false

  const parts = xSignature.split(',').map((p) => p.trim())
  const ts = parts.find((p) => p.startsWith('ts='))?.slice(3)
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3)

  if (!ts || !v1) return false

  const dataId = new URL(request.url).searchParams.get('data.id') ?? ''
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const expected = createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')

  return secureCompareHex(expected, v1.toLowerCase())
}

function parseExternalReference(externalRef: string): { cartaId: string; plano: Plano } | null {
  const [rawCartaId, rawPlano] = externalRef.split('|')
  const cartaId = (rawCartaId ?? '').trim()
  if (!UUID_REGEX.test(cartaId)) return null

  const planoTxt = (rawPlano ?? 'forever').trim().toLowerCase()
  const plano: Plano = planoTxt === 'impressao' ? 'impressao' : 'forever'

  return { cartaId, plano }
}

function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export async function POST(request: NextRequest) {
  try {
    if (!mpClient || !MERCADOPAGO_WEBHOOK_SECRET) {
      console.error('[webhook] MERCADOPAGO_ACCESS_TOKEN ou MERCADOPAGO_WEBHOOK_SECRET ausente')
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const rawBody = await request.text()
    const body = safeJsonParse<WebhookBody>(rawBody)

    if (!body) {
      return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })
    }

    if (!validarAssinatura(request)) {
      console.warn('[webhook] assinatura inválida')
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentIdRaw = body.data?.id
    if (!paymentIdRaw) return NextResponse.json({ ok: true })

    const paymentId = String(paymentIdRaw).trim()
    if (!/^\d+$/.test(paymentId)) {
      console.warn('[webhook] paymentId inválido')
      return NextResponse.json({ ok: true })
    }

    const paymentApi = new Payment(mpClient)
    const paymentData = await paymentApi.get({ id: paymentId })

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const externalRef = String(paymentData.external_reference ?? '').trim()
    if (!externalRef) {
      console.warn('[webhook] external_reference ausente')
      return NextResponse.json({ ok: true })
    }

    const parsed = parseExternalReference(externalRef)
    if (!parsed) {
      console.warn('[webhook] external_reference inválido')
      return NextResponse.json({ ok: true })
    }

    if (parsed.plano === 'impressao') {
      await processarImpressao(parsed.cartaId, paymentId)
    } else {
      await processarDigital(parsed.cartaId, paymentId)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[webhook] erro interno', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function processarDigital(cartaId: string, paymentId: string) {
  const { data, error } = await supabaseAdmin
    .from('cartas')
    .update({
      status: 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', cartaId)
    .in('status', ['rascunho', 'pendente_pagamento'])
    .select('id, slug, nome_pagador, email_pagador, nome_destinatario, nome_remetente')
    .maybeSingle()

  if (error) {
    console.error('[webhook] erro ao ativar carta digital')
    throw error
  }

  const carta = (data ?? null) as CartaDigital | null

  if (!carta) {
    const { data: existente } = await supabaseAdmin
      .from('cartas')
      .select('id, status')
      .eq('id', cartaId)
      .maybeSingle()

    if (!existente) {
      console.warn('[webhook] carta digital não encontrada', cartaId)
    } else if ((existente as { status?: string }).status === 'ativo') {
      console.log('[webhook] carta digital já ativa (idempotente)', cartaId)
    }
    return
  }

  try {
    await moverFotos(cartaId)
  } catch (e) {
    console.error('[webhook] erro ao mover fotos', e)
  }

  let qrCodeUrl: string | null = null
  if (carta.slug) {
    try {
      qrCodeUrl = await gerarQRCode(cartaId, carta.slug)
    } catch (e) {
      console.error('[webhook] erro ao gerar QR Code', e)
    }
  }

  if (carta.email_pagador && carta.slug) {
    try {
      await enviarEmail({
        nome_pagador: carta.nome_pagador ?? '',
        email_pagador: carta.email_pagador,
        nome_destinatario: carta.nome_destinatario ?? '',
        nome_remetente: carta.nome_remetente ?? '',
        slug: carta.slug,
        qr_code_url: qrCodeUrl,
      })
    } catch (e) {
      console.error('[webhook] erro ao enviar email digital', e)
    }
  }
}

async function processarImpressao(cartaId: string, paymentId: string) {
  const { data: carta, error } = await supabaseAdmin
    .from('cartas_impressao')
    .update({
      status: 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', cartaId)
    .in('status', ['rascunho', 'pendente_pagamento'])
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[webhook] erro ao ativar carta impressão')
    throw error
  }

  if (!carta) {
    const { data: existente } = await supabaseAdmin
      .from('cartas_impressao')
      .select('id, status')
      .eq('id', cartaId)
      .maybeSingle()

    if (!existente) {
      console.warn('[webhook] carta impressão não encontrada', cartaId)
    } else if ((existente as { status?: string }).status === 'ativo') {
      console.log('[webhook] carta impressão já ativa (idempotente)', cartaId)
    }
    return
  }

  let pdfUrl: string | null = null
  try {
    pdfUrl = await gerarPDF(cartaId, carta)
  } catch (e) {
    console.error('[webhook] erro ao gerar PDF', e)
  }

  if ((carta as { email_pagador?: string | null }).email_pagador) {
    try {
      await enviarEmailImpressao(carta, pdfUrl)
    } catch (e) {
      console.error('[webhook] erro ao enviar email impressão', e)
    }
  }
}

async function enviarEmailImpressao(carta: Record<string, unknown>, pdfUrl: string | null) {
  if (!RESEND_API_KEY) {
    console.error('[webhook] RESEND_API_KEY ausente')
    return
  }

  const emailPagador = typeof carta.email_pagador === 'string' ? carta.email_pagador : null
  if (!emailPagador) return

  const nomePagadorRaw = typeof carta.nome_pagador === 'string' ? carta.nome_pagador : 'Cliente'
  const nomeDestinoRaw =
    (typeof carta.destinatario === 'string' && carta.destinatario) ||
    (typeof carta.nome_destinatario === 'string' && carta.nome_destinatario) ||
    'alguém especial'

  const nomePagador = escapeHtml(nomePagadorRaw.slice(0, 80))
  const nomeDestino = escapeHtml(nomeDestinoRaw.slice(0, 80))

  const resend = new Resend(RESEND_API_KEY)

  await resend.emails.send({
    from: 'Lovefy <contato@lovefy.app.br>',
    to: emailPagador,
    subject: 'Sua carta para impressão está pronta! — Lovefy',
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
        <h1 style="color:#ff6b9d;text-align:center;margin:0 0 24px">Lovefy</h1>
        <h2 style="color:#fff;margin:0 0 16px">Olá, ${nomePagador}!</h2>
        <p style="color:#ccc;margin:0 0 24px">
          Sua carta para <strong style="color:#ff6b9d">${nomeDestino}</strong> está pronta para impressão.
        </p>
        ${
          pdfUrl
            ? `<p style="text-align:center;margin:0 0 24px">
                 <a href="${pdfUrl}" style="background:#ff6b9d;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
                   Baixar PDF
                 </a>
               </p>`
            : '<p style="color:#ccc">Em breve você receberá o PDF da sua carta por e-mail.</p>'
        }
        <p style="color:#555;font-size:12px;text-align:center;margin:0">Feito com amor pelo Lovefy</p>
      </div>
    `,
  })
}

export async function GET() {
  return NextResponse.json({ ok: true })
}