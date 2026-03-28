import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { data: jobs } = await supabaseAdmin
      .from('jobs')
      .select('*')
      .eq('tipo', 'deletar_carta_24h')
      .eq('status', 'pendente')
      .lte('executar_em', new Date().toISOString())
      .limit(50)

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({ ok: true, deletadas: 0 })
    }

    let deletadas = 0

    for (const job of jobs) {
      await supabaseAdmin
        .from('cartas')
        .update({ status: 'expirada' })
        .eq('id', job.carta_id)
        .eq('status', 'ativo')

      await supabaseAdmin
        .from('jobs')
        .update({ status: 'concluido', executado_em: new Date().toISOString() })
        .eq('id', job.id)

      deletadas++
    }

    return NextResponse.json({ ok: true, deletadas })

  } catch (error: any) {
    console.error('[cron/deletar-24h] erro:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}