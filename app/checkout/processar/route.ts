import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { supabaseAdmin } from '@/lib/supabase'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { carta_id, plano, tipo, ...formData } = body

    const payment = new Payment(client)

    const response = await payment.create({
      body: {
        ...formData.formData,
        external_reference: `${carta_id}|${tipo}`,
        notification_url: 'https://lovefy.app.br/api/webhook',
      },
    })

    console.log('[processar] status:', response.status, '| id:', response.id)

    return NextResponse.json({
      status: response.status,
      payment_id: response.id,
    })

  } catch (error: any) {
    console.error('[processar] erro:', error?.message)
    return NextResponse.json(
      { error: 'Erro ao processar pagamento', detalhe: error?.message },
      { status: 500 }
    )
  }
}