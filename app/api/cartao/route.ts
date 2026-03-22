import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const PLANOS: Record<string, number> = {
  '24h': 6.90,
  'forever': 12.90,
  'impressao': 9.90,
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      carta_id,
      plano,
      tipo,
      token,
      issuer_id,
      payment_method_id,
      transaction_amount,
      installments,
      email_pagador,
      nome_pagador,
      payer,
    } = body

    const valor = PLANOS[plano] || transaction_amount || 9.90

    const payment = new Payment(client)

    const response = await payment.create({
      body: {
        transaction_amount: valor,
        token,
        issuer_id,
        payment_method_id,
        installments: installments || 1,
        description: `Lovefy - ${plano}`,
        external_reference: `${carta_id}|${tipo || 'digital'}`,
        notification_url: 'https://lovefy.app.br/api/webhook',
        payer: {
          email: payer?.email || email_pagador || 'pagador@lovefy.app.br',
          first_name: nome_pagador || 'Cliente',
        },
      },
    })

    return NextResponse.json({
      status: response.status,
      status_detail: response.status_detail,
      payment_id: response.id,
    })

  } catch (error: any) {
    console.error('Erro cartão MP:', error)
    return NextResponse.json({ error: 'Erro ao processar cartão', detalhe: error?.message }, { status: 500 })
  }
}