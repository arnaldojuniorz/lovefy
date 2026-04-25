import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

const DEFAULT_TTL_HOURS = 48
const MAX_TTL_HOURS = 720
const BATCH_SIZE = 200

type FotoTemp = {
  id: string
  carta_id: string | null
  storage_path: string | null
  created_at: string
}

type CartaStatus = {
  id: string
  status: string | null
}

function getTtlHours(): number {
  const raw = Number(process.env.ORPHAN_TEMP_PHOTO_TTL_HOURS ?? DEFAULT_TTL_HOURS)
  if (!Number.isFinite(raw)) return DEFAULT_TTL_HOURS
  const n = Math.floor(raw)
  if (n < 1) return DEFAULT_TTL_HOURS
  if (n > MAX_TTL_HOURS) return MAX_TTL_HOURS
  return n
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET ?? ''
  if (!secret) return false

  const authHeader = request.headers.get('authorization')
  if (authHeader === `Bearer ${secret}`) return true

  const secretQuery = new URL(request.url).searchParams.get('secret')
  if (secretQuery && secretQuery === secret) return true

  return false
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

async function runCleanup(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonError('Não autorizado', 401)
  }

  try {
    const ttlHours = getTtlHours()
    const cutoffIso = new Date(Date.now() - ttlHours * 60 * 60 * 1000).toISOString()

    const { data: fotosRaw, error: fotosError } = await supabaseAdmin
      .from('fotos')
      .select('id, carta_id, storage_path, created_at')
      .eq('is_temp', true)
      .lt('created_at', cutoffIso)
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE)

    if (fotosError) {
      console.error('[cron/orfas] erro ao buscar fotos temp:', fotosError)
      return jsonError('Erro ao buscar fotos temporárias', 500)
    }

    const fotos = (fotosRaw ?? []) as FotoTemp[]
    if (fotos.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Nenhuma foto órfã para limpar',
        ttl_hours: ttlHours,
        analisadas: 0,
        removidas_storage: 0,
        removidas_banco: 0,
      })
    }

    const cartaIds = Array.from(
      new Set(
        fotos
          .map((f) => f.carta_id)
          .filter((v): v is string => typeof v === 'string' && v.length > 0)
      )
    )

    let statusPorCarta = new Map<string, string | null>()

    if (cartaIds.length > 0) {
      const { data: cartasRaw, error: cartasError } = await supabaseAdmin
        .from('cartas')
        .select('id, status')
        .in('id', cartaIds)

      if (cartasError) {
        console.error('[cron/orfas] erro ao buscar status das cartas:', cartasError)
        return jsonError('Erro ao validar cartas', 500)
      }

      const cartas = (cartasRaw ?? []) as CartaStatus[]
      statusPorCarta = new Map(cartas.map((c) => [c.id, c.status]))
    }

    const orfas = fotos.filter((foto) => {
      if (!foto.carta_id) return true
      const status = statusPorCarta.get(foto.carta_id)
      // Mantém apenas fotos de cartas realmente ativas
      return status !== 'ativo'
    })

    if (orfas.length === 0) {
      return NextResponse.json({
        ok: true,
        message: 'Nenhuma foto órfã elegível para limpeza',
        ttl_hours: ttlHours,
        analisadas: fotos.length,
        removidas_storage: 0,
        removidas_banco: 0,
      })
    }

    const paths = orfas
      .map((f) => f.storage_path)
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)

    let removidasStorage = 0
    if (paths.length > 0) {
      const { data: removed, error: removeError } = await supabaseAdmin.storage
        .from('fotos-temp')
        .remove(paths)

      if (removeError) {
        console.error('[cron/orfas] erro ao remover do storage:', removeError)
      } else {
        removidasStorage = removed?.length ?? 0
      }
    }

    const ids = orfas.map((f) => f.id)

    let removidasBanco = 0
    if (ids.length > 0) {
      const { data: deletedRows, error: deleteError } = await supabaseAdmin
        .from('fotos')
        .delete()
        .in('id', ids)
        .select('id')

      if (deleteError) {
        console.error('[cron/orfas] erro ao remover do banco:', deleteError)
        return jsonError('Erro ao limpar referências no banco', 500)
      }

      removidasBanco = deletedRows?.length ?? 0
    }

    return NextResponse.json({
      ok: true,
      ttl_hours: ttlHours,
      cutoff: cutoffIso,
      analisadas: fotos.length,
      elegiveis_orfas: orfas.length,
      removidas_storage: removidasStorage,
      removidas_banco: removidasBanco,
    })
  } catch (error) {
    console.error('[cron/orfas] erro interno:', error)
    return jsonError('Erro interno', 500)
  }
}

export async function GET(request: NextRequest) {
  return runCleanup(request)
}

export async function POST(request: NextRequest) {
  return runCleanup(request)
}