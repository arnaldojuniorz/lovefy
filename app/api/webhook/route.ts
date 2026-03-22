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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Webhook recebido:', JSON.stringify(body))

    if (body.type !== 'payment') {
      return NextResponse.json({ ok: true })
    }

    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ ok: true })
    }

    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    console.log('Pagamento:', paymentData.status, paymentData.external_reference)

    const externalRef = paymentData.external_reference
    if (!externalRef) {
      return NextResponse.json({ ok: true })
    }

    // Separar carta_id e tipo
    const [carta_id, tipo] = externalRef.includes('|')
      ? externalRef.split('|')
      : [externalRef, 'digital']

    if (paymentData.status === 'approved') {
      if (tipo === 'impressao') {
        // Ativar carta de impressão
        const { data: carta } = await supabaseAdmin
          .from('cartas_impressao')
          .update({
            status: 'ativo',
            mercadopago_payment_id: String(paymentId),
            paid_at: new Date().toISOString(),
          })
          .eq('id', carta_id)
          .select()
          .single()

        console.log('Carta impressao ativada:', carta_id)

        // Gerar PDF e enviar email
        if (carta) {
          const pdf_url = await gerarPDF(carta_id, carta)
          await enviarEmailImpressao(carta, pdf_url)
        }

      } else {
        // Ativar carta digital
        const { data: carta } = await supabaseAdmin
          .from('cartas')
          .update({
            status: 'ativo',
            mercadopago_payment_id: String(paymentId),
            paid_at: new Date().toISOString(),
          })
          .eq('id', carta_id)
          .select()
          .single()

        console.log('Carta digital ativada:', carta_id)

        if (carta) {
          await moverFotos(carta_id)
          const qr_code_url = await gerarQRCode(carta_id, carta.slug)
          await enviarEmail({
            nome_pagador: carta.nome_pagador,
            email_pagador: carta.email_pagador,
            nome_destinatario: carta.nome_destinatario,
            nome_remetente: carta.nome_remetente,
            slug: carta.slug,
            qr_code_url,
          })
        }
      }
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}

async function enviarEmailImpressao(carta: any, pdf_url: string | null) {
  const { Resend } = await import('resend')
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Lovefy <contato@lovefy.app.br>',
    to: carta.email_pagador,
    subject: 'Sua carta para impressao esta pronta! - Lovefy',
    html: `
      <div style="background:#1a1a2e;padding:40px 20px;font-family:Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
        <h1 style="color:#ff6b9d;text-align:center">Lovefy</h1>
        <h2 style="color:#fff">Ola, ${carta.nome_pagador}!</h2>
        <p style="color:#ccc">Sua carta para <strong style="color:#ff6b9d">${carta.destinatario}</strong> esta pronta para impressao!</p>
        ${pdf_url ? `<p style="text-align:center"><a href="${pdf_url}" style="background:#ff6b9d;color:#fff;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold">Baixar PDF</a></p>` : '<p style="color:#ccc">Em breve voce recebera o PDF da sua carta.</p>'}
        <p style="color:#555;font-size:12px;text-align:center">Feito com amor pelo Lovefy</p>
      </div>
    `,
  })
}
export async function GET() {
  return NextResponse.json({ ok: true })
}