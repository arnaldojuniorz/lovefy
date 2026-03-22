'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { initMercadoPago, CardPayment } from '@mercadopago/sdk-react'

initMercadoPago('APP_USR-bd8cfe0a-9421-48a7-8c34-dff679b00deb', { locale: 'pt-BR' })

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

  const [metodo, setMetodo] = useState<'pix' | 'cartao' | null>(null)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [loadingPix, setLoadingPix] = useState(false)
  const [erro, setErro] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [status, setStatus] = useState<'aguardando' | 'aprovado'>('aguardando')

  const valor = PRECOS[plano] || 9.90

  async function gerarPix() {
    setLoadingPix(true)
    setErro('')
    try {
      const res = await fetch('/api/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carta_id,
          plano,
          tipo,
          email_pagador: email_pagador || 'pagador@lovefy.app.br',
          nome_pagador: nome_pagador || 'Cliente',
        }),
      })
      const data = await res.json()
      if (data.qr_code) {
        setQrCode(data.qr_code)
        setQrCodeBase64(data.qr_code_base64)
        setPaymentId(data.payment_id)
      } else {
        setErro(data.error || 'Erro ao gerar QR Code')
      }
    } catch {
      setErro('Erro de conexão')
    } finally {
      setLoadingPix(false)
    }
  }

  function selecionarMetodo(m: 'pix' | 'cartao') {
    setMetodo(m)
    setErro('')
    if (m === 'pix' && !qrCode) {
      gerarPix()
    }
  }

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

  async function handleCartao(formData: any) {
    setErro('')
    try {
      const res = await fetch('/api/cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          carta_id,
          plano,
          tipo,
          transaction_amount: valor,
          email_pagador: email_pagador || 'pagador@lovefy.app.br',
          nome_pagador: nome_pagador || 'Cliente',
        }),
      })
      const data = await res.json()
      if (data.status === 'approved') {
        setStatus('aprovado')
        setTimeout(() => {
          window.location.href = `/obrigado?carta_id=${carta_id}&tipo=${tipo}`
        }, 2000)
      } else {
        setErro('Pagamento não aprovado. Verifique os dados e tente novamente.')
      }
    } catch {
      setErro('Erro ao processar pagamento')
    }
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'480px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'32px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'16px'}}>← Voltar</a>
          <h1 style={{color:'#fff', fontSize:'24px', fontWeight:'bold', margin:'0 0 8px'}}>Finalizar pagamento</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Escolha a forma de pagamento</p>
        </div>

        {/* Valor */}
        <div style={{background:'#16213e', borderRadius:'16px', padding:'20px', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'16px', textAlign:'center'}}>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', margin:'0 0 4px'}}>Valor a pagar</p>
          <p style={{background:'linear-gradient(135deg, #ff6b9d, #c44569)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontSize:'40px', fontWeight:'900', margin:'0'}}>
            R$ {valor.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {/* Seletor de método */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px'}}>
          <button
            onClick={() => selecionarMetodo('pix')}
            style={{padding:'16px', borderRadius:'12px', border: metodo === 'pix' ? '2px solid #ff6b9d' : '2px solid rgba(255,255,255,0.1)', background: metodo === 'pix' ? 'rgba(255,107,157,0.1)' : '#16213e', color:'#fff', cursor:'pointer', transition:'all 0.2s'}}
          >
            <div style={{fontSize:'24px', marginBottom:'4px'}}>🏦</div>
            <p style={{margin:'0', fontWeight:600, fontSize:'14px'}}>Pix</p>
            <p style={{margin:'0', fontSize:'11px', color:'rgba(255,255,255,0.5)'}}>Instantâneo</p>
          </button>
          <button
            onClick={() => selecionarMetodo('cartao')}
            style={{padding:'16px', borderRadius:'12px', border: metodo === 'cartao' ? '2px solid #ff6b9d' : '2px solid rgba(255,255,255,0.1)', background: metodo === 'cartao' ? 'rgba(255,107,157,0.1)' : '#16213e', color:'#fff', cursor:'pointer', transition:'all 0.2s'}}
          >
            <div style={{fontSize:'24px', marginBottom:'4px'}}>💳</div>
            <p style={{margin:'0', fontWeight:600, fontSize:'14px'}}>Cartão</p>
            <p style={{margin:'0', fontSize:'11px', color:'rgba(255,255,255,0.5)'}}>Crédito ou débito</p>
          </button>
        </div>

        {/* Conteúdo do método */}
        {metodo && (
          <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', marginBottom:'16px'}}>

            {status === 'aprovado' && (
              <div style={{textAlign:'center', padding:'32px 0'}}>
                <div style={{fontSize:'64px', marginBottom:'16px'}}>🎉</div>
                <h2 style={{color:'#4ecdc4', fontSize:'22px', fontWeight:'bold', margin:'0 0 8px'}}>Pagamento confirmado!</h2>
                <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px'}}>Redirecionando...</p>
              </div>
            )}

            {/* PIX */}
            {metodo === 'pix' && status !== 'aprovado' && (
              <div>
                {loadingPix && (
                  <div style={{textAlign:'center', padding:'40px 0'}}>
                    <div style={{fontSize:'40px', marginBottom:'16px'}}>⏳</div>
                    <p style={{color:'rgba(255,255,255,0.5)'}}>Gerando QR Code...</p>
                  </div>
                )}

                {erro && <p style={{color:'#ff6b9d', textAlign:'center', marginBottom:'16px'}}>{erro}</p>}

                {qrCode && !loadingPix && (
                  <div>
                    <p style={{color:'rgba(255,255,255,0.6)', fontSize:'13px', marginBottom:'16px', textAlign:'center'}}>
                      Escaneie o QR Code com seu app de banco
                    </p>
                    {qrCodeBase64 && (
                      <div style={{textAlign:'center', marginBottom:'16px'}}>
                        <div style={{background:'#fff', borderRadius:'16px', padding:'16px', display:'inline-block'}}>
                          <img src={`data:image/png;base64,${qrCodeBase64}`} alt="QR Code Pix" style={{width:'200px', height:'200px', display:'block'}} />
                        </div>
                      </div>
                    )}
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px'}}>
                      <div style={{flex:1, height:'1px', background:'rgba(255,255,255,0.1)'}} />
                      <span style={{color:'rgba(255,255,255,0.3)', fontSize:'12px'}}>ou copie o código</span>
                      <div style={{flex:1, height:'1px', background:'rgba(255,255,255,0.1)'}} />
                    </div>
                    <div style={{background:'#0f3460', borderRadius:'12px', padding:'12px', marginBottom:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
                      <p style={{color:'rgba(255,255,255,0.5)', fontSize:'10px', margin:'0 0 6px', textTransform:'uppercase', letterSpacing:'1px'}}>Código Pix</p>
                      <p style={{color:'rgba(255,255,255,0.7)', fontSize:'11px', margin:'0', wordBreak:'break-all', lineHeight:'1.5'}}>
                        {qrCode.substring(0, 80)}...
                      </p>
                    </div>
                    <button onClick={copiar} style={{width:'100%', padding:'16px', background: copiado ? 'linear-gradient(135deg, #4ecdc4, #2eaf9f)' : 'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer', transition:'all 0.3s', marginBottom:'12px'}}>
                      {copiado ? '✅ Código copiado!' : '📋 Copiar código Pix'}
                    </button>
                    <div style={{padding:'12px', background:'rgba(78,205,196,0.1)', borderRadius:'12px', border:'1px solid rgba(78,205,196,0.2)', textAlign:'center'}}>
                      <p style={{color:'#4ecdc4', fontSize:'13px', margin:'0'}}>⏳ Aguardando pagamento...</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CARTÃO */}
            {metodo === 'cartao' && status !== 'aprovado' && (
              <div>
                <CardPayment
                  initialization={{ amount: valor }}
                  customization={{
                    visual: { style: { theme: 'dark' } },
                    paymentMethods: { types: { included: ['credit_card', 'debit_card'] } },
                  }}
                  onSubmit={handleCartao}
                  onError={(error) => setErro('Erro no cartão')}
                />
                {erro && <p style={{color:'#ff6b9d', textAlign:'center', marginTop:'12px'}}>{erro}</p>}
              </div>
            )}

          </div>
        )}

        {!metodo && (
          <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)', textAlign:'center'}}>
            <div style={{fontSize:'40px', marginBottom:'12px'}}>👆</div>
            <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0'}}>Selecione uma forma de pagamento acima</p>
          </div>
        )}

        <div style={{background:'#16213e', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:'0', textAlign:'center', lineHeight:'1.6'}}>
            🔒 Pagamento processado pelo Mercado Pago • 100% seguro
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