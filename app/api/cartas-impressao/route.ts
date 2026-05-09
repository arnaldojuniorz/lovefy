import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_REGEX  = /^\d{4}-\d{2}-\d{2}$/

const ratelimitWrite = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:cartas-impressao:write',
})

const ratelimitRead = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(30, '60 s'),
  prefix: 'rl:cartas-impressao:read',
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

function errorJson(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function sanitizeString(value: unknown, label: string, max: number, required: boolean): string | null {
  if (value === null || value === undefined || value === '') {
    if (required) throw new Error(`${label} é obrigatório`)
    return null
  }
  if (typeof value !== 'string') throw new Error(`${label} inválido`)
  const clean = value.replace(/\u0000/g, '').trim().replace(/\s+/g, ' ')
  if (!clean) {
    if (required) throw new Error(`${label} é obrigatório`)
    return null
  }
  return clean.slice(0, max)
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('email_pagador inválido')
  const clean = value.trim().toLowerCase()
  if (!clean) throw new Error('email_pagador é obrigatório')
  if (clean.length > 200) throw new Error('email_pagador muito longo')
  if (!EMAIL_REGEX.test(clean)) throw new Error('email_pagador inválido')
  return clean
}

function sanitizeDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error('data_importante inválida')
  const clean = value.trim()
  if (!clean) return null
  if (!DATE_REGEX.test(clean)) throw new Error('data_importante deve estar no formato YYYY-MM-DD')
  return clean
}

function sanitizeMusicaLink(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value !== 'string') throw new Error('musica_link inválido')
  const clean = value.trim()
  if (!clean) return null
  if (clean.length > 700) throw new Error('musica_link muito longo')

  let url: URL
  try {
    url = new URL(clean)
  } catch {
    throw new Error('musica_link inválido')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('musica_link deve usar http ou https')
  }

  if (!url.hostname.toLowerCase().endsWith('spotify.com')) {
    throw new Error('musica_link deve ser do Spotify')
  }

  url.hash = ''
  return url.toString()
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimitWrite.limit(`cartas-impressao:post:${ip}`)
  if (!success) return errorJson('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    let parsedBody: unknown
    try {
      parsedBody = await request.json()
    } catch {
      return errorJson('JSON inválido', 400)
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return errorJson('Payload inválido', 400)
    }

    const body = parsedBody as Record<string, unknown>

    const destinatario  = sanitizeString(body.destinatario,  'Destinatário', 100, true)!
    const remetente     = sanitizeString(body.remetente,     'Remetente',    100, true)!
    const mensagem      = sanitizeString(body.mensagem,      'Mensagem',    2000, true)!
    const nome_pagador  = sanitizeString(body.nome_pagador,  'Nome do pagador', 100, true)!
    const email_pagador = sanitizeEmail(body.email_pagador)
    const data_importante = sanitizeDate(body.data_importante)
    const musica_link     = sanitizeMusicaLink(body.musica_link)

    const { data: carta, error } = await supabaseAdmin
      .from('cartas_impressao')
      .insert({
        destinatario,
        remetente,
        mensagem,
        data_importante,
        cor:          '#ffffff',
        estilo:       'moderno',
        musica_link,
        nome_pagador,
        email_pagador,
        status:       'pendente',
      })
      .select('id')
      .single()

    if (error) {
      console.error('[cartas-impressao POST] erro ao inserir')
      return errorJson('Erro ao salvar carta', 500)
    }

    return NextResponse.json({ carta_id: carta.id }, { status: 201 })

  } catch (error) {
    if (error instanceof Error) return errorJson(error.message, 400)
    console.error('[cartas-impressao POST] erro interno')
    return errorJson('Erro interno do servidor', 500)
  }
}

export async function GET(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimitRead.limit(`cartas-impressao:get:${ip}`)
  if (!success) return errorJson('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    const id = new URL(request.url).searchParams.get('id')

    if (!id) return errorJson('id obrigatório', 400)

    const cleanId = id.trim()
    if (!UUID_REGEX.test(cleanId)) return errorJson('id inválido', 400)

    const { data, error } = await supabaseAdmin
      .from('cartas_impressao')
      .select('id, status, pdf_url, destinatario')
      .eq('id', cleanId)
      .maybeSingle()

    if (error) {
      console.error('[cartas-impressao GET] erro ao buscar')
      return errorJson('Erro ao consultar carta', 500)
    }

    return NextResponse.json(data ?? {})

  } catch {
    return errorJson('Erro interno do servidor', 500)
  }
}