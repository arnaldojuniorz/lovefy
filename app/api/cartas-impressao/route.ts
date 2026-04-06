import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      destinatario,
      remetente,
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
        mensagem,
        data_importante: data_importante || null,
        cor:             '#ffffff',
        estilo:          'moderno',
        musica_link:     musica_link || null,
        nome_pagador,
        email_pagador,
        status:          'pendente',
      })
      .select()
      .single()

    if (error) {
      console.error('[cartas-impressao POST] erro:', error)
      return NextResponse.json({ error: 'Erro ao salvar carta' }, { status: 500 })
    }

    return NextResponse.json({ carta_id: carta.id })

  } catch (error) {
    console.error('[cartas-impressao POST] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const id = new URL(request.url).searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('cartas_impressao')
    .select('id, status, pdf_url, destinatario')
    .eq('id', id)
    .single()

  return NextResponse.json(data ?? {})
}