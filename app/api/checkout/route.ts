import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const PLANOS = {
  '24h':       { preco: 6.90,  titulo: 'Lovefy - Carta Digital 24h' },
  'forever':   { preco: 12.90, titulo: 'Lovefy - Carta Digital Para Sempre' },
  'impressao': { preco: 9.90,  titulo: 'Lovefy - Carta para Impressão' },
}

const BASE_URL = 'https://lovefy.app.br'

export async function POST(request: NextRequest) {
  try {
    const { carta_id, plano, tipo } = await request.json()

    if (!carta_id || !plano) {
      return NextResponse.json(
        { error: 'carta_id e plano são obrigatórios' },
        { status: 400 }
      )
    }

    const planoSelecionado = PLANOS[plano as keyof typeof PLANOS] ?? PLANOS['forever']
    const tabela = tipo === 'impressao' ? 'cartas_impressao' : 'cartas'

    const { data: carta } = await supabaseAdmin
      .from(tabela)
      .select('id, nome_pagador, email_pagador, slug')
      .eq('id', carta_id)
      .single()

    if (!carta) {
      return NextResponse.json({ error: 'Carta não encontrada' }, { status: 404 })
    }

    const externalReference = `${carta_id}|${plano}`

    const successUrl = `${BASE_URL}/obrigado?carta_id=${carta_id}&plano=${plano}&tipo=${tipo || 'digital'}`
    const failureUrl = tipo === 'impressao' ? `${BASE_URL}/imprimir` : `${BASE_URL}/criar`

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
          name: carta.nome_pagador ?? 'Cliente',
          email: carta.email_pagador ?? 'pagador@lovefy.app.br',
        },
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl,
        },
        auto_return: 'approved',
        external_reference: externalReference,
        notification_url: `${BASE_URL}/api/webhook`,
        expires: true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })

    await supabaseAdmin
      .from(tabela)
      .update({ mercadopago_preference_id: response.id })
      .eq('id', carta_id)

    return NextResponse.json({
      preference_id: response.id,
      checkout_url: response.init_point,
    })

  } catch (error: any) {
    console.error('[checkout] erro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento', detalhe: error?.message },
      { status: 500 }
    )
  }
}