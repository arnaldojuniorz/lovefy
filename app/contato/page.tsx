export default function ContatoPage() {
  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color:'#fff', overflowX:'hidden'}}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-20px) rotate(10deg); } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 20px rgba(255,107,157,0.3); } 50% { box-shadow: 0 0 40px rgba(255,107,157,0.5); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .floating-heart { position:absolute; animation:float 6s ease-in-out infinite; opacity:0.1; pointer-events:none; }
        .contact-icon { animation:pulseGlow 3s ease-in-out infinite; }
        .fade-in { animation:fadeIn 0.6s ease-out forwards; }
      `}</style>

      <div className="floating-heart" style={{top:'10%', left:'5%', fontSize:'48px', animationDelay:'0s'}}>💕</div>
      <div className="floating-heart" style={{top:'20%', right:'10%', fontSize:'32px', animationDelay:'1s'}}>💗</div>
      <div className="floating-heart" style={{top:'60%', left:'8%', fontSize:'40px', animationDelay:'2s'}}>💖</div>
      <div className="floating-heart" style={{top:'70%', right:'15%', fontSize:'24px', animationDelay:'3s'}}>💝</div>

      <div style={{position:'relative', zIndex:10, padding:'48px 16px'}}>

        <header style={{textAlign:'center', marginBottom:'48px'}} className="fade-in">
          <a href="/" style={{display:'inline-flex', alignItems:'center', gap:'6px', marginBottom:'24px', textDecoration:'none', color:'#ff6b9d', fontSize:'14px', padding:'8px 16px', border:'1px solid rgba(255,107,157,0.3)', borderRadius:'8px', background:'rgba(255,107,157,0.08)'}}>
            ← Voltar para página inicial
          </a>
          <div style={{display:'block', marginBottom:'16px'}}>
            <span style={{fontSize:'40px', fontWeight:'900', background:'linear-gradient(135deg, #ff6b9d, #c44569, #ff8a5c)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>Lovefy</span>
          </div>
          <h1 style={{fontSize:'32px', fontWeight:'bold', margin:'0 0 16px'}}>Entre em Contato</h1>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:'16px', fontWeight:'300', margin:'0'}}>
            Estamos aqui para ajudar você a criar momentos inesquecíveis 💕
          </p>
        </header>

        <div style={{maxWidth:'600px', margin:'0 auto'}}>

          <div style={{background:'#16213e', borderRadius:'24px', padding:'40px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', textAlign:'center', marginBottom:'32px'}} className="fade-in">
            <div className="contact-icon" style={{width:'80px', height:'80px', borderRadius:'50%', background:'linear-gradient(135deg, #ff6b9d, #c44569)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:'36px'}}>
              📧
            </div>
            <h2 style={{fontSize:'24px', fontWeight:'bold', margin:'0 0 8px'}}>Fale Conosco</h2>
            <p style={{color:'rgba(255,255,255,0.5)', margin:'0 0 32px', fontSize:'14px'}}>Respondemos em até 24 horas</p>
            <a href="mailto:contatolovefy@gmail.com"
              style={{display:'block', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', padding:'16px 32px', borderRadius:'12px', textDecoration:'none', fontWeight:'600', fontSize:'16px', marginBottom:'16px'}}>
              contatolovefy@gmail.com
            </a>
            <p style={{color:'rgba(255,255,255,0.4)', fontSize:'13px', margin:'0'}}>
              Clique para enviar um e-mail diretamente
            </p>
          </div>

          <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}} className="fade-in">
            <h2 style={{fontSize:'18px', fontWeight:'bold', textAlign:'center', margin:'0 0 24px'}}>Redes Sociais</h2>
            <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>

              <a href="https://www.tiktok.com/@lovefy.br" target="_blank" rel="noopener noreferrer"
                style={{display:'flex', alignItems:'center', gap:'16px', padding:'16px', borderRadius:'12px', background:'#0f3460', border:'1px solid rgba(255,255,255,0.08)', textDecoration:'none', color:'#fff'}}>
                <div style={{width:'40px', height:'40px', borderRadius:'8px', background:'rgba(78,205,196,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.78a4.85 4.85 0 01-1.01-.09z" fill="#4ecdc4"/>
                  </svg>
                </div>
                <div>
                  <p style={{fontWeight:'500', margin:'0 0 2px'}}>TikTok</p>
                  <p style={{color:'#4ecdc4', margin:'0', fontSize:'14px'}}>@lovefy.br</p>
                </div>
              </a>

              <a href="https://www.instagram.com/lovefy.br/" target="_blank" rel="noopener noreferrer"
                style={{display:'flex', alignItems:'center', gap:'16px', padding:'16px', borderRadius:'12px', background:'#0f3460', border:'1px solid rgba(255,255,255,0.08)', textDecoration:'none', color:'#fff'}}>
                <div style={{width:'40px', height:'40px', borderRadius:'8px', background:'rgba(255,138,92,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <rect x="2" y="2" width="20" height="20" rx="5" stroke="#ff8a5c" strokeWidth="2"/>
                    <circle cx="12" cy="12" r="4" stroke="#ff8a5c" strokeWidth="2"/>
                    <circle cx="17.5" cy="6.5" r="1" fill="#ff8a5c"/>
                  </svg>
                </div>
                <div>
                  <p style={{fontWeight:'500', margin:'0 0 2px'}}>Instagram</p>
                  <p style={{color:'#ff8a5c', margin:'0', fontSize:'14px'}}>@lovefy.br</p>
                </div>
              </a>

            </div>
          </div>

        </div>

        <footer style={{textAlign:'center', marginTop:'48px'}}>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px', margin:'0 0 8px'}}>Feito com 💕 pela equipe Lovefy</p>
          <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px', margin:'0'}}>© 2026 Lovefy. Todos os direitos reservados.</p>
        </footer>

      </div>
    </main>
  )
}