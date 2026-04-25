import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const fileEntry = formData.get('file')
    const cartaIdEntry = formData.get('carta_id')

    if (!(fileEntry instanceof File)) {
      return jsonError('Arquivo é obrigatório', 400)
    }

    const cartaId = typeof cartaIdEntry === 'string' ? cartaIdEntry.trim() : ''
    if (!UUID_REGEX.test(cartaId)) {
      return jsonError('carta_id inválido', 400)
    }

    const mimeType = fileEntry.type
    const ext = MIME_TO_EXT[mimeType]
    if (!ext) {
      return jsonError('Use JPG, PNG ou WEBP', 400)
    }

    if (fileEntry.size <= 0) {
      return jsonError('Arquivo vazio', 400)
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return jsonError('Máximo 5MB', 400)
    }

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from('cartas')
      .select('id, status, foto_destaque')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[upload-destaque] erro ao consultar carta')
      return jsonError('Erro ao validar carta', 500)
    }

    if (!carta) {
      return jsonError('Carta não encontrada', 404)
    }

    if (carta.status === 'ativo') {
      return jsonError('Carta já ativa e bloqueada para edição de foto', 409)
    }

    const bytes = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const path = `destaque/${cartaId}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, buffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('[upload-destaque] erro no storage')
      return jsonError('Erro ao fazer upload', 500)
    }

    const { error: updateError } = await supabaseAdmin
      .from('cartas')
      .update({ foto_destaque: path })
      .eq('id', cartaId)
      .in('status', ['rascunho', 'pendente_pagamento'])

    if (updateError) {
      console.error('[upload-destaque] erro ao atualizar carta')
      return jsonError('Erro ao salvar foto de destaque', 500)
    }

    const { data: urlData } = supabaseAdmin.storage.from('fotos').getPublicUrl(path)

    return NextResponse.json(
      {
        url: urlData.publicUrl,
        path,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[upload-destaque] erro interno', error)
    return jsonError('Erro interno', 500)
  }
}