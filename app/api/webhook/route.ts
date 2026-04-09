import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { moverFotos } from '@/lib/mover-fotos'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'
import { gerarPDF } from '@/lib/gerar-pdf'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET!

function validarAssinatura(request: NextRequest, rawBody: string): boolean {
  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')

  if (!xSignature || !xRequestId) return false

  const params = new URLSearchParams(request.nextUrl.search)
  const dataId = params.get('data.id') ?? ''
  const ts = xSignature.split(',').find(p => p.startsWith('ts='))?.split('=')[1] ?? ''

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const crypto = require('crypto')
  const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET)
  hmac.update(manifest)
  const hash = hmac.digest('hex')

  const v1 = xSignature.split(',').find(p => p.startsWith('v1='))?.split('=')[1]
  return hash === v1
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    if (!validarAssinatura(request, rawBody)) {
      console.warn('[webhook] assinatura inválida — request bloqueado')
      return NextResponse.json({ ok: false }, { status: 401 })
    }

    const body = JSON.parse(rawBody)
    console.log('[webhook] recebido:', JSON.stringify(body))

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    console.log('[webhook] status:', paymentData.status, '| ref:', paymentData.external_reference)

    if (paymentData.status !== 'approved') {
      return NextResponse.json({ ok: true })
    }

    const externalRef = paymentData.external_reference
    if (!externalRef) {
      return NextResponse.json({ ok: true })
    }

    const [carta_id, plano] = externalRef.includes('|')
      ? externalRef.split('|')
      : [externalRef, 'forever']

    const tabela = plano === 'impressao' ? 'cartas_impressao' : 'cartas'
    const { data: cartaAtual } = await supabaseAdmin
      .from(tabela)
      .select('id, status')
      .eq('id', carta_id)
      .single()

    if (!cartaAtual) {
      console.error('[webhook] carta não encontrada:', carta_id)
      return NextResponse.json({ ok: true })
    }

    if (cartaAtual.status === 'ativo') {
      console.log('[webhook] carta já ativada, ignorando duplicata:', carta_id)
      return NextResponse.json({ ok: true })
    }

    if (plano === 'impressao') {
      await processarImpressao(carta_id, String(paymentId))
    } else {
      await processarDigital(carta_id, String(paymentId), plano)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('[webhook] erro:', error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

async function processarDigital(carta_id: string, paymentId: string, plano: string) {
  const { data: carta, error } = await supabaseAdmin
    .from('cartas')
    .update({
      status: 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', carta_id)
    .select()
    .single()

  if (error || !carta) {
    console.error('[webhook] erro ao ativar carta digital:', error)
    return
  }

  console.log('[webhook] carta digital ativada:', carta_id)

  if (plano === '24h') {
    try {
      await supabaseAdmin.from('jobs').insert({
        tipo: 'deletar_carta_24h',
        carta_id,
        executar_em: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        status: 'pendente',
      })
      console.log('[webhook] deleção 24h agendada para:', carta_id)
    } catch (e) {
      console.error('[webhook] erro ao agendar deleção 24h:', e)
    }
  }

  try {
    await moverFotos(carta_id)
  } catch (e) {
    console.error('[webhook] erro ao mover fotos:', e)
  }

  let qr_code_url: string | null = null
  try {
    qr_code_url = await gerarQRCode(carta_id, carta.slug)
  } catch (e) {
    console.error('[webhook] erro ao gerar QR Code:', e)
  }

  try {
    await enviarEmail({
      nome_pagador: carta.nome_pagador,
      email_pagador: carta.email_pagador,
      nome_destinatario: carta.nome_destinatario,
      nome_remetente: carta.nome_remetente,
      slug: carta.slug,
      qr_code_url,
    })
  } catch (e) {
    console.error('[webhook] erro ao enviar email:', e)
  }
}

async function processarImpressao(carta_id: string, paymentId: string) {
  const { data: carta, error } = await supabaseAdmin
    .from('cartas_impressao')
    .update({
      status: 'ativo',
      mercadopago_payment_id: paymentId,
      paid_at: new Date().toISOString(),
    })
    .eq('id', carta_id)
    .select()
    .single()

  if (error || !carta) {
    console.error('[webhook] erro ao ativar carta impressao:', error)
    return
  }

  console.log('[webhook] carta impressao ativada:', carta_id)

  let pdf_url: string | null = null
  try {
    pdf_url = await gerarPDF(carta_id, carta)
  } catch (e) {
    console.error('[webhook] erro ao gerar PDF:', e)
  }

  try {
    await enviarEmailImpressao(carta, pdf_url)
  } catch (e) {
    console.error('[webhook] erro ao enviar email impressao:', e)
  }
}

async function enviarEmailImpressao(carta: any, pdf_url: string | null) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  const nomeDestino = carta.destinatario || carta.nome_destinatario || 'alguém especial'

  await resend.emails.send({
    from: 'Lovefy <contato@lovefy.app.br>',
    to: carta.email_pagador,
    subject: 'Sua carta para impressão está pronta! — Lovefy',
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Inter,Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
        <h1 style="color:#ff6b9d;text-align:center;margin:0 0 24px">Lovefy</h1>
        <h2 style="color:#fff;margin:0 0 16px">Olá, ${carta.nome_pagador}!</h2>
        <p style="color:#ccc;margin:0 0 24px">
          Sua carta para <strong style="color:#ff6b9d">${nomeDestino}</strong> está pronta para impressão!
        </p>
        ${pdf_url
          ? `<p style="text-align:center;margin:0 0 24px">
              <a href="${pdf_url}" style="background:#ff6b9d;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">
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