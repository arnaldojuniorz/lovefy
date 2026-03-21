'use client'

import { useState } from 'react'

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 1500))
    setEnviado(true)
    setLoading(false)
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding:'40px 16px'}}>
      <div style={{maxWidth:'600px', margin:'0 auto'}}>

        {/* Header */}
        <div style={{textAlign:'center', marginBottom:'48px'}}>
          <a href="/" style={{color:'#ff6b9d', textDecoration:'none', fontSize:'14px', display:'block', marginBottom:'24px'}}>← Voltar</a>
          <div style={{fontSize:'64px', marginBottom:'16px'}}>💌</div>
          <h1 style={{color:'#fff', fontSize:'32px', fontWeight:'bold', margin:'0 0 8px'}}>Entre em contato</h1>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'16px', margin:'0'}}>Estamos aqui para ajudar</p>
        </div>

        {/* Cards de contato */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'40px'}}>
          {[
            { emoji: '📧', titulo: 'E-mail', desc: 'contato@lovefy.app.br' },
            { emoji: '⚡', titulo: 'Resposta', desc: 'Em até 24 horas' },
          ].map(item => (
            <div key={item.titulo} style={{background:'#16213e', borderRadius:'16px', padding:'20px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)'}}>
              <div style={{fontSize:'32px', marginBottom:'8px'}}>{item.emoji}</div>
              <p style={{color:'#ff6b9d', fontWeight:'600', margin:'0 0 4px', fontSize:'14px'}}>{item.titulo}</p>
              <p style={{color:'rgba(255,255,255,0.5)', margin:'0', fontSize:'13px'}}>{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Formulário */}
        {enviado ? (
          <div style={{background:'rgba(78,205,196,0.1)', border:'1px solid #4ecdc4', borderRadius:'16px', padding:'40px', textAlign:'center'}}>
            <div style={{fontSize:'48px', marginBottom:'16px'}}>✅</div>
            <h2 style={{color:'#4ecdc4', fontSize:'22px', margin:'0 0 8px'}}>Mensagem enviada!</h2>
            <p style={{color:'rgba(255,255,255,0.6)', margin:'0 0 24px'}}>Responderemos em até 24 horas.</p>
            <button
              onClick={() => { setEnviado(false); setForm({ nome: '', email: '', assunto: '', mensagem: '' }) }}
              style={{padding:'12px 24px', background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'12px', cursor:'pointer', fontSize:'14px'}}
            >
              Enviar outra mensagem
            </button>
          </div>
        ) : (
          <form onSubmit={handleEnviar} style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)'}}>
            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Seu nome *</label>
              <input
                type="text"
                required
                value={form.nome}
                onChange={e => setForm(p => ({...p, nome: e.target.value}))}
                placeholder="Ex: João Silva"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'rgba(255,255,255,0.05)', outline:'none', boxSizing:'border-box'}}
              />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Seu e-mail *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(p => ({...p, email: e.target.value}))}
                placeholder="seu@email.com"
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'rgba(255,255,255,0.05)', outline:'none', boxSizing:'border-box'}}
              />
            </div>

            <div style={{marginBottom:'16px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Assunto *</label>
              <select
                required
                value={form.assunto}
                onChange={e => setForm(p => ({...p, assunto: e.target.value}))}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color: form.assunto ? '#fff' : 'rgba(255,255,255,0.5)', background:'#16213e', outline:'none', boxSizing:'border-box'}}
              >
                <option value="" style={{color:'#888'}}>Selecione um assunto</option>
                <option value="duvida">Dúvida sobre o produto</option>
                <option value="pagamento">Problema com pagamento</option>
                <option value="carta">Problema com minha carta</option>
                <option value="sugestao">Sugestão de melhoria</option>
                <option value="outro">Outro</option>
              </select>
            </div>

            <div style={{marginBottom:'24px'}}>
              <label style={{color:'rgba(255,255,255,0.7)', fontSize:'13px', display:'block', marginBottom:'8px'}}>Mensagem *</label>
              <textarea
                required
                value={form.mensagem}
                onChange={e => setForm(p => ({...p, mensagem: e.target.value}))}
                placeholder="Descreva sua dúvida ou problema..."
                rows={5}
                style={{width:'100%', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', fontSize:'15px', color:'#fff', background:'rgba(255,255,255,0.05)', outline:'none', resize:'vertical', boxSizing:'border-box'}}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{width:'100%', padding:'16px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'16px', fontWeight:'600', cursor:'pointer', opacity: loading ? 0.7 : 1}}
            >
              {loading ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </form>
        )}

        {/* Footer */}
        <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'32px'}}>
          © 2025 Lovefy. Feito com amor
        </p>
      </div>
    </main>
  )
}