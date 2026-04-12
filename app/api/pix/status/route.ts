import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payment_id = searchParams.get('payment_id')
    const carta_id   = searchParams.get('carta_id')
    const tipo       = searchParams.get('tipo') || 'digital'

    if (!payment_id || !carta_id) {
      return NextResponse.json(
        { error: 'payment_id e carta_id são obrigatórios' },
        { status: 400 }
      )
    }

    const tabela = tipo === 'impressao' ? 'cartas_impressao' : 'cartas'

    const { data: carta, error } = await supabaseAdmin
      .from(tabela)
      .select('status, slug, pdf_url')
      .eq('id', carta_id)
      .single()

    // ✅ log temporário para debug
    console.log('[pix/status] carta_id:', carta_id)
    console.log('[pix/status] carta:', JSON.stringify(carta))
    console.log('[pix/status] error:', JSON.stringify(error))

    if (carta?.status === 'ativo') {
      return NextResponse.json({
        status: 'approved',
        carta_status: 'ativo',
        slug: carta.slug ?? null,
        pdf_url: carta.pdf_url ?? null,
      })
    }

    const payment = new Payment(client)
    const response = await payment.get({ id: payment_id })

    return NextResponse.json({
      status: response.status,
      carta_status: carta?.status ?? 'pendente',
      slug: null,
      pdf_url: null,
    })

  } catch (error: any) {
    console.error('[pix/status] erro:', error)
    return NextResponse.json(
      { error: 'Erro ao verificar status', detalhe: error?.message },
      { status: 500 }
    )
  }
}