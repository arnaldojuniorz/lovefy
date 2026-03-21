import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { gerarQRCode } from '@/lib/gerar-qrcode'
import { enviarEmail } from '@/lib/enviar-email'

export async function POST(request: Request) {
  const { carta_id } = await request.json()
  const { data: carta } = await supabaseAdmin.from('cartas').select('*').eq('id', carta_id).single()
  if (!carta) return NextResponse.json({ error: 'not found' }, { status: 404 })
  await supabaseAdmin.from('cartas').update({ status: 'ativo', paid_at: new Date().toISOString() }).eq('id', carta_id)
  const qr_code_url = await gerarQRCode(carta_id, carta.slug)
  await enviarEmail({ nome_pagador: carta.nome_pagador, email_pagador: carta.email_pagador, nome_destinatario: carta.nome_destinatario, nome_remetente: carta.nome_remetente, slug: carta.slug, qr_code_url })
  return NextResponse.json({ ok: true })
}