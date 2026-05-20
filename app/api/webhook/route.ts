import { NextRequest, NextResponse } from 'next/server'
import { createHmac, timingSafeEqual, randomBytes } from 'crypto'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { Resend } from 'resend'

import { supabaseAdmin } from '@/lib/supabase'
import { moverFotos } from '@/lib/mover-fotos'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'
import { gerarPDF } from '@/lib/gerar-pdf'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN   = process.env.MERCADOPAGO_ACCESS_TOKEN   ?? ''
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET ?? ''
const RESEND_API_KEY             = process.env.RESEND_API_KEY             ?? ''

const mpClient = MERCADOPAGO_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
  : null

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type Plano = 'forever' | 'impressao'

type WebhookBody = {
  id?:       string | number
  type?:     string
  topic?:    string
  resource?: string
  data?:     { id?: string | number }
}

type CartaRow = Record<string, unknown>

type CartaStatusRow = {
  id:     string
  status: string | null
}

function safeJsonParse<T>(value: string): T | null {
  try { return JSON.parse(value) as T } catch { return null }
}

function secureCompareHex(expectedHex: string, receivedHex: string): boolean {
  try {
    const a = Buffer.from(expectedHex, 'hex')
    const b = Buffer.from(receivedHex,  'hex')
    if (a.length === 0 || b.length === 0 || a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch { return false }
}

function extractPaymentId(body: WebhookBody): string | null {
  if (body?.data?.id !== undefined) return String(body.data.id).trim()
  if (body?.id !== undefined) return String(body.id).trim()
  if (typeof body?.resource === 'string') {
    const clean = body.resource.replace(/.*\//, '').trim()
    if (/^\d+$/.test(clean)) return clean
  }
  return null
}

function buildCandidateIds(request: NextRequest, body: WebhookBody): string[] {
  const url      = new URL(request.url)
  const legacyId = typeof body?.resource === 'string'
    ? body.resource.replace(/.*\//, '').trim()
    : null

  const values = [
    url.searchParams.get('data.id'),
    url.searchParams.get('id'),
    body?.data?.id !== undefined ? String(body.data.id) : null,
    body?.id        !== undefined ? String(body.id)      : null,
    legacyId,
  ]
    .filter((v): v is string => Boolean(v))
    .map(v => v.trim())
    .filter(Boolean)
  return Array.from(new Set(values))
}

function validarAssinatura(request: NextRequest, body: WebhookBody): boolean {
  const xSignature = request.headers.get('x-signature')

  if (!xSignature) return true

  if (!MERCADOPAGO_WEBHOOK_SECRET) return false

  const xRequestId = request.headers.get('x-request-id')
  if (!xRequestId) return false

  const parts = xSignature.split(',').map(p => p.trim())
  const ts    = parts.find(p => p.startsWith('ts='))?.slice(3)
  const v1    = parts.find(p => p.startsWith('v1='))?.slice(3)?.toLowerCase()
  if (!ts || !v1) return false

  const candidates = buildCandidateIds(request, body)
  if (candidates.length === 0) return false

  for (const id of candidates) {
    const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`
    const expected = createHmac('sha256', MERCADOPAGO_WEBHOOK_SECRET)
      .update(manifest).digest('hex')
    if (secureCompareHex(expected, v1)) return true
  }

  return false
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
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;')
}

function pickString(record: CartaRow | null | undefined, keys: string[]): string | null {
  if (!record) return null
  for (const key of keys) {
    const value = record[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function extractPayerEmail(paymentData: unknown): string | null {
  if (!paymentData || typeof paymentData !== 'object') return null
  const root  = paymentData as CartaRow
  const payer = root.payer
  if (!payer || typeof payer !== 'object') return null
  const email = (payer as CartaRow).email
  if (typeof email !== 'string' || !email.trim()) return null
  return email.trim().toLowerCase()
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

export async function POST(request: NextRequest) {
  try {
    if (!mpClient) {
      console.error('[webhook] MERCADOPAGO_ACCESS_TOKEN ausente')
      return NextResponse.json({ ok: false }, { status: 500 })
    }

    const rawBody = await request.text()
    const body    = safeJsonParse<WebhookBody>(rawBody)
    if (!body) return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 })

    console.log('[webhook] body:', JSON.stringify(body))

    if (!validarAssinatura(request, body)) {
      console.warn('[webhook] assinatura inválida — rejeitando')
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const isPayment = body.type === 'payment' || body.topic === 'payment'
    if (!isPayment) return NextResponse.json({ ok: true })

    const paymentId = extractPaymentId(body)
    if (!paymentId || !/^\d+$/.test(paymentId)) {
      console.warn('[webhook] paymentId inválido:', paymentId)
      return NextResponse.json({ ok: true })
    }

    console.log('[webhook] processando paymentId:', paymentId)

    const paymentApi  = new Payment(mpClient)
    const paymentData = await paymentApi.get({ id: paymentId })

    if (paymentData.status !== 'approved') {
      console.log('[webhook] pagamento não aprovado:', paymentData.status)
      return NextResponse.json({ ok: true })
    }

    const externalRef = String(paymentData.external_reference ?? '').trim()
    if (!externalRef) {
      console.warn('[webhook] external_reference ausente')
      return NextResponse.json({ ok: true })
    }

    const parsed = parseExternalReference(externalRef)
    if (!parsed) {
      console.warn('[webhook] external_reference inválido:', externalRef)
      return NextResponse.json({ ok: true })
    }

    console.log('[webhook] processando carta:', parsed.cartaId, '| plano:', parsed.plano)

    const payerEmail = extractPayerEmail(paymentData)

    if (parsed.plano === 'impressao') {
      await processarImpressao(parsed.cartaId, paymentId, payerEmail)
    } else {
      await processarDigital(parsed.cartaId, paymentId, payerEmail)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[webhook] erro interno:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}

async function processarDigital(
  cartaId: string,
  paymentId: string,
  fallbackEmail?: string | null,
) {
  const { data, error } = await supabaseAdmin
    .from('cartas')
    .update({
      status:                 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at:                new Date().toISOString(),
    })
    .eq('id', cartaId)
    .in('status', ['rascunho', 'pendente_pagamento', 'pendente'])
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[webhook] erro ao ativar carta digital:', error)
    throw error
  }

  if (!data) {
    const { data: existente } = await supabaseAdmin
      .from('cartas')
      .select('id, status')
      .eq('id', cartaId)
      .maybeSingle()

    const cartaStatus = existente as CartaStatusRow | null
    if (!cartaStatus) {
      console.warn('[webhook] carta digital não encontrada:', cartaId)
    } else if (cartaStatus.status === 'ativo') {
      console.log('[webhook] carta já ativa — email não reenviado:', cartaId)
    }
    return
  }

  const carta            = data as CartaRow
  const nomeRemetente    = pickString(carta, ['nome_remetente',    'remetente'])    ?? 'Remetente'
  const nomeDestinatario = pickString(carta, ['nome_destinatario', 'destinatario']) ?? 'Destinatario'
  const nomePagador      = pickString(carta, ['nome_pagador', 'seu_nome', 'nome']) ?? ''

  let slug = pickString(carta, ['slug'])
  if (!slug) {
    slug = await garantirSlug(cartaId, nomeRemetente, nomeDestinatario)
  }

  let emailPagador =
    pickString(carta, ['email_pagador', 'email', 'seu_email', 'email_cliente']) ??
    (fallbackEmail ?? null)

  if (!pickString(carta, ['email_pagador']) && emailPagador) {
    await supabaseAdmin
      .from('cartas').update({ email_pagador: emailPagador }).eq('id', cartaId)
  }

  try { await moverFotos(cartaId) }
  catch (e) { console.error('[webhook] erro ao mover fotos:', e) }

  let qrCodeUrl: string | null = null
  try { qrCodeUrl = await gerarQRCode(cartaId, slug) }
  catch (e) { console.error('[webhook] erro ao gerar QR Code:', e) }

  if (!emailPagador) {
    console.warn('[webhook] email ausente — não enviará email:', cartaId)
    return
  }

  try {
    await enviarEmail({
      nome_pagador:      nomePagador,
      email_pagador:     emailPagador,
      nome_destinatario: nomeDestinatario,
      nome_remetente:    nomeRemetente,
      slug,
      qr_code_url:       qrCodeUrl,
    })
  } catch (e) {
    console.error('[webhook] erro ao enviar email digital:', e)
  }
}

async function processarImpressao(
  cartaId: string,
  paymentId: string,
  fallbackEmail?: string | null,
) {
  const { data: rawCarta, error } = await supabaseAdmin
    .from('cartas_impressao')
    .update({
      status:                 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at:                new Date().toISOString(),
    })
    .eq('id', cartaId)
    .in('status', ['rascunho', 'pendente_pagamento', 'pendente'])
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[webhook] erro ao ativar carta impressão:', error)
    throw error
  }

  if (!rawCarta) {
    const { data: existente } = await supabaseAdmin
      .from('cartas_impressao')
      .select('id, status')
      .eq('id', cartaId)
      .maybeSingle()

    const cartaStatus = existente as CartaStatusRow | null
    if (!cartaStatus) {
      console.warn('[webhook] carta impressão não encontrada:', cartaId)
    } else if (cartaStatus.status === 'ativo') {
      console.log('[webhook] carta impressão já ativa — idempotente:', cartaId)
    }
    return
  }

  const carta = rawCarta as CartaRow

  const emailPagador =
    pickString(carta, ['email_pagador', 'email', 'seu_email', 'email_cliente']) ??
    (fallbackEmail ?? null)

  if (!pickString(carta, ['email_pagador']) && emailPagador) {
    await supabaseAdmin
      .from('cartas_impressao').update({ email_pagador: emailPagador }).eq('id', cartaId)
  }

  let pdfUrl: string | null = null
  try { pdfUrl = await gerarPDF(cartaId, carta) }
  catch (e) { console.error('[webhook] erro ao gerar PDF:', e) }

  if (emailPagador) {
    try { await enviarEmailImpressao(carta, emailPagador, pdfUrl) }
    catch (e) { console.error('[webhook] erro ao enviar email impressão:', e) }
  } else {
    console.warn('[webhook] e-mail impressão ausente:', cartaId)
  }
}

async function enviarEmailImpressao(
  carta: CartaRow,
  emailPagador: string,
  pdfUrl: string | null,
) {
  if (!RESEND_API_KEY) { console.error('[webhook] RESEND_API_KEY ausente'); return }

  const nomePagador = escapeHtml(
    (pickString(carta, ['nome_pagador', 'seu_nome', 'nome']) ?? 'Cliente').slice(0, 80)
  )
  const nomeDestino = escapeHtml(
    (pickString(carta, ['destinatario', 'nome_destinatario']) ?? 'alguém especial').slice(0, 80)
  )

  const pdfUrlSafe = pdfUrl ? escapeHtml(pdfUrl) : null

  const resend = new Resend(RESEND_API_KEY)

  await resend.emails.send({
    from:    'Lovefy <contato@lovefy.app.br>',
    to:      emailPagador,
    subject: 'Sua carta para impressão está pronta! — Lovefy',
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
        <h1 style="color:#ff6b9d;text-align:center;margin:0 0 24px">Lovefy</h1>
        <h2 style="color:#fff;margin:0 0 16px">Olá, ${nomePagador}!</h2>
        <p style="color:#ccc;margin:0 0 24px">
          Sua carta para <strong style="color:#ff6b9d">${nomeDestino}</strong> está pronta para impressão.
        </p>
        ${pdfUrlSafe
          ? `<p style="text-align:center;margin:0 0 24px">
               <a href="${pdfUrlSafe}" style="background:#ff6b9d;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
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