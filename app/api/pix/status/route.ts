import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const payment_id = searchParams.get('payment_id')

    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id é obrigatório' }, { status: 400 })
    }

    const payment = new Payment(client)
    const response = await payment.get({ id: payment_id })

    return NextResponse.json({ status: response.status })

  } catch (error: any) {
    console.error('Erro status Pix:', error)
    return NextResponse.json({ error: 'Erro ao verificar status' }, { status: 500 })
  }
}