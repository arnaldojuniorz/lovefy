'use client'

import { useState } from 'react'

export default function ImprimirPage() {
  const [etapa, setEtapa] = useState(1)
  const [loading, setLoading] = useState(false)
  const [dados, setDados] = useState({
    destinatario: '',
    remetente: '',
    como_se_conheceram: '',
    memoria_especial: '',
    mensagem: '',
    data_importante: '',
    cor: '#ff6b9d',
    estilo: 'classico',
    musica_link: '',
    nome_pagador: '',
    email_pagador: '',
  })

  function atualizar(campo: string, valor: string) {
    setDados(prev => ({ ...prev, [campo]: valor }))
  }

  async function handlePagar() {
    if (!dados.nome_pagador || !dados.email_pagador) {
      alert('Preencha seu nome e e-mail!')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/cartas-impressao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Erro ao salvar carta')
        setLoading(false)
        return
      }

      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carta_id: result.carta_id,
          plano: 'impressao',
          tipo: 'impressao',
        }),
      })

      const checkoutResult = await checkoutResponse.json()

      if (!checkoutResponse.ok) {
        alert(checkoutResult.error || 'Erro ao criar pagamento')
        setLoading(false)
        return
      }

      window.location.href = `/checkout?carta_id=${result.carta_id}&plano=impressao&tipo=impressao`

    } catch (error) {
      alert('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'700px', margin:'0 auto'}}>

        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <h1 style={{fontFamily:'Georgia, serif', fontSize:'36px', fontWeight:'700', color:'#ffffff', margin:'0 0 12px'}}>
            Crie sua carta para impressão
          </h1>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:'16px', margin:'0'}}>
            Um presente simples, mas inesquecível
          </p>
        </div>

        <div style={{display:'flex', gap:'8px', marginBottom:'32px'}}>
          {[1,2,3].map(n => (
            <div key={n} style={{flex:1, height:'4px', borderRadius:'4px', background: n <= etapa ? '#ff6b9d' : 'rgba(255,255,255,0.2)', transition:'all 0.3s'}} />
          ))}
        </div>

        {/* Etapa 1 */}
        {etapa === 1 && (
          <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'24px'}}>
            <h2 style={{color:'#ff6b9d', fontSize:'14px', fontWeight:'600', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Informações
            </h2>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Para quem é essa carta? *</label>
              <input type="text" value={dados.destinatario} onChange={e => atualizar('destinatario', e.target.value)} placeholder="Ex: Ana"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Seu nome *</label>
              <input type="text" value={dados.remetente} onChange={e => atualizar('remetente', e.target.value)} placeholder="Ex: Lucas"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Como se conheceram? (opcional)</label>
              <textarea value={dados.como_se_conheceram} onChange={e => atualizar('como_se_conheceram', e.target.value)} placeholder="Conte a história..." rows={3}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', resize:'vertical', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Memória especial (opcional)</label>
              <textarea value={dados.memoria_especial} onChange={e => atualizar('memoria_especial', e.target.value)} placeholder="Uma lembrança marcante..." rows={3}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', resize:'vertical', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Sua mensagem *</label>
              <textarea value={dados.mensagem} onChange={e => atualizar('mensagem', e.target.value)} placeholder="Escreva tudo que você sente..." rows={8}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', resize:'vertical', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Data importante (opcional)</label>
              <input type="date" value={dados.data_importante} onChange={e => atualizar('data_importante', e.target.value)}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
            </div>

            <button
              onClick={() => {
                if (!dados.destinatario || !dados.remetente || !dados.mensagem) {
                  alert('Preencha os campos obrigatórios!')
                  return
                }
                setEtapa(2)
              }}
              style={{width:'100%', padding:'16px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer'}}
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Etapa 2 */}
        {etapa === 2 && (
          <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'24px'}}>
            <h2 style={{color:'#ff6b9d', fontSize:'14px', fontWeight:'600', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Estilo da carta
            </h2>

            <div style={{marginBottom:'24px'}}>
              <p style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:'0 0 12px'}}>Escolha o estilo:</p>
              <div style={{display:'flex', gap:'12px'}}>
                {[
                  { id: 'classico', emoji: '✨', nome: 'Clássico' },
                  { id: 'moderno', emoji: '🌟', nome: 'Moderno' },
                ].map(e => (
                  <div
                    key={e.id}
                    onClick={() => atualizar('estilo', e.id)}
                    style={{flex:1, cursor:'pointer', border: dados.estilo === e.id ? '2px solid #ff6b9d' : '2px solid rgba(255,255,255,0.1)', borderRadius:'12px', padding:'16px', textAlign:'center', background: dados.estilo === e.id ? 'rgba(255,107,157,0.1)' : 'transparent', transition:'all 0.2s'}}
                  >
                    <div style={{fontSize:'24px', marginBottom:'8px'}}>{e.emoji}</div>
                    <div style={{color:'rgba(255,255,255,0.8)', fontSize:'13px', fontWeight:'500'}}>{e.nome}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{marginBottom:'24px'}}>
              <p style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', margin:'0 0 12px'}}>Escolha a cor:</p>
              <div style={{display:'flex', gap:'16px'}}>
                {[
                  { cor: '#ff6b9d', nome: 'Rosa' },
                  { cor: '#f5e6d3', nome: 'Bege' },
                  { cor: '#ffffff', nome: 'Branco' },
                  { cor: '#1a1a1a', nome: 'Preto' },
                ].map(c => (
                  <div
                    key={c.cor}
                    onClick={() => atualizar('cor', c.cor)}
                    title={c.nome}
                    style={{width:'48px', height:'48px', borderRadius:'50%', background:c.cor, cursor:'pointer', border: dados.cor === c.cor ? '3px solid rgba(255,255,255,0.8)' : '2px solid transparent', transform: dados.cor === c.cor ? 'scale(1.1)' : 'scale(1)', transition:'all 0.2s', boxShadow: c.cor === '#ffffff' || c.cor === '#f5e6d3' ? '0 0 0 1px rgba(255,255,255,0.2)' : 'none'}}
                  />
                ))}
              </div>
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Link do Spotify (opcional)</label>
              <input type="text" value={dados.musica_link} onChange={e => atualizar('musica_link', e.target.value)} placeholder="https://open.spotify.com/track/..."
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'14px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
              <p style={{color:'rgba(255,255,255,0.3)', fontSize:'11px', marginTop:'6px'}}>Um QR Code será adicionado à carta</p>
            </div>

            <div style={{display:'flex', gap:'12px'}}>
              <button onClick={() => setEtapa(1)}
                style={{flex:1, padding:'16px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer'}}>
                ← Voltar
              </button>
              <button onClick={() => setEtapa(3)}
                style={{flex:1, padding:'16px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer'}}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3 */}
        {etapa === 3 && (
          <div style={{background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'16px', padding:'24px'}}>
            <h2 style={{color:'#ff6b9d', fontSize:'14px', fontWeight:'600', margin:'0 0 20px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
              Finalizar
            </h2>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Seu nome *</label>
              <input type="text" value={dados.nome_pagador} onChange={e => atualizar('nome_pagador', e.target.value)} placeholder="Seu nome completo"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Seu e-mail *</label>
              <input type="email" value={dados.email_pagador} onChange={e => atualizar('email_pagador', e.target.value)} placeholder="seu@email.com"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'#16213e', outline:'none', boxSizing:'border-box'}} />
            </div>

            <div style={{background:'rgba(255,107,157,0.1)', border:'1px solid rgba(255,107,157,0.2)', borderRadius:'12px', padding:'20px', marginBottom:'24px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <p style={{color:'#fff', fontWeight:'600', margin:'0 0 4px'}}>Carta para Impressão</p>
                  <p style={{color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:'0'}}>PDF em alta qualidade</p>
                </div>
                <p style={{color:'#ff6b9d', fontSize:'24px', fontWeight:'900', margin:'0'}}>R$ 19,90</p>
              </div>
            </div>

            <div style={{display:'flex', gap:'12px'}}>
              <button onClick={() => setEtapa(2)}
                style={{flex:1, padding:'16px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer'}}>
                ← Voltar
              </button>
              <button
                onClick={handlePagar}
                disabled={loading}
                style={{flex:1, padding:'16px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer', opacity: loading ? 0.7 : 1}}
              >
                {loading ? 'Aguarde...' : 'Pagar R$ 9,90 💳'}
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  )
}