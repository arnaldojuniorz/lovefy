import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const carta_id = formData.get('carta_id') as string
    const ordem = formData.get('ordem') as string

    if (!file || !carta_id) {
      return NextResponse.json(
        { error: 'Arquivo e carta_id são obrigatórios' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.' },
        { status: 400 }
      )
    }

    // Validar tamanho (máx 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo 5MB.' },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const extensao = file.name.split('.').pop()
    const nomeArquivo = `${carta_id}/${Date.now()}.${extensao}`

    // Upload para bucket temporário
    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos-temp')
      .upload(nomeArquivo, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao fazer upload da imagem' },
        { status: 500 }
      )
    }

    // Salvar referência no banco
    const { data: foto, error: dbError } = await supabaseAdmin
      .from('fotos')
      .insert({
        carta_id,
        storage_path: nomeArquivo,
        is_temp: true,
        ordem: parseInt(ordem) || 0,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Erro ao salvar foto:', dbError)
      return NextResponse.json(
        { error: 'Erro ao salvar referência da foto' },
        { status: 500 }
      )
    }

    // Gerar URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from('fotos-temp')
      .getPublicUrl(nomeArquivo)

    return NextResponse.json({
      foto_id: foto.id,
      url: urlData.publicUrl,
      path: nomeArquivo,
    })

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
      return NextResponse.json(
        { error: 'Erro ao atualizar carta' },
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