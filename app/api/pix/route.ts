import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const PLANOS: Record<string, { preco: number; titulo: string }> = {
  '24h': { preco: 6.90, titulo: 'Lovefy - Carta Digital 24h' },
  'forever': { preco: 12.90, titulo: 'Lovefy - Carta Digital Para Sempre' },
  'impressao': { preco: 9.90, titulo: 'Lovefy - Carta para Impressao' },
}

export async function POST(request: NextRequest) {
  try {
    const { carta_id, plano, tipo, email_pagador, nome_pagador } = await request.json()

    if (!carta_id || !plano) {
      return NextResponse.json({ error: 'carta_id e plano são obrigatórios' }, { status: 400 })
    }

    const planoData = PLANOS[plano] || PLANOS['forever']

    const payment = new Payment(client)

    const response = await payment.create({
      body: {
        transaction_amount: planoData.preco,
        description: planoData.titulo,
        payment_method_id: 'pix',
        payer: {
          email: email_pagador || 'pagador@lovefy.app.br',
          first_name: nome_pagador || 'Cliente',
        },
        external_reference: `${carta_id}|${plano}`,
        notification_url: 'https://www.lovefy.app.br/api/webhook',
      },
    })

    const pixData = response.point_of_interaction?.transaction_data

    if (!pixData?.qr_code) {
      return NextResponse.json({ error: 'QR Code não gerado' }, { status: 500 })
    }

    return NextResponse.json({
      payment_id: response.id,
      qr_code: pixData.qr_code,
      qr_code_base64: pixData.qr_code_base64,
      valor: planoData.preco,
    })

  } catch (error: any) {
    console.error('Erro Pix MP:', error)
    return NextResponse.json({ error: 'Erro ao criar cobrança Pix', detalhe: error?.message }, { status: 500 })
  }
}