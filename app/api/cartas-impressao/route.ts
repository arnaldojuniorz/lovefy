import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      destinatario,
      remetente,
      como_se_conheceram,
      memoria_especial,
      mensagem,
      data_importante,
      cor,
      estilo,
      musica_link,
      nome_pagador,
      email_pagador,
    } = body

    if (!destinatario || !remetente || !mensagem) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos' },
        { status: 400 }
      )
    }

    if (!nome_pagador || !email_pagador) {
      return NextResponse.json(
        { error: 'Nome e email do pagador são obrigatórios' },
        { status: 400 }
      )
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas_impressao')
      .insert({
        destinatario,
        remetente,
        como_se_conheceram,
        memoria_especial,
        mensagem,
        data_importante: data_importante || null,
        cor: cor || '#ff6b9d',
        estilo: estilo || 'classico',
        musica_link,
        nome_pagador,
        email_pagador,
        status: 'pendente',
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar carta impressao:', error)
      return NextResponse.json(
        { error: 'Erro ao salvar carta' },
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