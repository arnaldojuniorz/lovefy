import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome_destinatario, nome_remetente, como_se_conheceram, memoria_especial } = body

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
        como_se_conheceram:  como_se_conheceram || null,
        memoria_especial:    memoria_especial   || null,
        estilo_fundo:        'stars',
        estilo_animacao:     'float',
        recursos:            [],
        status:              'rascunho',
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

    const protegidos = ['id', 'created_at', 'mercadopago_payment_id', 'paid_at']
    protegidos.forEach(c => delete campos[c])

    if (campos.slug !== undefined) {
      if (!campos.slug || campos.slug.length < 3) {
        return NextResponse.json({ error: 'O link deve ter pelo menos 3 caracteres' }, { status: 400 })
      }

      const { data: slugExistente } = await supabaseAdmin
        .from('cartas')
        .select('id')
        .eq('slug', campos.slug)
        .neq('id', carta_id)
        .maybeSingle()

      if (slugExistente) {
        return NextResponse.json({ error: 'Esse link já está em uso. Escolha outro!' }, { status: 409 })
      }
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
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
  const slug = new URL(request.url).searchParams.get('slug')
  if (!slug || slug.length < 3) return NextResponse.json({ disponivel: false })

  const { data } = await supabaseAdmin
    .from('cartas')
    .select('id')
    .eq('slug', slug)
    .neq('status', 'rascunho')
    .maybeSingle()

  return NextResponse.json({ disponivel: !data })
}