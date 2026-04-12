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

    const isImpressao = tipo === 'impressao'
    const tabela = isImpressao ? 'cartas_impressao' : 'cartas'

    const { data, error } = await supabaseAdmin
      .from(tabela)
      .select('*')
      .eq('id', carta_id)
      .single()

    console.log('[pix/status] carta:', JSON.stringify(data), 'error:', JSON.stringify(error))

    if (data?.status === 'ativo') {
      return NextResponse.json({
        status: 'approved',
        carta_status: 'ativo',
        slug: data.slug ?? null,
        pdf_url: data.pdf_url ?? null,
      })
    }

    const payment = new Payment(client)
    const response = await payment.get({ id: payment_id })

    return NextResponse.json({
      status: response.status,
      carta_status: data?.status ?? 'pendente',
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