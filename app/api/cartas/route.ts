import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome_destinatario, nome_remetente } = body

    if (!nome_destinatario || !nome_remetente) {
      return NextResponse.json(
        { error: 'Nome do destinatário e remetente são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome_destinatario,
        nome_remetente,
        estilo_fundo:    'stars',
        estilo_animacao: 'float',
        recursos:        [],
        status:          'rascunho',
      })
      .select()
      .single()

    if (error) {
      console.error('[cartas POST] erro:', error)
      return NextResponse.json({ error: 'Erro ao salvar carta' }, { status: 500 })
    }

    return NextResponse.json({ carta_id: carta.id })

  } catch (error) {
    console.error('[cartas POST] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { carta_id, ...campos } = body

    if (!carta_id) {
      return NextResponse.json({ error: 'carta_id é obrigatório' }, { status: 400 })
    }

    // Colunas permitidas — apenas as que existem na tabela
    const COLUNAS_PERMITIDAS = [
      'nome_destinatario',
      'nome_remetente',
      'data_importante',
      'mensagem_principal',
      'estilo_fundo',
      'estilo_animacao',
      'recursos',
      'musica_link',
      'slug',
      'nome_pagador',
      'email_pagador',
      'status',
      'mercadopago_preference_id',
      'mercadopago_payment_id',
      'qr_code_url',
      'plano',
      'jogo_palavra1',
      'jogo_palavra2',
      'jogo_palavra3',
      'mapa_estrelas_url',
      'foto_destaque',
    ]

    // Filtra apenas colunas válidas
    const camposValidos = Object.fromEntries(
      Object.entries(campos).filter(([key]) => COLUNAS_PERMITIDAS.includes(key))
    )

    if (Object.keys(camposValidos).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    // Verifica slug duplicado
    if (camposValidos.slug !== undefined) {
      if (!camposValidos.slug || (camposValidos.slug as string).length < 3) {
        return NextResponse.json({ error: 'O link deve ter pelo menos 3 caracteres' }, { status: 400 })
      }
      const { data: slugExistente } = await supabaseAdmin
        .from('cartas')
        .select('id')
        .eq('slug', camposValidos.slug)
        .neq('id', carta_id)
        .maybeSingle()

      if (slugExistente) {
        return NextResponse.json({ error: 'Esse link já está em uso. Escolha outro!' }, { status: 409 })
      }
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .update(camposValidos)
      .eq('id', carta_id)
      .select()
      .single()

    if (error) {
      console.error('[cartas PATCH] erro:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'Erro ao atualizar carta', detalhe: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ carta_id: carta.id })

  } catch (error) {
    console.error('[cartas PATCH] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const url  = new URL(request.url)
  const id   = url.searchParams.get('id')
  const slug = url.searchParams.get('slug')

  if (!id && !slug) {
    return NextResponse.json({ disponivel: false })
  }

  if (id) {
    const { data } = await supabaseAdmin
      .from('cartas')
      .select('id, slug, status, nome_destinatario, nome_remetente, qr_code_url')
      .eq('id', id)
      .single()
    return NextResponse.json(data ?? {})
  }

  const { data } = await supabaseAdmin
    .from('cartas')
    .select('id')
    .eq('slug', slug!)
    .neq('status', 'rascunho')
    .maybeSingle()

  return NextResponse.json({ disponivel: !data })
}