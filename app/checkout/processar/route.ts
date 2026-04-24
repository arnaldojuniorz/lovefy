import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { carta_id, plano, tipo, ...rest } = body

    if (!carta_id || !plano) {
      return NextResponse.json(
        { error: 'carta_id e plano são obrigatórios' },
        { status: 400 }
      )
    }

    // O SDK-React do MP envia os dados do cartão dentro de `formData`
    const dadosPagamento = rest.formData ?? rest

    const payment = new Payment(client)

    const response = await payment.create({
      body: {
        ...dadosPagamento,
        // ✅ usa plano (forever/impressao) — consistente com webhook
        external_reference: `${carta_id}|${plano}`,
        // ✅ www — evita 307 redirect que MP não segue
        notification_url: 'https://www.lovefy.app.br/api/webhook',
        statement_descriptor: 'LOVEFY',
      },
    })

    return NextResponse.json({
      status:     response.status,
      payment_id: response.id,
    })

  } catch (error: any) {
    console.error('[processar] erro cartao')
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    )
  }
}