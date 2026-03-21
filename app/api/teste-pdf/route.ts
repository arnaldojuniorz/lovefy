import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { gerarPDF } from '@/lib/gerar-pdf'

export async function GET() {
  const { data: carta } = await supabaseAdmin.from('cartas_impressao').select('*').eq('id', 'd11893b3-d015-480d-bf59-7a8b52fab0c8').single()
  if (!carta) return NextResponse.json({ error: 'not found' })
  const pdf_url = await gerarPDF(carta.id, carta)
  return NextResponse.json({ ok: true, pdf_url })
}
