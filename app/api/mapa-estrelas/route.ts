import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const UUID_REGEX  = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const DATE_REGEX  = /^\d{4}-\d{2}-\d{2}$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  prefix: 'rl:mapa-estrelas',
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

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

function sanitizeDate(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Data inválida')
  const clean = value.trim()
  if (!DATE_REGEX.test(clean)) throw new Error('Data deve estar no formato YYYY-MM-DD')

  const d = new Date(clean)
  if (isNaN(d.getTime())) throw new Error('Data inválida')

  // Não permite datas muito no futuro ou muito no passado
  const now = Date.now()
  const ms  = d.getTime()
  if (ms > now + 365 * 24 * 60 * 60 * 1000 * 200) throw new Error('Data inválida')
  if (ms < new Date('1900-01-01').getTime())        throw new Error('Data inválida')

  return clean
}

function sanitizeCoordinate(value: unknown, label: string, min: number, max: number, fallback: number): number {
  if (value === null || value === undefined) return fallback
  const n = Number(value)
  if (!Number.isFinite(n)) throw new Error(`${label} inválido`)
  if (n < min || n > max)  throw new Error(`${label} fora do intervalo permitido`)
  return n
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`mapa-estrelas:${ip}`)
  if (!success) return jsonError('Muitas tentativas. Tente novamente em instantes.', 429)

  try {
    let parsedBody: unknown
    try {
      parsedBody = await request.json()
    } catch {
      return jsonError('JSON inválido', 400)
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return jsonError('Payload inválido', 400)
    }

    const body = parsedBody as Record<string, unknown>

    let dataFormatada: string
    try {
      dataFormatada = sanitizeDate(body.data)
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'Data inválida', 400)
    }

    let lat: number
    let lon: number
    try {
      lat = sanitizeCoordinate(body.latitude,  'Latitude',  -90,  90,  -23.5505)
      lon = sanitizeCoordinate(body.longitude, 'Longitude', -180, 180, -46.6333)
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : 'Coordenadas inválidas', 400)
    }

    const carta_id = body.carta_id ?? null
    if (carta_id !== null) {
      if (typeof carta_id !== 'string' || !UUID_REGEX.test(carta_id.trim())) {
        return jsonError('carta_id inválido', 400)
      }
    }

    // Retorna cache do banco se já foi gerado
    if (carta_id) {
      const { data: carta, error: cartaError } = await supabaseAdmin
        .from('cartas')
        .select('mapa_estrelas_url')
        .eq('id', carta_id.trim())
        .maybeSingle()

      if (cartaError) {
        console.error('[mapa-estrelas] erro ao buscar carta:', cartaError)
        return jsonError('Erro ao verificar carta', 500)
      }

      if (carta?.mapa_estrelas_url) {
        return NextResponse.json({ imageUrl: carta.mapa_estrelas_url })
      }
    }

    const appId     = process.env.ASTRONOMY_API_ID
    const appSecret = process.env.ASTRONOMY_API_SECRET

    if (!appId || !appSecret) {
      console.error('[mapa-estrelas] credenciais da Astronomy API ausentes')
      return jsonError('Serviço temporariamente indisponível', 500)
    }

    const credentials = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const astronomyBody = {
      style: 'navy',
      observer: {
        latitude:  lat,
        longitude: lon,
        date:      dataFormatada,
      },
      view: {
        type: 'area',
        parameters: {
          position: {
            equatorial: {
              rightAscension: 0,
              declination:    0,
            },
          },
          zoom: 2,
        },
      },
    }

    const response = await fetch('https://api.astronomyapi.com/api/v2/studio/star-chart', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(astronomyBody),
    })

    if (!response.ok) {
      const errText = await response.text().catch(() => '')
      console.error('[mapa-estrelas] erro API:', response.status, errText)
      return jsonError('Erro ao gerar mapa estelar', 500)
    }

    const result   = await response.json()
    const imageUrl = result?.data?.imageUrl

    if (typeof imageUrl !== 'string' || !imageUrl.startsWith('https://')) {
      console.error('[mapa-estrelas] imageUrl ausente ou inválida:', imageUrl)
      return jsonError('Imagem não gerada', 500)
    }

    if (carta_id) {
      const { error: updateError } = await supabaseAdmin
        .from('cartas')
        .update({ mapa_estrelas_url: imageUrl })
        .eq('id', carta_id.trim())
        .in('status', ['rascunho', 'pendente_pagamento', 'ativo'])

      if (updateError) {
        console.error('[mapa-estrelas] erro ao salvar url no banco:', updateError)
        // Não falha o request — imagem foi gerada com sucesso
      }
    }

    return NextResponse.json({ imageUrl })

  } catch (error) {
    console.error('[mapa-estrelas] erro interno:', error)
    return jsonError('Erro interno', 500)
  }
}