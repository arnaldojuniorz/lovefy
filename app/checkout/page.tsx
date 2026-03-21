'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { initMercadoPago, Payment } from '@mercadopago/sdk-react'

initMercadoPago('APP_USR-9e30a715-7d9c-44b2-8530-fa387dba217c', { locale: 'pt-BR' })

const PRECOS: Record<string, number> = {
  '24h': 0.01,
  'forever': 0.01,
  'impressao': 0.01,
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const carta_id = searchParams.get('carta_id')
  const tipo = searchParams.get('tipo') || 'digital'
  const plano = searchParams.get('plano') || 'forever'

  const [preferenceId, setPreferenceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')

  const amount = PRECOS[plano] || 0.01

  useEffect(() => {
    if (!carta_id) return

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
      .catch(() => setErro('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [carta_id, plano, tipo])

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'600px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <h1 style={{color:'#fff', fontSize:'28px', fontWeight:'bold', marginBottom:'8px'}}>Finalizar pagamento</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px'}}>Pagamento 100% seguro pelo Mercado Pago</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)'}}>
          {loading && (
            <div style={{textAlign:'center', padding:'40px'}}>
              <p style={{color:'rgba(255,255,255,0.5)'}}>Carregando checkout...</p>
            </div>
          )}

          {erro && (
            <div style={{textAlign:'center', padding:'40px'}}>
              <p style={{color:'#ff6b9d'}}>{erro}</p>
              <button
                onClick={() => window.history.back()}
                style={{marginTop:'16px', padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'12px', cursor:'pointer'}}
              >
                Voltar
              </button>
            </div>
          )}

          {preferenceId && (
            <Payment
              initialization={{
                amount,
                preferenceId,
              }}
              customization={{
  paymentMethods: {
    creditCard: 'all' as const,
    debitCard: 'all' as const,
    ticket: 'all' as const,
    bankTransfer: 'all' as const,
    mercadoPago: [] as const,
  },
  visual: {
    style: {
      theme: 'dark',
    },
  },
}}
              onSubmit={async (formData) => {
                console.log('Pagamento enviado:', formData)
              }}
              onReady={() => setLoading(false)}
              onError={(error) => {
                console.error('Erro no pagamento:', error)
              }}
            />
          )}
        </div>

        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'16px'}}>
          Seus dados estão protegidos pelo Mercado Pago
        </p>
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