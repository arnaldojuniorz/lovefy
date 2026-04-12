'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function AguardandoPixContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const payment_id = searchParams.get('payment_id') ?? ''
  const carta_id   = searchParams.get('carta_id')   ?? ''
  const tipo       = searchParams.get('tipo')        ?? 'digital'
  const plano      = searchParams.get('plano')       ?? 'forever'
  const qr         = searchParams.get('qr')          ?? ''
  const qr64       = searchParams.get('qr64')        ?? ''

  const [copiado, setCopiado]   = useState(false)
  const [status, setStatus]     = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [tentativas, setTentativas] = useState(0)

  useEffect(() => {
    if (!payment_id || !carta_id) return

    const MAX_TENTATIVAS = 75

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pix/status?payment_id=${payment_id}&carta_id=${carta_id}&tipo=${tipo}`
        )
        const data = await res.json()

        if (data.carta_status === 'ativo') {
          clearInterval(interval)
          setStatus('approved')
          if (tipo === 'impressao' && data.pdf_url) {
            router.push(`/obrigado?carta_id=${carta_id}&tipo=impressao&pdf_url=${encodeURIComponent(data.pdf_url)}`)
          } else {
            router.push(`/obrigado?carta_id=${carta_id}&tipo=${tipo}&slug=${data.slug}&plano=${plano}`)
          }
          return
        }

        if (data.status === 'rejected' || data.status === 'cancelled') {
          clearInterval(interval)
          setStatus('rejected')
          return
        }

        setTentativas(t => {
          if (t + 1 >= MAX_TENTATIVAS) {
            clearInterval(interval)
            setStatus('rejected')
          }
          return t + 1
        })

      } catch { }
    }, 4000)

    return () => clearInterval(interval)
  }, [payment_id, carta_id, tipo, plano, router])

  function copiar() {
    navigator.clipboard.writeText(qr).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>

        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Pague com PIX</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>
          Escaneie o QR Code ou copie o código abaixo
        </p>

        {qr64 && (
          <div style={{ marginBottom: '24px' }}>
            <img
              src={`data:image/png;base64,${qr64}`}
              alt="QR Code PIX"
              style={{ width: '220px', height: '220px', borderRadius: '16px', border: '3px solid rgba(255,107,157,0.3)', display: 'block', margin: '0 auto' }}
            />
          </div>
        )}

        <div style={{ background: '#16213e', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px', wordBreak: 'break-all', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', textAlign: 'left' }}>
          {qr}
        </div>

        <button
          onClick={copiar}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff6b9d, #c44569)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginBottom: '24px' }}
        >
          {copiado ? '✅ Copiado!' : '📋 Copiar código PIX'}
        </button>

        {status === 'pending' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px' }}>
              ⏳ Aguardando confirmação do pagamento...
            </p>
            <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((tentativas / 75) * 100, 100)}%`, background: 'linear-gradient(90deg, #ff6b9d, #c44569)', transition: 'width 0.4s ease' }} />
            </div>
          </div>
        )}

        {status === 'rejected' && (
          <div>
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>❌ Pagamento não confirmado ou tempo esgotado.</p>
            <a href="/criar" style={{ color: '#ff6b9d', fontSize: '14px' }}>← Tentar novamente</a>
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '24px' }}>
          Após o pagamento, você será redirecionado automaticamente.
        </p>
      </div>
    </main>
  )
}

export default function AguardandoPixPage() {
  return (
    <Suspense>
      <AguardandoPixContent />
    </Suspense>
  )
}