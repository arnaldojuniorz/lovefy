import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SLUG_REGEX = /^[a-z0-9-]{3,60}$/
const TOKEN_REGEX = /^[a-z0-9_-]{1,40}$/i

const ratelimitWrite = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:cartas:write',
})

const ratelimitRead = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:cartas:read',
})

const CAMPOS_FRONTEND = new Set<string>([
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

const CAMPOS_BLOQUEADOS = new Set<string>([
  'status',
  'plano',
  'paid_at',
  'mercadopago_payment_id',
  'mercadopago_preference_id',
  'payment_id',
  'payment_status',
  'valor_pago',
  'qr_code_url',
])

// Campos seguros para expor no GET — nunca expor dados financeiros ou de pagamento
const CAMPOS_GET_PUBLICOS = [
  'id',
  'slug',
  'status',
  'nome_destinatario',
  'nome_remetente',
] as const

type Body = Record<string, unknown>

class ValidationError extends Error {}

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

function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function parseBody(request: NextRequest): Promise<Body> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new ValidationError('JSON inválido')
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('Payload inválido')
  }

  return body as Body
}

function stripBlockedFields(body: Body): Body {
  const out: Body = {}
  for (const [key, value] of Object.entries(body)) {
    if (CAMPOS_BLOQUEADOS.has(key)) continue
    out[key] = value
  }
  return out
}

function sanitizeName(value: unknown, label: string): string {
  if (typeof value !== 'string') throw new ValidationError(`${label} é obrigatório`)
  const clean = value.trim().replace(/\s+/g, ' ')
  if (!clean) throw new ValidationError(`${label} é obrigatório`)
  return clean.slice(0, 100)
}

function sanitizeOptionalString(value: unknown, max: number): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('Campo de texto inválido')
  const clean = value.trim()
  if (!clean) return null
  return clean.slice(0, max)
}

function sanitizeMessage(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('mensagem_principal inválida')
  const clean = value.replace(/\u0000/g, '').trim()
  if (!clean) return null
  return clean.slice(0, 2000)
}

function sanitizeEmail(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('email_pagador inválido')
  const clean = value.trim().toLowerCase()
  if (!clean) return null
  if (clean.length > 200) throw new ValidationError('email_pagador muito longo')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) throw new ValidationError('email_pagador inválido')
  return clean
}

function sanitizeDate(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('data_importante inválida')
  const clean = value.trim()
  if (!clean) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    throw new ValidationError('data_importante deve estar no formato YYYY-MM-DD')
  }
  return clean
}

function sanitizeUrl(value: unknown, spotifyOnly = false): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('URL inválida')
  const clean = value.trim()
  if (!clean) return null
  if (clean.length > 700) throw new ValidationError('URL muito longa')

  let url: URL
  try {
    url = new URL(clean)
  } catch {
    throw new ValidationError('URL inválida')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ValidationError('URL deve usar http ou https')
  }

  if (spotifyOnly) {
    const host = url.hostname.toLowerCase()
    if (!host.endsWith('spotify.com')) {
      throw new ValidationError('musica_link deve ser do Spotify')
    }
  }

  url.hash = ''
  return url.toString()
}

function sanitizeSlug(value: unknown): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError('slug inválido')
  const slug = value.trim().toLowerCase()
  if (!slug) return null
  if (!SLUG_REGEX.test(slug)) {
    throw new ValidationError('O link só pode ter letras, números e hífens (3 a 60 caracteres)')
  }
  return slug
}

function sanitizeToken(value: unknown, field: string): string | null {
  if (value === null) return null
  if (typeof value !== 'string') throw new ValidationError(`${field} inválido`)
  const clean = value.trim().toLowerCase()
  if (!clean) return null
  if (!TOKEN_REGEX.test(clean)) throw new ValidationError(`${field} inválido`)
  return clean
}

function sanitizeResources(value: unknown): string[] {
  if (value === null) return []
  if (!Array.isArray(value)) throw new ValidationError('recursos deve ser um array')
  const out = new Set<string>()
  for (const item of value) {
    if (typeof item !== 'string') continue
    const clean = item.trim().toLowerCase()
    if (!clean) continue
    if (!TOKEN_REGEX.test(clean)) continue
    out.add(clean)
    if (out.size >= 10) break
  }
  return Array.from(out)
}

function sanitizeField(key: string, value: unknown): unknown {
  switch (key) {
    case 'nome_destinatario':
      return sanitizeName(value, 'Nome do destinatário')
    case 'nome_remetente':
      return sanitizeName(value, 'Nome do remetente')
    case 'nome_pagador':
      return sanitizeOptionalString(value, 100)
    case 'jogo_palavra1':
    case 'jogo_palavra2':
    case 'jogo_palavra3':
      return sanitizeOptionalString(value, 60)
    case 'mensagem_principal':
      return sanitizeMessage(value)
    case 'email_pagador':
      return sanitizeEmail(value)
    case 'data_importante':
      return sanitizeDate(value)
    case 'musica_link':
      return sanitizeUrl(value, true)
    case 'foto_destaque':
      return sanitizeUrl(value, false)
    case 'slug':
      return sanitizeSlug(value)
    case 'estilo_fundo':
      return sanitizeToken(value, 'estilo_fundo')
    case 'estilo_animacao':
      return sanitizeToken(value, 'estilo_animacao')
    case 'recursos':
      return sanitizeResources(value)
    default:
      return value
  }
}

