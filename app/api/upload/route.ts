import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const runtime = 'nodejs'

const MAX_FOTOS     = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
  'image/gif':  'gif',
}

// Magic bytes de cada formato — validação real do conteúdo do arquivo
// independente do Content-Type declarado pelo cliente
const MAGIC_BYTES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },
  // WebP: "RIFF" nos bytes 0-3 e "WEBP" nos bytes 8-11
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
]

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(15, '60 s'),
  prefix: 'rl:upload',
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

function parseOrdem(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string') return 0
  const n = Number(value)
  if (!Number.isInteger(n)) return 0
  if (n < 0) return 0
  if (n > MAX_FOTOS - 1) return MAX_FOTOS - 1
  return n
}

// Detecta o MIME type real lendo os magic bytes do buffer
// Retorna null se o arquivo não corresponder a nenhum formato permitido
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
  const { success } = await ratelimit.limit(`upload:${ip}`)
  if (!success) return jsonError('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const formData    = await request.formData()
    const fileEntry   = formData.get('file')
    const cartaIdEntry = formData.get('carta_id')
    const ordemEntry  = formData.get('ordem')

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
      return jsonError('Arquivo muito grande. Máximo 5MB.', 400)
    }

    // Lê o buffer primeiro para validar magic bytes
    const bytes  = await fileEntry.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Valida o conteúdo real do arquivo — não confia no Content-Type do cliente
    const detectedMime = detectMimeFromBuffer(buffer)
    if (!detectedMime) {
      return jsonError('Tipo de arquivo não permitido. Use JPG, PNG, WEBP ou GIF.', 400)
    }

    // Se o cliente declarou um MIME diferente do real, rejeita
    const declaredMime = fileEntry.type
    if (declaredMime && declaredMime !== detectedMime) {
      return jsonError('Tipo de arquivo não corresponde ao conteúdo enviado.', 400)
    }

    const ext = MIME_TO_EXT[detectedMime]

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

    const ordem       = parseOrdem(ordemEntry)
    const nomeArquivo = `${cartaId}/${Date.now()}-${randomUUID()}.${ext}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos-temp')
      .upload(nomeArquivo, buffer, {
        contentType: detectedMime, // usa o MIME detectado, não o declarado
        upsert: false,
      })

    if (uploadError) {
      console.error('[upload] erro no storage')
      return jsonError('Erro ao fazer upload da imagem', 500)
    }

    const { data: foto, error: dbError } = await supabaseAdmin
      .from('fotos')
      .insert({
        carta_id:     cartaId,
        storage_path: nomeArquivo,
        is_temp:      true,
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
        url:     urlData.publicUrl,
        path:    nomeArquivo,
        ordem:   foto.ordem,
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('[upload] erro interno', error)
    return jsonError('Erro interno do servidor', 500)
  }
}