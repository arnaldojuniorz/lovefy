import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { moverFotos } from '@/lib/mover-fotos'

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

    // Buscar detalhes do pagamento
    const payment = new Payment(client)
    const paymentData = await payment.get({ id: paymentId })

    console.log('Pagamento:', paymentData.status, paymentData.external_reference)

    const carta_id = paymentData.external_reference

    if (!carta_id) {
      return NextResponse.json({ ok: true })
    }

    if (paymentData.status === 'approved') {
      // Atualizar status da carta
      await supabaseAdmin
        .from('cartas')
        .update({
          status: 'ativo',
          mercadopago_payment_id: String(paymentId),
          paid_at: new Date().toISOString(),
        })
        .eq('id', carta_id)

      console.log('Carta ativada:', carta_id)

      // Mover fotos para storage permanente
      await moverFotos(carta_id)
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return NextResponse.json({ ok: true }, { status: 200 })
  }
}