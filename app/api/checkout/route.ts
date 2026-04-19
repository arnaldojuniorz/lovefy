import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Preference } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

const PLANOS = {
  'forever':   { preco: 12.90, titulo: 'Carta Digital Para Sempre', categoria: 'services' },
  'impressao': { preco: 9.90,  titulo: 'Carta para Impressão',      categoria: 'services' },
}

const BASE_URL = 'https://www.lovefy.app.br'

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

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from(tabela)
      .select('*')
      .eq('id', carta_id)
      .single()

    if (cartaError || !carta) {
      console.error('[checkout] carta não encontrada:', cartaError)
      return NextResponse.json({ error: 'Carta não encontrada' }, { status: 404 })
    }

    const nomeCompleto = carta.nome_pagador ?? carta.remetente ?? 'Cliente'
    const nomeParts    = nomeCompleto.trim().split(' ')
    const firstName    = nomeParts[0] ?? 'Cliente'
    const lastName     = nomeParts.slice(1).join(' ') || firstName
    const emailPagador = carta.email_pagador ?? 'pagador@lovefy.app.br'

    const externalReference = `${carta_id}|${plano}`
    const successUrl = `${BASE_URL}/obrigado?carta_id=${carta_id}&plano=${plano}&tipo=${tipo || 'digital'}`
    const failureUrl = tipo === 'impressao' ? `${BASE_URL}/imprimir` : `${BASE_URL}/criar`

    const preference = new Preference(client)
    const response = await preference.create({
      body: {
        items: [
          {
            id:          carta_id,
            title:       planoSelecionado.titulo,
            description: `Lovefy - ${planoSelecionado.titulo}`,
            category_id: planoSelecionado.categoria,
            quantity:    1,
            unit_price:  planoSelecionado.preco,
            currency_id: 'BRL',
          },
        ],
        payer: {
          name:       nomeCompleto,
          email:      emailPagador,
          first_name: firstName,
          last_name:  lastName,
        } as any,
        back_urls: {
          success: successUrl,
          failure: failureUrl,
          pending: successUrl,
        },
        auto_return:          'approved',
        external_reference:   externalReference,
        notification_url:     `${BASE_URL}/api/webhook`,
        statement_descriptor: 'LOVEFY',
        expires:              true,
        expiration_date_from: new Date().toISOString(),
        expiration_date_to:   new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      },
    })

    await supabaseAdmin
      .from(tabela)
      .update({ mercadopago_preference_id: response.id })
      .eq('id', carta_id)

    return NextResponse.json({
      preference_id: response.id,
      checkout_url:  response.init_point,
    })

  } catch (error: any) {
    console.error('[checkout] erro:', error)
    return NextResponse.json(
      { error: 'Erro ao criar preferência de pagamento', detalhe: error?.message },
      { status: 500 }
    )
  }
}