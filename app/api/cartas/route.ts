import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// ✅ Apenas campos que o FRONTEND pode enviar
// Campos como status, plano, paid_at, mercadopago_* só o webhook (service_role) atualiza
const CAMPOS_FRONTEND = new Set([
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
  'foto_destaque',
  'jogo_palavra1',
  'jogo_palavra2',
  'jogo_palavra3',
])

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome_destinatario, nome_remetente } = body

    if (!nome_destinatario?.trim() || !nome_remetente?.trim()) {
      return NextResponse.json(
        { error: 'Nome do destinatário e remetente são obrigatórios' },
        { status: 400 }
      )
    }

    // Sanitiza entradas
    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .insert({
        nome_destinatario: String(nome_destinatario).slice(0, 100).trim(),
        nome_remetente:    String(nome_remetente).slice(0, 100).trim(),
        estilo_fundo:      'stars',
        estilo_animacao:   'float',
        recursos:          [],
        status:            'rascunho',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[cartas POST] erro ao inserir')
      return NextResponse.json({ error: 'Erro ao salvar carta' }, { status: 500 })
    }

    return NextResponse.json({ carta_id: carta.id })

  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { carta_id, ...campos } = body

    if (!carta_id || typeof carta_id !== 'string') {
      return NextResponse.json({ error: 'carta_id é obrigatório' }, { status: 400 })
    }

    // ✅ Filtra apenas campos que o frontend pode alterar
    const camposLimpos: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(campos)) {
      if (CAMPOS_FRONTEND.has(key)) {
        camposLimpos[key] = value
      }
    }

    if (Object.keys(camposLimpos).length === 0) {
      return NextResponse.json({ error: 'Nenhum campo válido para atualizar' }, { status: 400 })
    }

    // Sanitiza strings
    for (const key of ['nome_destinatario', 'nome_remetente', 'nome_pagador']) {
      if (typeof camposLimpos[key] === 'string') {
        camposLimpos[key] = (camposLimpos[key] as string).slice(0, 100).trim()
      }
    }
    if (typeof camposLimpos.mensagem_principal === 'string') {
      camposLimpos.mensagem_principal = (camposLimpos.mensagem_principal as string).slice(0, 2000)
    }
    if (typeof camposLimpos.email_pagador === 'string') {
      camposLimpos.email_pagador = (camposLimpos.email_pagador as string).slice(0, 200).toLowerCase().trim()
    }

    // Valida slug
    if (camposLimpos.slug !== undefined) {
      const slug = String(camposLimpos.slug).trim()
      if (slug.length < 3) {
        return NextResponse.json({ error: 'O link deve ter pelo menos 3 caracteres' }, { status: 400 })
      }
      // Só permite letras, números e hífens
      if (!/^[a-z0-9-]+$/i.test(slug)) {
        return NextResponse.json({ error: 'O link só pode ter letras, números e hífens' }, { status: 400 })
      }
      const { data: slugExistente } = await supabaseAdmin
        .from('cartas')
        .select('id')
        .eq('slug', slug)
        .neq('id', carta_id)
        .maybeSingle()

      if (slugExistente) {
        return NextResponse.json({ error: 'Esse link já está em uso. Escolha outro!' }, { status: 409 })
      }
      camposLimpos.slug = slug.toLowerCase()
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .update(camposLimpos)
      .eq('id', carta_id)
      .select('id')
      .single()

    if (error) {
      // Não vaza detalhes do erro de DB para o cliente
      console.error('[cartas PATCH] erro ao atualizar')
      return NextResponse.json({ error: 'Erro ao atualizar carta' }, { status: 500 })
    }

    return NextResponse.json({ carta_id: carta.id })

  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const url  = new URL(request.url)
    const id   = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')

    if (!id && !slug) {
      return NextResponse.json({ disponivel: false })
    }

    if (id) {
      // ✅ Retorna apenas campos não-sensíveis — sem email, sem payment_id
      const { data } = await supabaseAdmin
        .from('cartas')
        .select('id, slug, status, nome_destinatario, nome_remetente, qr_code_url')
        .eq('id', id)
        .single()
      return NextResponse.json(data ?? {})
    }

    // Verifica disponibilidade de slug
    const { data } = await supabaseAdmin
      .from('cartas')
      .select('id')
      .eq('slug', slug!)
      .neq('status', 'rascunho')
      .maybeSingle()

    return NextResponse.json({ disponivel: !data })

  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}