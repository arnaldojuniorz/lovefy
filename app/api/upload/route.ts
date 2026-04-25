import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const MAX_FOTOS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function parseOrdem(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') return 0
  const n = Number(value)
  if (!Number.isInteger(n)) return 0
  if (n < 0) return 0
  if (n > MAX_FOTOS - 1) return MAX_FOTOS - 1
  return n
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const fileEntry = formData.get('file')
    const cartaIdEntry = formData.get('carta_id')
    const ordemEntry = formData.get('ordem')

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
      return jsonError('Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.', 400)
    }

    if (fileEntry.size <= 0) {
      return jsonError('Arquivo vazio', 400)
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return jsonError('Arquivo muito grande. Máximo 5MB.', 400)
    }

    const { data: carta, error: cartaError } = await supabaseAdmin
      .from('cartas')
      .select('id, status')
      .eq('id', cartaId)
      .maybeSingle()

    if (cartaError) {
      console.error('[upload] erro ao consultar carta')
      return jsonError('Erro ao validar carta', 500)
    }

    if (!carta) {
      return jsonError('Carta não encontrada', 404)
    }

    if (carta.status === 'ativo') {
      return jsonError('Carta já ativa e bloqueada para novos uploads', 409)
    }

    const { count, error: countError } = await supabaseAdmin
      .from('fotos')
      .select('id', { count: 'exact', head: true })
      .eq('carta_id', cartaId)

    if (countError) {
      console.error('[upload] erro ao contar fotos')
      return jsonError('Erro ao validar limite de fotos', 500)
    }

    const totalFotos = count ?? 0
    if (totalFotos >= MAX_FOTOS) {
      return jsonError(`Limite de ${MAX_FOTOS} fotos atingido para esta carta`, 409)
    }

    const ordem = parseOrdem(ordemEntry)
    const bytes = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const nomeArquivo = `${cartaId}/${Date.now()}-${randomUUID()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos-temp')
      .upload(nomeArquivo, buffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload] erro no storage')
      return jsonError('Erro ao fazer upload da imagem', 500)
    }

    const { data: foto, error: dbError } = await supabaseAdmin
      .from('fotos')
      .insert({
        carta_id: cartaId,
        storage_path: nomeArquivo,
        is_temp: true,
        ordem,
      })
      .select('id, storage_path, ordem')
      .single()

    if (dbError) {
      console.error('[upload] erro ao salvar referência da foto')

      await supabaseAdmin.storage
        .from('fotos-temp')
        .remove([nomeArquivo])
        .catch(() => {})

      return jsonError('Erro ao salvar referência da foto', 500)
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fotos-temp')
      .getPublicUrl(nomeArquivo)

    return NextResponse.json(
      {
        foto_id: foto.id,
        url: urlData.publicUrl,
        path: nomeArquivo,
        ordem: foto.ordem,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[upload] erro interno', error)
    return jsonError('Erro interno do servidor', 500)
  }
}