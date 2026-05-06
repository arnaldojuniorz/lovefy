'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

let mpInitialized = false
function ensureMP() {
  if (mpInitialized) return
  initMercadoPago(process.env.NEXT_PUBLIC_MP_PUBLIC_KEY!, { locale: 'pt-BR' })
  mpInitialized = true
}

const PRECOS: Record<string, number> = {
  forever:   9.90,
  impressao: 6.90,
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const carta_id = searchParams.get('carta_id') ?? ''
  const tipo     = searchParams.get('tipo')     ?? 'digital'
  const plano    = searchParams.get('plano')    ?? 'forever'
  const nome     = searchParams.get('nome')     ?? ''
  const email    = searchParams.get('email')    ?? ''

  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [loading, setLoading]           = useState(true)
  const [processando, setProcessando]   = useState(false)
  const [erro, setErro]                 = useState('')
  const valor = PRECOS[plano] ?? 9.90

  useEffect(() => { ensureMP() }, [])

  useEffect(() => {
    if (!carta_id) {
      setErro('Carta não identificada. Volte e tente novamente.')
      setLoading(false)
      return
    }

    fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carta_id, plano, tipo }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.preference_id) {
          setPreferenceId(data.preference_id)
        } else {
          setErro(data.error || 'Erro ao carregar checkout')
        }
      })
      .catch(() => setErro('Erro de conexão. Tente novamente.'))
      .finally(() => setLoading(false))
  }, [carta_id, plano, tipo])

  async function handleSubmit(brickData: any) {
    const isPix =
      brickData?.selectedPaymentMethod === 'bank_transfer' ||
      brickData?.formData?.payment_method_id === 'pix'

    // ─── PIX ─────────────────────────────────────────────
    if (isPix) {
      try {
        const res = await fetch('/api/pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carta_id,
            plano,
            tipo,
            email_pagador: email,
            nome_pagador:  nome,
          }),
        })
        const result = await res.json()
        if (!res.ok) { alert(result.error || 'Erro ao gerar PIX'); return }
        window.location.href = `/aguardando-pix?payment_id=${result.payment_id}&carta_id=${carta_id}&tipo=${tipo}&plano=${plano}&qr=${encodeURIComponent(result.qr_code)}&qr64=${encodeURIComponent(result.qr_code_base64 ?? '')}`
      } catch {
        alert('Erro ao gerar PIX. Tente novamente.')
      }
      return
    }

    // ─── Cartão ───────────────────────────────────────────
    setProcessando(true)
    try {
      const res = await fetch('/api/checkout/processar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carta_id,
          plano,
          tipo,
          formData: brickData.formData,
        }),
      })

      const result = await res.json()

      if (result.status === 'approved') {
        // ✅ Carta já ativada no servidor — slug disponível imediatamente
        const slugParam = result.slug ? `&slug=${encodeURIComponent(result.slug)}` : ''
        window.location.href = `/obrigado?carta_id=${carta_id}&tipo=${tipo}&plano=${plano}${slugParam}`
      } else if (result.status === 'in_process' || result.status === 'pending') {
        window.location.href = `/obrigado?carta_id=${carta_id}&tipo=${tipo}&plano=${plano}&pending=true`
      } else {
        alert('Pagamento não aprovado. Verifique os dados do cartão e tente novamente.')
      }
    } catch {
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setProcessando(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="/" style={{ color: '#ff6b9d', textDecoration: 'none', fontSize: '14px', display: 'block', marginBottom: '16px' }}>← Voltar</a>
          <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px' }}>Finalizar pagamento</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', margin: '0' }}>Pagamento 100% seguro pelo Mercado Pago</p>
        </div>

        <div style={{ background: '#16213e', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: '0 0 4px' }}>Valor a pagar</p>
          <p style={{ background: 'linear-gradient(135deg, #ff6b9d, #c44569)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '40px', fontWeight: '900', margin: '0' }}>
            R$ {valor.toFixed(2).replace('.', ',')}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', margin: '8px 0 0' }}>à vista · sem parcelamento</p>
        </div>

        <div style={{ background: '#16213e', borderRadius: '24px', padding: '24px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '16px', position: 'relative' }}>
          {processando && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', background: 'rgba(22,33,62,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <p style={{ color: '#fff', fontSize: '16px' }}>Processando pagamento...</p>
            </div>
          )}

          {loading && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)' }}>Carregando checkout...</p>
            </div>
          )}

          {erro && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#ff6b9d' }}>{erro}</p>
              <a href="/criar" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginTop: '12px', display: 'block' }}>← Voltar ao início</a>
            </div>
          )}

          {preferenceId && !loading && !erro && (
            <Payment
              initialization={{ amount: valor, preferenceId }}
              customization={{
                paymentMethods: {
                  creditCard:      'all' as const,
                  bankTransfer:    'all' as const,
                  mercadoPago:     [] as const,
                  debitCard:       [] as const,
                  ticket:          [] as const,
                  maxInstallments: 1,
                },
                visual: {
                  style:             { theme: 'dark' },
                  hideFormTitle:     true,
                  hidePaymentButton: false,
                },
              }}
              onSubmit={handleSubmit}
              onReady={() => setLoading(false)}
              onError={() => setErro('Erro ao carregar formulário. Recarregue a página.')}
            />
          )}
        </div>

        <div style={{ background: '#16213e', borderRadius: '16px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', margin: '0', textAlign: 'center' }}>
            🔒 Seus dados estão protegidos pelo Mercado Pago
          </p>
        </div>

      </div>
    </main>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  )
}