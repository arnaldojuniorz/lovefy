import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const PLANOS = {
  '24h': { preco: 6.90, titulo: 'Lovefy 24 Horas' },
  'forever': { preco: 12.90, titulo: 'Lovefy Para Sempre' },
  'impressao': { preco: 9.90, titulo: 'Lovefy Carta Impressao' },
}

export async function POST(request: NextRequest) {
  try {
    const { carta_id, plano, tipo } = await request.json()

    if (!carta_id) {
      return NextResponse.json(
        { error: 'carta_id é obrigatório' },
        { status: 400 }
      )
    }

    const planoSelecionado = PLANOS[plano as keyof typeof PLANOS] || PLANOS['forever']

    // Buscar carta na tabela correta
    let carta = null
    if (tipo === 'impressao') {
      const { data } = await supabaseAdmin
        .from('cartas_impressao')
        .select('*')
        .eq('id', carta_id)
        .single()
      carta = data
    } else {
      const { data } = await supabaseAdmin
        .from('cartas')
        .select('*')
        .eq('id', carta_id)
        .single()
      carta = data
    }

    if (!carta) {
      return NextResponse.json(
        { error: 'Carta não encontrada' },
        { status: 404 }
      )
    }

    const successUrl = 'https://lovefy.app.br/obrigado?carta_id=' + carta_id + '&tipo=' + (tipo || 'digital')
    const failureUrl = tipo === 'impressao' ? 'https://lovefy.app.br/imprimir' : 'https://lovefy.app.br/criar'
    const pendingUrl = successUrl
    const webhookUrl = 'https://lovefy.app.br/api/webhook'

    const preference = new Preference(client)
    const response = await preference.create({
      body: {
        items: [
          {
            id: carta_id,
            title: planoSelecionado.titulo,
            quantity: 1,
            unit_price: planoSelecionado.preco,
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
        external_reference: carta_id + '|' + (tipo || 'digital'),
        notification_url: webhookUrl,
      },
    })

    await supabaseAdmin
      .from(tipo === 'impressao' ? 'cartas_impressao' : 'cartas')
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