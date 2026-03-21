'use client'

import { useState } from 'react'

export default function ContatoPage() {
  const [form, setForm] = useState({ nome: '', email: '', assunto: '', mensagem: '' })
  const [enviado, setEnviado] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 2000))
    setEnviado(true)
    setLoading(false)
    setForm({ nome: '', email: '', assunto: '', mensagem: '' })
  }

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color:'#fff', overflowX:'hidden'}}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.3); } 50% { box-shadow: 0 0 40px rgba(255,107,157,0.5); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .floating-heart { position:absolute; animation:float 6s ease-in-out infinite; opacity:0.1; pointer-events:none; }
        .contact-icon { animation:pulseGlow 3s ease-in-out infinite; }
        .fade-in { animation:fadeIn 0.6s ease-out forwards; }
        .input-style { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); transition:all 0.3s; }
        .input-style:focus { outline:none; border-color:#ff6b9d; box-shadow:0 0 0 3px rgba(255,107,157,0.15); }
        .btn-gradient { background:linear-gradient(135deg, #ff6b9d 0%, #c44569 100%); box-shadow:0 4px 20px rgba(255,107,157,0.35); transition:all 0.3s; }
        .btn-gradient:hover:not(:disabled) { filter:brightness(1.1); box-shadow:0 6px 25px rgba(255,107,157,0.5); }
        .btn-gradient:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>

      {/* Corações flutuantes */}
      <div className="floating-heart" style={{top:'10%', left:'5%', fontSize:'48px', animationDelay:'0s'}}>💕</div>
      <div className="floating-heart" style={{top:'20%', right:'10%', fontSize:'32px', animationDelay:'1s'}}>💗</div>
      <div className="floating-heart" style={{top:'60%', left:'8%', fontSize:'40px', animationDelay:'2s'}}>💖</div>
      <div className="floating-heart" style={{top:'70%', right:'15%', fontSize:'24px', animationDelay:'3s'}}>💝</div>
      <div className="floating-heart" style={{top:'85%', left:'20%', fontSize:'32px', animationDelay:'4s'}}>💓</div>

      <div style={{position:'relative', zIndex:10, padding:'48px 16px'}}>

        {/* Header */}
        <header style={{textAlign:'center', marginBottom:'48px'}} className="fade-in">
          <a href="/" style={{display:'inline-block', marginBottom:'24px', textDecoration:'none'}}>
            <span style={{fontSize:'40px', fontWeight:'900', background:'linear-gradient(135deg, #ff6b9d, #c44569, #ff8a5c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Lovefy</span>
          </a>
          <h1 style={{fontSize:'32px', fontWeight:'bold', margin:'0 0 16px'}}>Entre em Contato</h1>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:'16px', fontWeight:'300', margin:'0'}}>
            Estamos aqui para ajudar você a criar momentos inesquecíveis 💕
          </p>
        </header>

        <main style={{maxWidth:'900px', margin:'0 auto'}}>

          {/* Grid principal */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'48px'}} className="fade-in">

            {/* Card de informações */}
            <div style={{background:'#16213e', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
              <div className="contact-icon" style={{width:'64px', height:'64px', borderRadius:'50%', background:'linear-gradient(135deg, #ff6b9d, #c44569)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'24px', fontSize:'28px'}}>
                📧
              </div>
              <h2 style={{fontSize:'22px', fontWeight:'bold', margin:'0 0 24px'}}>Fale Conosco</h2>

              <div style={{display:'flex', flexDirection:'column', gap:'24px'}}>
                {/* Email */}
                <div style={{display:'flex', alignItems:'flex-start', gap:'16px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'8px', background:'#0f3460', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px'}}>📧</div>
                  <div>
                    <p style={{fontWeight:'500', margin:'0 0 4px'}}>E-mail</p>
                    <a href="mailto:contatolovefy@gmail.com" style={{color:'#ff6b9d', textDecoration:'none', fontWeight:'300'}}>contatolovefy@gmail.com</a>
                  </div>
                </div>

                {/* TikTok */}
                <div style={{display:'flex', alignItems:'flex-start', gap:'16px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'8px', background:'#0f3460', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px'}}>🎵</div>
                  <div>
                    <p style={{fontWeight:'500', margin:'0 0 4px'}}>TikTok</p>
                    <a href="https://www.tiktok.com/@lovefy.br" target="_blank" rel="noopener noreferrer" style={{color:'#4ecdc4', textDecoration:'none', fontWeight:'300'}}>@lovefy.br</a>
                  </div>
                </div>

                {/* Instagram */}
                <div style={{display:'flex', alignItems:'flex-start', gap:'16px'}}>
                  <div style={{width:'40px', height:'40px', borderRadius:'8px', background:'#0f3460', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:'18px'}}>📸</div>
                  <div>
                    <p style={{fontWeight:'500', margin:'0 0 4px'}}>Instagram</p>
                    <a href="https://www.instagram.com/lovefy.br/" target="_blank" rel="noopener noreferrer" style={{color:'#ff8a5c', textDecoration:'none', fontWeight:'300'}}>@lovefy.br</a>
                  </div>
                </div>
              </div>

              {/* Tempo de resposta */}
              <div style={{marginTop:'32px', padding:'16px', borderRadius:'12px', background:'#0f3460', border:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', gap:'12px'}}>
                <span style={{fontSize:'24px'}}>⚡</span>
                <div>
                  <p style={{fontWeight:'500', fontSize:'14px', margin:'0 0 2px'}}>Tempo de Resposta</p>
                  <p style={{color:'rgba(255,255,255,0.7)', fontSize:'14px', fontWeight:'300', margin:'0'}}>Respondemos em até 24 horas</p>
                </div>
              </div>
            </div>

            {/* Formulário */}
            <div style={{background:'#16213e', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
              <h2 style={{fontSize:'22px', fontWeight:'bold', margin:'0 0 24px'}}>Envie uma Mensagem</h2>

              {enviado ? (
                <div style={{background:'linear-gradient(135deg, rgba(78,205,196,0.2), rgba(78,205,196,0.1))', border:'1px solid #4ecdc4', borderRadius:'12px', padding:'16px', display:'flex', alignItems:'center', gap:'12px'}}>
                  <span style={{fontSize:'32px'}}>✨</span>
                  <div>
                    <p style={{fontWeight:'600', color:'#4ecdc4', margin:'0 0 4px'}}>Mensagem enviada!</p>
                    <p style={{color:'rgba(255,255,255,0.7)', fontSize:'14px', margin:'0'}}>Responderemos em breve 💕</p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEnviar} style={{display:'flex', flexDirection:'column', gap:'20px'}}>
                  <div>
                    <label style={{display:'block', fontSize:'14px', fontWeight:'500', marginBottom:'8px'}}>Seu Nome</label>
                    <input type="text" required value={form.nome} onChange={e => setForm(p => ({...p, nome:e.target.value}))} placeholder="Como podemos te chamar?" className="input-style"
                      style={{width:'100%', padding:'12px 16px', borderRadius:'12px', fontSize:'15px', color:'#fff', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'14px', fontWeight:'500', marginBottom:'8px'}}>Seu E-mail</label>
                    <input type="email" required value={form.email} onChange={e => setForm(p => ({...p, email:e.target.value}))} placeholder="seu@email.com" className="input-style"
                      style={{width:'100%', padding:'12px 16px', borderRadius:'12px', fontSize:'15px', color:'#fff', boxSizing:'border-box'}} />
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'14px', fontWeight:'500', marginBottom:'8px'}}>Assunto</label>
                    <select required value={form.assunto} onChange={e => setForm(p => ({...p, assunto:e.target.value}))} className="input-style"
                      style={{width:'100%', padding:'12px 16px', borderRadius:'12px', fontSize:'15px', color: form.assunto ? '#fff' : 'rgba(255,255,255,0.5)', background:'#16213e', boxSizing:'border-box', cursor:'pointer'}}>
                      <option value="">Selecione um assunto</option>
                      <option value="duvida">Dúvida sobre o serviço</option>
                      <option value="problema">Problema técnico</option>
                      <option value="pagamento">Dúvida sobre pagamento</option>
                      <option value="parceria">Proposta de parceria</option>
                      <option value="sugestao">Sugestão</option>
                      <option value="outro">Outro assunto</option>
                    </select>
                  </div>
                  <div>
                    <label style={{display:'block', fontSize:'14px', fontWeight:'500', marginBottom:'8px'}}>Sua Mensagem</label>
                    <textarea required rows={4} value={form.mensagem} onChange={e => setForm(p => ({...p, mensagem:e.target.value}))} placeholder="Conte-nos como podemos ajudar..." className="input-style"
                      style={{width:'100%', padding:'12px 16px', borderRadius:'12px', fontSize:'15px', color:'#fff', resize:'none', boxSizing:'border-box'}} />
                  </div>
                  <button type="submit" disabled={loading} className="btn-gradient"
                    style={{width:'100%', padding:'16px', borderRadius:'12px', color:'#fff', fontSize:'16px', fontWeight:'600', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
                    {loading ? 'Enviando...' : 'Enviar Mensagem →'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* FAQ */}
          <div style={{background:'#16213e', borderRadius:'16px', padding:'32px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}} className="fade-in">
            <h2 style={{fontSize:'22px', fontWeight:'bold', textAlign:'center', margin:'0 0 24px'}}>Perguntas Frequentes 💭</h2>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px'}}>
              {[
                { p: 'Como funciona a Lovefy?', r: 'Você preenche um formulário com informações sobre a pessoa especial e nós criamos uma carta digital personalizada com link exclusivo.' },
                { p: 'Preciso criar conta?', r: 'Não! Não precisa baixar app nem criar conta. É só preencher o formulário e compartilhar o link.' },
                { p: 'Qual o prazo de validade?', r: 'Você escolhe: 24h por R$ 6,90, Para Sempre por R$ 12,90 ou Carta para Impressão por R$ 9,90.' },
                { p: 'Posso editar depois?', r: 'Não é possível editar após a criação. Revise bem antes de finalizar!' },
              ].map(item => (
                <div key={item.p} style={{padding:'20px', borderRadius:'12px', background:'#0f3460', border:'1px solid rgba(255,255,255,0.08)'}}>
                  <h3 style={{fontWeight:'600', marginBottom:'8px', color:'#ff6b9d', fontSize:'14px'}}>{item.p}</h3>
                  <p style={{color:'rgba(255,255,255,0.7)', fontSize:'14px', fontWeight:'300', margin:'0', lineHeight:'1.6'}}>{item.r}</p>
                </div>
              ))}
            </div>
          </div>

        </main>

        {/* Footer */}
        <footer style={{textAlign:'center', marginTop:'48px'}}>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0 0 8px'}}>Feito com 💕 pela equipe Lovefy</p>
          <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:'0'}}>© 2025 Lovefy. Todos os direitos reservados.</p>
        </footer>

      </div>
    </main>
  )
}