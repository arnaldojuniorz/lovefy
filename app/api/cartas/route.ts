import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      nome_destinatario,
      nome_remetente,
      como_se_conheceram,
      memoria_especial,
      data_importante,
      mensagem_principal,
      estilo_fundo,
      estilo_animacao,
      recursos,
      musica_link,
      musica_nome,
      slug,
      nome_pagador,
      email_pagador,
    } = body

    if (!nome_destinatario || !nome_remetente) {
      return NextResponse.json(
        { error: 'Nome do destinatário e remetente são obrigatórios' },
        { status: 400 }
      )
    }

    if (!slug || slug.length < 3) {
      return NextResponse.json(
        { error: 'Slug inválido' },
        { status: 400 }
      )
    }

    if (!nome_pagador || !email_pagador) {
      return NextResponse.json(
        { error: 'Nome e email do pagador são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: slugExistente } = await supabaseAdmin
      .from('cartas')
      .select('id')
      .eq('slug', slug)
      .single()

    if (slugExistente) {
      return NextResponse.json(
        { error: 'Esse link já está em uso. Escolha outro!' },
        { status: 409 }
      )
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome_destinatario,
        nome_remetente,
        como_se_conheceram,
        memoria_especial,
        data_importante,
        mensagem_principal,
        estilo_fundo: estilo_fundo || 'stars',
        estilo_animacao: estilo_animacao || 'float',
        recursos: recursos || [],
        musica_link,
        musica_nome,
        slug,
        nome_pagador,
        email_pagador,
        status: 'pendente',
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar carta:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar carta' },
        { status: 500 }
      )
    }

    return NextResponse.json({ carta_id: carta.id, slug: carta.slug })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { carta_id, ...campos } = body
    console.log('PATCH carta_id:', carta_id, 'campos:', JSON.stringify(campos))

    if (!carta_id) {
      return NextResponse.json(
        { error: 'carta_id é obrigatório' },
        { status: 400 }
      )
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .eq('id', carta_id)
      .select()
      .single()

    if (error) {
  console.error('Erro PATCH carta:', JSON.stringify(error))
  return NextResponse.json(
    { error: 'Erro ao atualizar carta', detalhe: error.message },
    { status: 500 }
  )
}

    return NextResponse.json({ carta_id: carta.id })

  } catch (error) {
    console.error('Erro interno:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}