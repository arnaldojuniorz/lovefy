import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

// GIF excluído intencionalmente para foto de destaque (apenas JPG, PNG, WEBP)
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
]

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(15, '60 s'),
  prefix: 'rl:upload-destaque',
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function detectMimeFromBuffer(buffer: Buffer): string | null {
  for (const magic of MAGIC_BYTES) {
    const offset = magic.offset ?? 0
    const slice  = buffer.slice(offset, offset + magic.bytes.length)
    const match  = magic.bytes.every((byte, i) => slice[i] === byte)
    if (match) {
      // Validação extra para WebP: bytes 8-11 devem ser "WEBP"
      if (magic.mime === 'image/webp') {
        const webpMarker = buffer.slice(8, 12)
        if (
          webpMarker[0] !== 0x57 || // W
          webpMarker[1] !== 0x45 || // E
          webpMarker[2] !== 0x42 || // B
          webpMarker[3] !== 0x50    // P
        ) continue
      }
      return magic.mime
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`upload-destaque:${ip}`)
  if (!success) return jsonError('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const formData     = await request.formData()
    const fileEntry    = formData.get('file')
    const cartaIdEntry = formData.get('carta_id')

    if (!(fileEntry instanceof File)) {
      return jsonError('Arquivo é obrigatório', 400)
    }

    const cartaId = typeof cartaIdEntry === 'string' ? cartaIdEntry.trim() : ''
    if (!UUID_REGEX.test(cartaId)) {
      return jsonError('carta_id inválido', 400)
    }

    if (fileEntry.size <= 0) {
      return jsonError('Arquivo vazio', 400)
    }

    if (fileEntry.size > MAX_FILE_SIZE) {
      return jsonError('Máximo 5MB', 400)
    }

    // Lê o buffer antes de qualquer validação de tipo
    const bytes  = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Valida o conteúdo real do arquivo — não confia no Content-Type do cliente
    const detectedMime = detectMimeFromBuffer(buffer)
    if (!detectedMime) {
      return jsonError('Use JPG, PNG ou WEBP', 400)
    }

    // Se o cliente declarou um MIME diferente do real, rejeita
    const declaredMime = fileEntry.type
    if (declaredMime && declaredMime !== detectedMime) {
      return jsonError('Tipo de arquivo não corresponde ao conteúdo enviado.', 400)
    }

    const ext = MIME_TO_EXT[detectedMime]

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

    const path = `destaque/${cartaId}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, buffer, {
        contentType: detectedMime, // usa o MIME detectado, não o declarado
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
        url:  urlData.publicUrl,
        path,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[upload-destaque] erro interno', error)
    return jsonError('Erro interno', 500)
  }
}