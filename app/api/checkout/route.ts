import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const { carta_id } = await request.json()

    if (!carta_id) {
      return NextResponse.json(
        { error: 'carta_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .select('*')
      .eq('id', carta_id)
      .single()

    if (error || !carta) {
      return NextResponse.json(
        { error: 'Carta não encontrada' },
        { status: 404 }
      )
    }

    const successUrl = 'https://lovefy.app.br/obrigado?carta_id=' + carta_id
    const failureUrl = 'https://lovefy.app.br/criar'
    const pendingUrl = 'https://lovefy.app.br/obrigado?carta_id=' + carta_id
    const webhookUrl = 'https://lovefy.app.br/api/webhook'

    console.log('URLs:', { successUrl, failureUrl, pendingUrl })

    const preference = new Preference(client)
    const response = await preference.create({
      body: {
        items: [
          {
            id: carta_id,
            title: 'Carta Lovefy',
            quantity: 1,
            unit_price: 29.90,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name: carta.nome_pagador,
          email: carta.email_pagador,
        },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: pendingUrl,
        },
        auto_return: 'approved',
        external_reference: carta_id,
        notification_url: webhookUrl,
      },
    })

    await supabaseAdmin
      .from('cartas')
      .update({ mercadopago_preference_id: response.id })
      .eq('id', carta_id)

    return NextResponse.json({
      preference_id: response.id,
      checkout_url: response.init_point,
    })

  } catch (error) {
    console.error('Erro ao criar preferência:', error)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento' },
      { status: 500 }
    )
  }
}