function sanitizeAllowedFields(input: Body): Body {
  const out: Body = {}
  for (const key of CAMPOS_FRONTEND) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue
    out[key] = sanitizeField(key, input[key])
  }
  return out
}

async function slugInUse(slug: string, cartaId?: string): Promise<boolean> {
  let query = supabaseAdmin.from('cartas').select('id').eq('slug', slug).limit(1)
  if (cartaId) query = query.neq('id', cartaId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return Boolean(data)
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimitWrite.limit(`cartas:post:${ip}`)
  if (!success) return errorJson('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const body = await parseBody(request)
    const campos = sanitizeAllowedFields(stripBlockedFields(body))

    if (typeof campos.nome_destinatario !== 'string' || typeof campos.nome_remetente !== 'string') {
      return errorJson('Nome do destinatário e remetente são obrigatórios', 400)
    }

    if (typeof campos.slug === 'string') {
      const exists = await slugInUse(campos.slug)
      if (exists) return errorJson('Esse link já está em uso. Escolha outro!', 409)
    }

    const payload: Body = {
      nome_destinatario: campos.nome_destinatario,
      nome_remetente: campos.nome_remetente,
      status: 'rascunho',
      estilo_fundo: 'stars',
      estilo_animacao: 'float',
      recursos: [],
    }

    for (const [key, value] of Object.entries(campos)) {
      if (key === 'nome_destinatario' || key === 'nome_remetente') continue
      payload[key] = value
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .insert(payload)
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') return errorJson('Esse link já está em uso. Escolha outro!', 409)
      console.error('[cartas POST] erro ao inserir')
      return errorJson('Erro ao salvar carta', 500)
    }

    return NextResponse.json({ carta_id: carta.id }, { status: 201 })
  } catch (error) {
    if (error instanceof ValidationError) return errorJson(error.message, 400)
    console.error('[cartas POST] erro interno')
    return errorJson('Erro interno do servidor', 500)
  }
}

export async function PATCH(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimitWrite.limit(`cartas:patch:${ip}`)
  if (!success) return errorJson('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const body = await parseBody(request)
    const { carta_id, ...rest } = body

    if (typeof carta_id !== 'string' || !UUID_REGEX.test(carta_id.trim())) {
      return errorJson('carta_id inválido', 400)
    }

    const campos = sanitizeAllowedFields(stripBlockedFields(rest as Body))
    if (Object.keys(campos).length === 0) {
      return errorJson('Nenhum campo válido para atualizar', 400)
    }

    if (typeof campos.slug === 'string') {
      const exists = await slugInUse(campos.slug, carta_id.trim())
      if (exists) return errorJson('Esse link já está em uso. Escolha outro!', 409)
    }

    const { data: carta, error } = await supabaseAdmin
      .from('cartas')
      .update(campos)
      .eq('id', carta_id.trim())
      .in('status', ['rascunho', 'pendente_pagamento'])
      .select('id')
      .maybeSingle()

    if (error) {
      if (error.code === '23505') return errorJson('Esse link já está em uso. Escolha outro!', 409)
      console.error('[cartas PATCH] erro ao atualizar')
      return errorJson('Erro ao atualizar carta', 500)
    }

    if (!carta) {
      return errorJson('Carta não encontrada ou bloqueada para edição', 404)
    }

    return NextResponse.json({ carta_id: carta.id })
  } catch (error) {
    if (error instanceof ValidationError) return errorJson(error.message, 400)
    console.error('[cartas PATCH] erro interno')
    return errorJson('Erro interno do servidor', 500)
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimitRead.limit(`cartas:get:${ip}`)
  if (!success) return errorJson('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    const slug = url.searchParams.get('slug')

    if (!id && !slug) {
      return NextResponse.json({ disponivel: false })
    }

    if (id) {
      const cleanId = id.trim()
      if (!UUID_REGEX.test(cleanId)) {
        return errorJson('id inválido', 400)
      }

      const { data, error } = await supabaseAdmin
        .from('cartas')
        .select(CAMPOS_GET_PUBLICOS.join(', '))
        .eq('id', cleanId)
        .maybeSingle()

      if (error) {
        console.error('[cartas GET:id] erro ao buscar')
        return errorJson('Erro ao consultar carta', 500)
      }

      return NextResponse.json(data ?? {})
    }

    const cleanSlug = sanitizeSlug(slug)
    if (!cleanSlug) {
      return NextResponse.json({ disponivel: false })
    }

    const { data, error } = await supabaseAdmin
      .from('cartas')
      .select('id')
      .eq('slug', cleanSlug)
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[cartas GET:slug] erro ao consultar')
      return errorJson('Erro ao consultar disponibilidade', 500)
    }

    return NextResponse.json({ disponivel: !data })
  } catch (error) {
    if (error instanceof ValidationError) return errorJson(error.message, 400)
    return errorJson('Erro interno', 500)
  }
}