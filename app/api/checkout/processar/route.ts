import { NextRequest, NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

export const runtime = 'nodejs'

const MERCADOPAGO_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? ''

const PLANOS = {
  forever:   { preco:  9.90, titulo: 'Lovefy - Carta Digital Para Sempre' },
  impressao: { preco:  6.90, titulo: 'Lovefy - Carta para Impressao' },
} as const

type Plano = keyof typeof PLANOS

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lovefy.app.br'
  const clean = String(raw).replace(/[\r\n\t ]+/g, '').trim()
  try {
    return new URL(clean).origin
  } catch {
    return 'https://www.lovefy.app.br'
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  try {
    if (!MERCADOPAGO_ACCESS_TOKEN) {
      return jsonError('Serviço temporariamente indisponível', 500)
    }

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
    const { carta_id, plano: planoRaw, formData } = body

    // Valida carta_id
    if (typeof carta_id !== 'string' || !UUID_REGEX.test(carta_id.trim())) {
      return jsonError('carta_id inválido', 400)
    }

    // Valida plano
    const planoKey = typeof planoRaw === 'string' ? planoRaw.trim().toLowerCase() : ''
    if (planoKey !== 'forever' && planoKey !== 'impressao') {
      return jsonError('plano inválido', 400)
    }
    const plano = planoKey as Plano
    const planoData = PLANOS[plano]

    // Valida formData
    if (!formData || typeof formData !== 'object' || Array.isArray(formData)) {
      return jsonError('Dados do cartão ausentes', 400)
    }

    const card = formData as Record<string, unknown>

    // Extrai apenas campos necessários do cartão
    const token = typeof card.token === 'string' ? card.token.trim() : ''
    const paymentMethodId = typeof card.payment_method_id === 'string' ? card.payment_method_id.trim() : ''
    const issuerId = card.issuer_id !== undefined ? Number(card.issuer_id) : undefined

    if (!token || !paymentMethodId) {
      return jsonError('Token ou método de pagamento ausente', 400)
    }

    // Dados do pagador
    const payer = card.payer && typeof card.payer === 'object' && !Array.isArray(card.payer)
      ? card.payer as Record<string, unknown>
      : {}

    const payerEmail     = typeof payer.email      === 'string' ? payer.email.trim().toLowerCase()  : ''
    const payerFirstName = typeof payer.first_name === 'string' ? payer.first_name.trim().slice(0, 80) : ''
    const payerLastName  = typeof payer.last_name  === 'string' ? payer.last_name.trim().slice(0, 80)  : ''

    if (!payerEmail) {
      return jsonError('E-mail do pagador ausente', 400)
    }

    const client   = new MercadoPagoConfig({ accessToken: MERCADOPAGO_ACCESS_TOKEN })
    const payment  = new Payment(client)
    const baseUrl  = getBaseUrl()

    const response = await payment.create({
      body: {
        transaction_amount: planoData.preco,
        description:        planoData.titulo,
        token,
        installments:       1,
        payment_method_id:  paymentMethodId,
        ...(issuerId && !isNaN(issuerId) ? { issuer_id: issuerId } : {}),
        payer: {
          email:      payerEmail,
          first_name: payerFirstName || 'Cliente',
          last_name:  payerLastName  || '',
        },
        external_reference:   `${carta_id.trim()}|${plano}`,
        notification_url:     `${baseUrl}/api/webhook`,
        statement_descriptor: 'LOVEFY',
      },
    })

    return NextResponse.json({
      status:     response.status,
      payment_id: response.id,
    })

  } catch {
    return jsonError('Erro ao processar pagamento', 500)
  }
}