'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

const PRECOS: Record<string, number> = {
  '24h': 6.90,
  'forever': 12.90,
  'impressao': 9.90,
}

function CheckoutContent() {
  const searchParams = useSearchParams()
  const carta_id = searchParams.get('carta_id')
  const tipo = searchParams.get('tipo') || 'digital'
  const plano = searchParams.get('plano') || 'forever'
  const nome_pagador = searchParams.get('nome') || ''
  const email_pagador = searchParams.get('email') || ''

  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [status, setStatus] = useState<'aguardando' | 'aprovado' | 'erro'>('aguardando')

  const valor = PRECOS[plano] || 9.90

  useEffect(() => {
    if (!carta_id) return

    fetch('/api/pix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carta_id, plano, tipo, email_pagador: email_pagador || 'pagador@lovefy.app.br', nome_pagador: nome_pagador || 'Cliente' }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.qr_code) {
          setQrCode(data.qr_code)
          setQrCodeBase64(data.qr_code_base64)
          setPaymentId(data.payment_id)
        } else {
          setErro(data.error || 'Erro ao gerar QR Code')
        }
      })
      .catch(() => setErro('Erro de conexão'))
      .finally(() => setLoading(false))
  }, [carta_id, plano, tipo, email_pagador, nome_pagador])

  // Verificar status do pagamento a cada 5 segundos
  useEffect(() => {
    if (!paymentId || status === 'aprovado') return

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/pix/status?payment_id=${paymentId}`)
        const data = await res.json()
        if (data.status === 'approved') {
          setStatus('aprovado')
          clearInterval(interval)
          setTimeout(() => {
            window.location.href = `/obrigado?carta_id=${carta_id}&tipo=${tipo}`
          }, 2000)
        }
      } catch {}
    }, 5000)

    return () => clearInterval(interval)
  }, [paymentId, status, carta_id, tipo])

  function copiar() {
    if (!qrCode) return
    navigator.clipboard.writeText(qrCode)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'480px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'16px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'24px', fontWeight:'bold', margin:'0 0 8px'}}>Pagar com Pix</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Pagamento instantâneo e seguro</p>
        </div>

        <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'16px'}}>

          {/* Valor */}
          <div style={{textAlign:'center', marginBottom:'24px', paddingBottom:'24px', borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
            <p style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 4px'}}>Valor a pagar</p>
            <p style={{background:'linear-gradient(135deg, #ff6b9d, #c44569)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'40px', fontWeight:'900', margin:'0'}}>
              R$ {valor.toFixed(2).replace('.', ',')}
            </p>
          </div>

          {loading && (
            <div style={{textAlign:'center', padding:'40px 0'}}>
              <div style={{fontSize:'40px', marginBottom:'16px'}}>⏳</div>
              <p style={{color:'rgba(255,255,255,0.5)'}}>Gerando QR Code...</p>
            </div>
          )}

          {erro && (
            <div style={{textAlign:'center', padding:'24px', color:'#ff6b9d'}}>
              <p>{erro}</p>
            </div>
          )}

          {status === 'aprovado' && (
            <div style={{textAlign:'center', padding:'32px 0'}}>
              <div style={{fontSize:'64px', marginBottom:'16px'}}>🎉</div>
              <h2 style={{color:'#4ecdc4', fontSize:'22px', fontWeight:'bold', margin:'0 0 8px'}}>Pagamento confirmado!</h2>
              <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px'}}>Redirecionando...</p>
            </div>
          )}

          {qrCode && status === 'aguardando' && (
            <div>
              {/* QR Code */}
              <div style={{textAlign:'center', marginBottom:'20px'}}>
                <p style={{color:'rgba(255,255,255,0.6)', fontSize:'13px', marginBottom:'16px'}}>
                  Escaneie o QR Code com seu app de banco
                </p>
                {qrCodeBase64 && (
                  <div style={{background:'#fff', borderRadius:'16px', padding:'16px', display:'inline-block', marginBottom:'16px'}}>
                    <img
                      src={`data:image/png;base64,${qrCodeBase64}`}
                      alt="QR Code Pix"
                      style={{width:'200px', height:'200px', display:'block'}}
                    />
                  </div>
                )}
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px'}}>
                  <div style={{flex:1, height:'1px', background:'rgba(255,255,255,0.1)'}} />
                  <span style={{color:'rgba(255,255,255,0.3)', fontSize:'12px'}}>ou</span>
                  <div style={{flex:1, height:'1px', background:'rgba(255,255,255,0.1)'}} />
                </div>
                <p style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', marginBottom:'12px'}}>
                  Copie o código Pix
                </p>
              </div>

              {/* Código copia e cola */}
              <div style={{background:'#0f3460', borderRadius:'12px', padding:'12px', marginBottom:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
                <p style={{color:'rgba(255,255,255,0.5)', fontSize:'11px', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'1px'}}>Código Pix</p>
                <p style={{color:'rgba(255,255,255,0.7)', fontSize:'11px', margin:'0', wordBreak:'break-all', lineHeight:'1.5'}}>
                  {qrCode.substring(0, 80)}...
                </p>
              </div>

              <button
                onClick={copiar}
                style={{width:'100%', padding:'16px', background: copiado ? 'linear-gradient(135deg, #4ecdc4, #2eaf9f)' : 'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer', transition:'all 0.3s'}}
              >
                {copiado ? '✅ Código copiado!' : '📋 Copiar código Pix'}
              </button>

              <div style={{marginTop:'16px', padding:'12px', background:'rgba(78,205,196,0.1)', borderRadius:'12px', border:'1px solid rgba(78,205,196,0.2)', textAlign:'center'}}>
                <p style={{color:'#4ecdc4', fontSize:'13px', margin:'0'}}>
                  ⏳ Aguardando pagamento... A página será atualizada automaticamente.
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={{background:'#16213e', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:'0', textAlign:'center', lineHeight:'1.6'}}>
            🔒 Pagamento processado pelo Mercado Pago • Pix é instantâneo e seguro
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