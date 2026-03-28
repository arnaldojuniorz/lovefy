'use client'

import { useState, useEffect } from 'react'

type Foto = {
  id: string
  storage_path: string
  ordem: number
  is_temp: boolean
}

type Carta = {
  id: string
  nome_destinatario: string
  nome_remetente: string
  como_se_conheceram: string
  memoria_especial: string
  data_importante: string
  mensagem_principal: string
  estilo_fundo: string
  recursos: string[]
  musica_link: string
  jogo_palavra1?: string
  jogo_palavra2?: string
  jogo_palavra3?: string
  slug: string
  fotos: Foto[]
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const STYLES = `
  @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes floatUp { 0%{transform:translateY(100%) rotate(0deg) scale(0.5);opacity:0} 10%{opacity:0.15} 90%{opacity:0.15} 100%{transform:translateY(-100%) rotate(360deg) scale(1);opacity:0} }
  @keyframes pulseGlow { 0%,100%{box-shadow:0 0 20px rgba(255,107,157,0.3)} 50%{box-shadow:0 0 40px rgba(255,107,157,0.6)} }
  @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
  @keyframes slideIn { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes sparkle { 0%,100%{opacity:0;transform:scale(0)} 50%{opacity:1;transform:scale(1)} }
  @keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
  @keyframes gradientShift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
  @keyframes flapMove { 0%,100%{transform:rotateX(0deg)} 50%{transform:rotateX(15deg)} }
  @keyframes gallerySlide { from{opacity:0;transform:translateY(40px) rotateX(10deg)} to{opacity:1;transform:translateY(0) rotateX(0)} }
  .float-anim { animation: float 3s ease-in-out infinite; }
  .pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
  .fade-in { animation: fadeInUp 0.8s ease-out forwards; }
  .slide-in { animation: slideIn 0.8s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .sparkle-dot { position:absolute; width:4px; height:4px; background:#ff6b9d; border-radius:50%; animation:sparkle 1.5s ease-in-out infinite; }
  .typing-cursor { display:inline-block; width:2px; height:1.2em; background:#ff6b9d; margin-left:2px; animation:blink 0.8s infinite; vertical-align:text-bottom; }
  .gradient-text { background:linear-gradient(135deg,#ff6b9d 0%,#c44569 50%,#ff8a5c 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
`

export default function CartaViewer({ carta }: { carta: Carta }) {
  const [pagina, setPagina] = useState(0)
  const paginas = buildPaginas(carta)

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', overflowX:'hidden'}}>
      <style>{STYLES}</style>
      {carta.musica_link && carta.recursos.includes('musica') && (
        <PlayerMusica link={carta.musica_link} />
      )}
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'16px'}}>
        <div style={{width:'100%', maxWidth:'448px'}}>
          {paginas[pagina]}
          {pagina < paginas.length - 1 && (
            <button
              onClick={() => { setPagina(p => p + 1); window.scrollTo(0,0) }}
              style={{width:'100%', marginTop:'16px', background:'linear-gradient(135deg,#ff6b9d,#c44569)', color:'#fff', fontWeight:600, padding:'16px', borderRadius:'16px', border:'none', cursor:'pointer', fontSize:'16px', boxShadow:'0 4px 20px rgba(255,107,157,0.35)'}}
            >
              Continuar →
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

function PlayerMusica({ link }: { link: string }) {
  const [aberto, setAberto] = useState(false)
  const spotifyId = link.match(/spotify\.com\/(?:track|intl-[a-z]+\/track)\/([A-Za-z0-9]+)/)?.[1]

  return (
    <div style={{position:'fixed', top:12, right:12, zIndex:1000, background:'#16213e', borderRadius:16, border:'1px solid rgba(255,107,157,0.3)', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', overflow:'hidden', transition:'all 0.3s ease', width: aberto ? (spotifyId ? 300 : 260) : 48}}>
      <button onClick={() => setAberto(a => !a)} style={{width:48, height:48, background:'transparent', border:'none', cursor:'pointer', fontSize:20, display:'flex', alignItems:'center', justifyContent:'center'}}>
        🎵
      </button>
      {aberto && (
        <div style={{padding:'0 12px 12px'}}>
          {spotifyId ? (
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
              width="100%"
              height="80"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{borderRadius:8}}
            />
          ) : (
            <a href={link} target="_blank" rel="noopener noreferrer" style={{display:'block', textAlign:'center', padding:'10px 16px', background:'linear-gradient(135deg,#1DB954,#17a349)', color:'#fff', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:600}}>
              Abrir música ↗
            </a>
          )}
        </div>
      )}
    </div>
  )
}

function buildPaginas(carta: Carta) {
  const paginas = []
  paginas.push(<PaginaEnvelope carta={carta} key="envelope" />)
  paginas.push(<PaginaRevelacao carta={carta} key="revelacao" />)
  if (carta.recursos.includes('galeria') && carta.fotos?.length > 0) {
    paginas.push(<PaginaGaleria carta={carta} key="galeria" />)
  }
  paginas.push(<PaginaContador carta={carta} key="contador" />)
  if (carta.recursos.includes('mapa_estrelas')) {
    paginas.push(<PaginaMapaEstrelas carta={carta} key="mapa" />)
  }
  if (carta.recursos.includes('jogo_palavras')) {
    paginas.push(<PaginaJogoPalavras carta={carta} key="jogo" />)
  }
  paginas.push(<PaginaResumo carta={carta} key="resumo" />)
  paginas.push(<PaginaFinal carta={carta} key="final" />)
  return paginas
}

function PaginaEnvelope({ carta }: { carta: Carta }) {
  return (
    <div style={{textAlign:'center', padding:'32px 16px'}}>
      <div style={{position:'relative', display:'inline-block', marginBottom:'32px'}}>
        <div className="sparkle-dot" style={{top:'10%', left:'5%', animationDelay:'0s'}} />
        <div className="sparkle-dot" style={{top:'5%', right:'15%', animationDelay:'0.3s'}} />
        <div className="sparkle-dot" style={{bottom:'20%', left:'0%', animationDelay:'0.6s'}} />
        <div className="sparkle-dot" style={{bottom:'15%', right:'5%', animationDelay:'0.9s'}} />
        <div className="float-anim" style={{width:'200px', height:'150px', position:'relative', cursor:'pointer', margin:'0 auto'}}>
          <div style={{width:'100%', height:'100%', background:'linear-gradient(145deg, #ff8a5c 0%, #ff6b9d 100%)', borderRadius:'8px', position:'absolute', boxShadow:'0 10px 40px rgba(255,107,157,0.3)'}} />
          <div style={{width:'100%', height:'100%', background:'linear-gradient(145deg, #ffe4e9 0%, #ffd4dc 100%)', borderRadius:'8px', position:'absolute', clipPath:'polygon(0 50%, 50% 0, 100% 50%, 100% 100%, 0 100%)'}} />
          <div style={{width:'100%', height:'50%', background:'linear-gradient(180deg, #ff9a6c 0%, #ff8a5c 100%)', position:'absolute', top:0, left:0, transformOrigin:'top center', clipPath:'polygon(0 0, 50% 100%, 100% 0)', animation:'flapMove 3s ease-in-out infinite', borderRadius:'8px 8px 0 0', zIndex:3}} />
          <div style={{position:'absolute', top:'50%', left:'50%', transform:'translate(-50%, -20%)', fontSize:'24px', zIndex:4}}>💝</div>
        </div>
      </div>
      <h1 className="gradient-text fade-in" style={{fontSize:'28px', fontWeight:'900', marginBottom:'16px', lineHeight:'1.3'}}>
        Você recebeu uma carta especial
      </h1>
      <p style={{color:'rgba(255,255,255,0.5)', marginBottom:'8px', fontSize:'16px'}}>
        De <span style={{color:'#ff6b9d', fontWeight:600}}>{carta.nome_remetente}</span>
      </p>
      <p style={{color:'rgba(255,255,255,0.5)', marginBottom:'32px', fontSize:'16px'}}>
        Para <span style={{color:'#ff6b9d', fontWeight:600}}>{carta.nome_destinatario}</span>
      </p>
      <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px'}}>
        feito com 💕 por <span className="gradient-text" style={{fontWeight:600}}>Lovefy</span>
      </p>
    </div>
  )
}

function PaginaRevelacao({ carta }: { carta: Carta }) {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const texto = carta.mensagem_principal || ''

  useEffect(() => {
    if (done) return
    let i = 0
    const interval = setInterval(() => {
      if (i < texto.length) {
        setTyped(texto.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, 18)
    return () => clearInterval(interval)
  }, [texto, done])

  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <div className="pulse-glow" style={{width:'56px', height:'56px', borderRadius:'50%', background:'linear-gradient(135deg,#ff6b9d,#c44569)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'24px'}}>💝</div>
        <h2 className="gradient-text" style={{fontSize:'22px', fontWeight:'700', margin:'0 0 4px'}}>Nossa história</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0'}}>Uma história escrita com amor</p>
      </div>
      <div style={{background:'rgba(15,52,96,0.6)', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid rgba(255,255,255,0.08)', minHeight:'120px'}}>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'1px'}}>Mensagem</p>
        <p style={{color:'rgba(255,255,255,0.9)', lineHeight:'1.8', fontSize:'15px', whiteSpace:'pre-wrap'}}>
          {typed}{!done && <span className="typing-cursor" />}
        </p>
      </div>
      {carta.como_se_conheceram && (
        <div style={{background:'rgba(15,52,96,0.6)', borderRadius:'16px', padding:'16px', marginBottom:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px'}}>Como nos conhecemos</p>
          <p style={{color:'rgba(255,255,255,0.8)', fontSize:'14px', lineHeight:'1.6'}}>{carta.como_se_conheceram}</p>
        </div>
      )}
      {carta.memoria_especial && (
        <div style={{background:'rgba(15,52,96,0.6)', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'1px'}}>Uma memória especial</p>
          <p style={{color:'rgba(255,255,255,0.8)', fontSize:'14px', lineHeight:'1.6'}}>{carta.memoria_especial}</p>
        </div>
      )}
    </div>
  )
}

function PaginaGaleria({ carta }: { carta: Carta }) {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const fotos = carta.fotos.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem)

  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <h2 className="gradient-text" style={{fontSize:'22px', fontWeight:'700', margin:'0 0 4px'}}>Galeria de Memórias</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0'}}>Momentos que ficam para sempre</p>
      </div>
      {fotos.length > 0 && (
        <div>
          <div style={{position:'relative', marginBottom:'12px', animation:'gallerySlide 0.8s cubic-bezier(0.34,1.56,0.64,1) backwards'}}>
            <img
              src={`${supabaseUrl}/storage/v1/object/public/fotos/${fotos[fotoAtiva].storage_path}`}
              alt="Memória"
              style={{width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'20px', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}
            />
            <div style={{position:'absolute', bottom:'12px', right:'12px', background:'rgba(0,0,0,0.6)', color:'#fff', fontSize:'12px', padding:'4px 10px', borderRadius:'20px'}}>
              {fotoAtiva + 1}/{fotos.length}
            </div>
          </div>
          {fotos.length > 1 && (
            <div style={{display:'flex', gap:'8px', overflowX:'auto', paddingBottom:'4px'}}>
              {fotos.map((foto, idx) => (
                <img
                  key={foto.id}
                  src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`}
                  alt="Mini"
                  onClick={() => setFotoAtiva(idx)}
                  style={{width:'64px', height:'64px', objectFit:'cover', borderRadius:'12px', cursor:'pointer', flexShrink:0, opacity: idx === fotoAtiva ? 1 : 0.5, border: idx === fotoAtiva ? '2px solid #ff6b9d' : '2px solid transparent', transition:'all 0.2s'}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PaginaContador({ carta }: { carta: Carta }) {
  const dias = carta.data_importante
    ? Math.floor((Date.now() - new Date(carta.data_importante).getTime()) / 86400000)
    : 0
  const [segundos, setSegundos] = useState(dias * 86400)

  useEffect(() => {
    const interval = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])

  const dataFormatada = carta.data_importante
    ? new Date(carta.data_importante).toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'})
    : ''

  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', textAlign:'center'}}>
      <div className="float-anim" style={{width:'72px', height:'72px', borderRadius:'50%', background:'linear-gradient(135deg,#ff6b9d,#c44569)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:'32px', boxShadow:'0 0 20px rgba(255,107,157,0.4)'}}>
        💕
      </div>
      <h2 style={{color:'#fff', fontSize:'22px', fontWeight:'900', margin:'0 0 4px'}}>Momento Especial</h2>
      <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0 0 24px'}}>Uma história escrita com amor</p>
      <div style={{background:'#0f3460', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom:'12px'}}>
          <span>📅</span>
          <p style={{color:'#fff', fontWeight:500, margin:0}}>Desde {dataFormatada}</p>
        </div>
        <div style={{height:'1px', background:'linear-gradient(to right, transparent, #ff6b9d, transparent)', margin:'0 0 12px'}} />
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'center', gap:'8px'}}>
          <span className="gradient-text" style={{fontSize:'52px', fontWeight:'900'}}>{dias.toLocaleString('pt-BR')}</span>
          <span style={{color:'#fff', fontWeight:600, fontSize:'20px'}}>dias juntos</span>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', marginBottom:'16px'}}>
        {[
          {v:(dias*24).toLocaleString('pt-BR'), l:'horas'},
          {v:(dias*24*60).toLocaleString('pt-BR'), l:'minutos'},
          {v:segundos.toLocaleString('pt-BR'), l:'segundos'},
        ].map(item => (
          <div key={item.l} style={{background:'#0f3460', borderRadius:'12px', padding:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
            <p className="gradient-text" style={{fontWeight:'bold', fontSize:'14px', margin:'0 0 4px'}}>{item.v}</p>
            <p style={{color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:0}}>{item.l}</p>
          </div>
        ))}
      </div>
      <p style={{color:'rgba(255,255,255,0.4)', fontSize:'13px', fontStyle:'italic'}}>
        "Cada segundo ao seu lado é uma eternidade de felicidade" 💝
      </p>
    </div>
  )
}

function PaginaMapaEstrelas({ carta }: { carta: Carta }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    if (!carta.data_importante) { setLoading(false); setErro(true); return }
    fetch('/api/mapa-estrelas', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({data: carta.data_importante, carta_id: carta.id}),
})
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setImageUrl(d.imageUrl); else setErro(true) })
      .catch(() => setErro(true))
      .finally(() => setLoading(false))
  }, [carta.data_importante])

  const dataFormatada = carta.data_importante
    ? new Date(carta.data_importante).toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'})
    : ''

  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', textAlign:'center'}}>
      <div style={{marginBottom:'16px'}}>
        <h2 className="gradient-text" style={{fontSize:'22px', fontWeight:'700', margin:'0 0 4px'}}>Mapa das Estrelas</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0'}}>O céu em {dataFormatada}</p>
      </div>
      {loading && (
        <div style={{padding:'48px 0'}}>
          <div style={{fontSize:'48px', marginBottom:'16px', animation:'float 2s ease-in-out infinite'}}>✨</div>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'14px'}}>Gerando seu mapa das estrelas...</p>
        </div>
      )}
      {erro && !loading && (
        <div style={{padding:'40px 0', color:'rgba(255,255,255,0.4)', fontSize:'14px'}}>
          Não foi possível gerar o mapa das estrelas.
        </div>
      )}
      {imageUrl && !loading && (
        <div>
          <div style={{borderRadius:'50%', overflow:'hidden', width:'280px', height:'280px', margin:'0 auto 16px', border:'3px solid rgba(255,107,157,0.3)', boxShadow:'0 0 40px rgba(255,107,157,0.2)'}}>
            <img src={imageUrl} alt="Mapa das Estrelas" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'13px', marginBottom:'8px'}}>
            O céu exatamente como estava nessa data especial
          </p>
          <p className="gradient-text" style={{fontWeight:600, fontSize:'14px'}}>✨ {dataFormatada} ✨</p>
        </div>
      )}
    </div>
  )
}

function PaginaJogoPalavras({ carta }: { carta: Carta }) {
  const palavras: string[] = []
  if (carta.jogo_palavra1?.trim()) palavras.push(carta.jogo_palavra1.trim())
  if (carta.jogo_palavra2?.trim()) palavras.push(carta.jogo_palavra2.trim())
  if (carta.jogo_palavra3?.trim()) palavras.push(carta.jogo_palavra3.trim())

  if (palavras.length === 0) {
    if (carta.nome_remetente) palavras.push(carta.nome_remetente)
    if (carta.nome_destinatario) palavras.push(carta.nome_destinatario)
    if (palavras.length < 3) palavras.push('amor')
  }

  const palavrasJogo = palavras.slice(0, 3)

  const [acertos, setAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [concluido, setConcluido] = useState(false)

  function tentar() {
    const p = tentativa.toLowerCase().trim()
    if (!p) return
    const lista = palavrasJogo.map(x => x.toLowerCase())
    if (lista.includes(p) && !acertos.includes(p)) {
      const novos = [...acertos, p]
      setAcertos(novos)
      setMensagem('Acertou! 🎉')
      if (novos.length === palavrasJogo.length) setConcluido(true)
    } else if (acertos.includes(p)) {
      setMensagem('Já descobriu essa! 😄')
    } else {
      setMensagem('Tente novamente! 🤔')
    }
    setTentativa('')
    setTimeout(() => setMensagem(''), 1500)
  }

  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <div style={{fontSize:'48px', marginBottom:'12px'}}>🎮</div>
        <h2 className="gradient-text" style={{fontSize:'22px', fontWeight:'700', margin:'0 0 4px'}}>Jogo de Palavras</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', margin:'0'}}>Descubra as 3 palavras especiais</p>
      </div>
      {concluido ? (
        <div style={{textAlign:'center', padding:'24px', background:'rgba(78,205,196,0.1)', borderRadius:'16px', border:'1px solid rgba(78,205,196,0.3)'}}>
          <div style={{fontSize:'48px', marginBottom:'12px'}}>🎊</div>
          <p style={{color:'#4ecdc4', fontWeight:'700', fontSize:'18px', margin:'0 0 8px'}}>Parabéns!</p>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:'14px', margin:0}}>Você descobriu todas as palavras!</p>
        </div>
      ) : (
        <>
          <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px', justifyContent:'center'}}>
            {palavrasJogo.map(p => (
              <div key={p} style={{
                padding:'10px 18px', borderRadius:'20px', fontSize:'14px', fontWeight:600,
                background: acertos.includes(p.toLowerCase()) ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : '#0f3460',
                color: acertos.includes(p.toLowerCase()) ? '#fff' : 'rgba(255,255,255,0.3)',
                border:'1px solid rgba(255,255,255,0.08)',
                boxShadow: acertos.includes(p.toLowerCase()) ? '0 4px 20px rgba(255,107,157,0.35)' : 'none',
                transition:'all 0.3s',
                letterSpacing: acertos.includes(p.toLowerCase()) ? '0' : '4px',
              }}>
                {acertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
            <input
              type="text"
              value={tentativa}
              onChange={e => setTentativa(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tentar()}
              placeholder="Digite uma palavra..."
              style={{flex:1, background:'#0f3460', color:'#fff', borderRadius:'12px', padding:'14px 16px', outline:'none', border:'2px dashed rgba(255,107,157,0.5)', fontSize:'14px', letterSpacing:'2px'}}
            />
            <button onClick={tentar} style={{background:'linear-gradient(135deg,#ff6b9d,#c44569)', color:'#fff', padding:'14px 20px', borderRadius:'12px', border:'none', cursor:'pointer', fontWeight:700, fontSize:'18px'}}>→</button>
          </div>
          {mensagem && (
            <p style={{textAlign:'center', fontSize:'14px', fontWeight:600, color: mensagem.includes('Acertou') ? '#4ecdc4' : '#ff6b9d', animation:'fadeInUp 0.3s ease'}}>
              {mensagem}
            </p>
          )}
          <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'16px'}}>
            {acertos.length}/{palavrasJogo.length} palavras descobertas
          </p>
        </>
      )}
    </div>
  )
}

function PaginaResumo({ carta }: { carta: Carta }) {
  const dias = carta.data_importante
    ? Math.floor((Date.now() - new Date(carta.data_importante).getTime()) / 86400000)
    : 0
  const dataFormatada = carta.data_importante
    ? new Date(carta.data_importante).toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'})
    : ''

  return (
    <div style={{width:'100%', borderRadius:'32px', padding:'32px 24px', color:'white', textAlign:'center', background:'linear-gradient(135deg, #ff6b9d 0%, #c44569 25%, #667eea 50%, #764ba2 75%, #f093fb 100%)', backgroundSize:'400% 400%', animation:'gradientShift 15s ease infinite', boxShadow:'0 20px 60px rgba(0,0,0,0.8)'}}>
      <div style={{background:'linear-gradient(180deg, #1c1c1c 0%, #111111 100%)', borderRadius:'24px', padding:'28px 20px'}}>
        <div style={{display:'inline-block', background:'linear-gradient(135deg,#ff6b9d,#c44569)', color:'white', padding:'6px 12px', borderRadius:'20px', fontSize:'10px', fontWeight:700, letterSpacing:'1px', marginBottom:'16px'}}>
          WRAPPED DO CASAL
        </div>
        <div style={{fontSize:'64px', marginBottom:'16px'}}>👫</div>
        <h2 className="gradient-text" style={{fontSize:'24px', fontWeight:'800', margin:'0 0 8px'}}>Nossa Conexão</h2>
        <p style={{color:'rgba(255,255,255,0.7)', fontWeight:600, margin:'0 0 20px', fontSize:'15px'}}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </p>
        {carta.como_se_conheceram && (
          <div style={{background:'rgba(42,42,42,0.6)', borderRadius:'16px', padding:'14px 16px', marginBottom:'12px', border:'1px solid rgba(255,107,157,0.1)', fontSize:'14px', color:'rgba(255,255,255,0.9)', lineHeight:'1.5', textAlign:'left'}}>
            {carta.como_se_conheceram}
          </div>
        )}
        <div style={{background:'rgba(42,42,42,0.6)', borderRadius:'16px', padding:'14px 16px', marginBottom:'20px', border:'1px solid rgba(255,107,157,0.1)'}}>
          <p style={{color:'rgba(255,255,255,0.5)', fontSize:'12px', margin:'0 0 4px'}}>Data especial</p>
          <p className="gradient-text" style={{fontWeight:600, fontSize:'16px', margin:0}}>{dataFormatada}</p>
        </div>
        <div style={{background:'linear-gradient(135deg, rgba(255,107,157,0.1), rgba(196,69,105,0.1))', borderRadius:'16px', padding:'20px', border:'1px solid rgba(255,107,157,0.2)', marginBottom:'20px'}}>
          <span className="gradient-text" style={{fontSize:'64px', fontWeight:'900', display:'block', lineHeight:1, marginBottom:'4px'}}>
            {dias.toLocaleString('pt-BR')}
          </span>
          <p style={{color:'rgba(255,255,255,0.6)', fontSize:'14px', margin:0}}>dias juntos</p>
        </div>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'12px', margin:0}}>
          Criado com amor no <span style={{color:'#ff6b9d', fontWeight:600}}>Lovefy</span>
        </p>
      </div>
    </div>
  )
}

function PaginaFinal({ carta }: { carta: Carta }) {
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.4)', position:'relative', overflow:'hidden'}}>
      {['10%','30%','60%','80%'].map((left, i) => (
        <div key={i} style={{position:'absolute', left, bottom:0, fontSize:'20px', opacity:0.15, animation:`floatUp ${8+i*2}s ease-in-out infinite`, animationDelay:`${i*2}s`}}>💕</div>
      ))}
      <div style={{marginBottom:'24px', position:'relative', zIndex:1}}>
        <div style={{width:'80px', height:'80px', margin:'0 auto'}}>
          <svg viewBox="0 0 100 100" style={{width:'100%', height:'100%'}}>
            <defs>
              <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff6b9d"/>
                <stop offset="50%" stopColor="#c44569"/>
                <stop offset="100%" stopColor="#ff8a5c"/>
              </linearGradient>
            </defs>
            <path d="M50 88 C20 60 5 45 5 30 C5 15 17 5 32 5 C42 5 50 12 50 12 C50 12 58 5 68 5 C83 5 95 15 95 30 C95 45 80 60 50 88Z" fill="url(#hg)"/>
            <rect x="30" y="35" width="40" height="28" rx="3" fill="rgba(255,255,255,0.95)"/>
            <path d="M30 38 L50 52 L70 38" stroke="#ff8a5c" strokeWidth="3" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div style={{background:'rgba(255,255,255,0.02)', borderRadius:'20px', padding:'24px', border:'1px solid rgba(255,255,255,0.06)', position:'relative', zIndex:1, marginBottom:'16px'}}>
        <div style={{position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(to right, #ff6b9d, #c44569, #ff8a5c)', borderRadius:'20px 20px 0 0'}} />
        <p style={{color:'rgba(255,255,255,0.5)', fontSize:'16px', fontWeight:300, margin:'0 0 8px'}}>Essa carta foi criada com</p>
        <h1 className="gradient-text" style={{fontSize:'48px', fontWeight:'900', margin:'0 0 24px', letterSpacing:'-1px'}}>Lovefy</h1>
        <p style={{color:'#fff', fontSize:'16px', fontWeight:500, margin:'0 0 20px', lineHeight:'1.5'}}>
          Crie uma carta para alguém especial também
        </p>
        <a href="https://lovefy.app.br/criar" className="pulse-glow" style={{display:'block', background:'linear-gradient(135deg,#ff6b9d,#c44569)', color:'#fff', padding:'16px', borderRadius:'16px', textDecoration:'none', fontWeight:700, fontSize:'16px', marginBottom:'12px', boxShadow:'0 4px 20px rgba(255,107,157,0.35)'}}>
          💝 Criar minha carta
        </a>
        <button onClick={() => window.location.reload()} style={{width:'100%', padding:'16px', borderRadius:'16px', color:'#fff', fontWeight:500, border:'2px solid rgba(255,255,255,0.2)', background:'transparent', cursor:'pointer', fontSize:'15px', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px'}}>
          🔄 Ver novamente
        </button>
      </div>
      <p style={{color:'rgba(255,255,255,0.3)', fontSize:'13px', position:'relative', zIndex:1}}>
        Transformando palavras em momentos inesquecíveis ✨
      </p>
    </div>
  )
}