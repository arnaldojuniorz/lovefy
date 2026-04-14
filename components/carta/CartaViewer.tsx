'use client'

import { useState, useEffect, useRef } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0D0D0D; font-family: 'Inter', sans-serif; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
  @keyframes scaleIn  { from { opacity:0; transform:scale(0.9) }       to { opacity:1; transform:scale(1) } }
  @keyframes pulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
  @keyframes blink    { 0%,49% { opacity:1 } 50%,100% { opacity:0 } }
  @keyframes gradAnim { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
  @keyframes zoomSlow { from { transform:scale(1.05) } to { transform:scale(1) } }
  @keyframes burst    { 0% { transform:scale(0) translateY(0); opacity:1 } 100% { transform:scale(2) translateY(-60px); opacity:0 } }
  @keyframes sealPop  { from { opacity:0; transform:scale(0.5) rotate(-12deg) } to { opacity:1; transform:scale(1) rotate(0deg) } }

  .fu  { animation: fadeUp 0.7s ease both; }
  .si  { animation: scaleIn 0.6s cubic-bezier(.34,1.56,.64,1) both; }
  .pb  { animation: pulse 2s ease-in-out infinite; }
  .cur { display:inline-block; width:2px; height:1em; background:#fff; margin-left:2px; animation:blink .8s infinite; vertical-align:text-bottom; }

  .grad-pill {
    background: linear-gradient(135deg,#FF2D7A,#7928FF);
    background-size:200% 200%;
    animation: gradAnim 4s ease infinite;
  }

  .section-card {
    border-radius: 20px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  ::-webkit-scrollbar { display:none; }
  * { scrollbar-width:none; }
`

export default function CartaViewer({ carta }: { carta: Carta }) {
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a,b) => a.ordem - b.ordem) || []
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null
  const spotifyId = getSpotifyId(carta.musica_link)

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', paddingBottom:48 }}>
      <style>{STYLES}</style>
      <HeroSection carta={carta} fotoUrl={fotoUrl} />
      <div style={{ padding:'0 12px' }}>
        <PlayerSection carta={carta} fotoUrl={fotoUrl} spotifyId={spotifyId} />
        <ContadorSection carta={carta} fotoUrl={fotoUrl} />
        {carta.recursos.includes('mapa_estrelas') && <MapaSection carta={carta} />}
        {fotos.length > 0 && carta.recursos.includes('galeria') && <GaleriaSection carta={carta} fotos={fotos} />}
        {carta.recursos.includes('jogo_palavras') && <JogoSection carta={carta} />}
        <MensagemSection carta={carta} />
        <CTASection carta={carta} />
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ carta, fotoUrl }: { carta: Carta; fotoUrl: string | null }) {
  return (
    <div style={{ position:'relative', height:'100vh', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Fundo foto ou gradiente */}
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className="zoom-slow"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.35)' }} />
      ) : (
        <div className="grad-pill" style={{ position:'absolute', inset:0 }} />
      )}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, #0D0D0D 0%, rgba(13,13,13,0.4) 50%, rgba(13,13,13,0.2) 100%)' }} />

      {/* Top bar */}
      <div style={{ position:'relative', zIndex:10, display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px 0' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'rgba(255,255,255,0.12)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:16 }}>✕</div>
        <div className="grad-pill" style={{ color:'#fff', fontWeight:800, fontSize:12, padding:'5px 14px', borderRadius:100, fontFamily:'Poppins, sans-serif', letterSpacing:1 }}>
          Wrapped
        </div>
        <div style={{ width:36 }} />
      </div>

      {/* Conteúdo central */}
      <div className="fu" style={{ position:'relative', zIndex:10, flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0 28px', textAlign:'center' }}>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:13, letterSpacing:2, textTransform:'uppercase', marginBottom:20, fontFamily:'Inter, sans-serif' }}>
          {carta.nome_remetente} preparou algo para você
        </p>
        <h1 style={{ fontFamily:'Poppins, sans-serif', fontSize:'clamp(40px,10vw,68px)', fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:16 }}>
          {carta.nome_destinatario}
        </h1>
        <p style={{ color:'rgba(255,255,255,0.5)', fontSize:16, fontFamily:'Inter, sans-serif', fontWeight:300, maxWidth:280, lineHeight:1.6 }}>
          Um presente feito só para você.
        </p>
      </div>

      {/* Scroll hint */}
      <div style={{ position:'relative', zIndex:10, textAlign:'center', paddingBottom:32 }}>
        <p style={{ color:'rgba(255,255,255,0.25)', fontSize:12, marginBottom:8 }}>Role para ver</p>
        <div style={{ width:2, height:24, background:'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)', margin:'0 auto', borderRadius:2 }} />
      </div>
    </div>
  )
}

// ─── PLAYER ───────────────────────────────────────────────────────────────────
function PlayerSection({ carta, fotoUrl, spotifyId }: { carta: Carta; fotoUrl: string | null; spotifyId: string | null }) {
  const [tocando, setTocando] = useState(false)

  return (
    <div className="section-card" style={{ background:'#1A1A1A', marginBottom:12 }}>
      {/* Foto ocupando 60% */}
      <div style={{ position:'relative', height:280, overflow:'hidden' }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        ) : (
          <div className="grad-pill" style={{ width:'100%', height:'100%' }} />
        )}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, #1A1A1A 0%, transparent 60%)' }} />
        {/* Top bar estilo player */}
        <div style={{ position:'absolute', top:16, left:16, right:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:20 }}>↓</span>
          <span style={{ color:'#fff', fontWeight:700, fontSize:14, fontFamily:'Inter, sans-serif' }}>Juntos para sempre ❤️</span>
          <span style={{ color:'rgba(255,255,255,0.6)', fontSize:18 }}>···</span>
        </div>
      </div>

      {/* Info + Player */}
      <div style={{ padding:'0 20px 24px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
          <div>
            <p style={{ color:'#fff', fontWeight:700, fontSize:20, fontFamily:'Poppins, sans-serif', marginBottom:4 }}>
            </p>
            <p style={{ color:'rgba(255,255,255,0.45)', fontSize:14 }}>{carta.nome_remetente} & {carta.nome_destinatario}</p>
          </div>
          <div style={{ width:36, height:36, borderRadius:'50%', border:'2px solid rgba(255,45,122,0.6)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#FF2D7A', fontSize:14 }}>✓</span>
          </div>
        </div>

        {/* Barra de progresso decorativa */}
        <div style={{ height:4, background:'rgba(255,255,255,0.1)', borderRadius:2, marginBottom:8, overflow:'hidden' }}>
          <div style={{ height:'100%', width:'30%', background:'linear-gradient(90deg,#FF2D7A,#7928FF)', borderRadius:2 }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>0:05</span>
          <span style={{ color:'rgba(255,255,255,0.3)', fontSize:11 }}>-4:42</span>
        </div>

        {/* Controles */}
        {spotifyId && !tocando && (
          <div style={{ display:'flex', justifyContent:'center', gap:32, alignItems:'center' }}>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:20 }}>⇄</span>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:24 }}>⏮</span>
            <button onClick={() => setTocando(true)} className="pb"
              style={{ width:64, height:64, borderRadius:'50%', background:'#fff', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 20px rgba(255,45,122,0.4)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#0D0D0D"><path d="M8 5v14l11-7z"/></svg>
            </button>
            <span style={{ color:'rgba(255,255,255,0.6)', fontSize:24 }}>⏭</span>
            <span style={{ color:'rgba(255,255,255,0.4)', fontSize:20 }}>↻</span>
          </div>
        )}

        {spotifyId && tocando && (
          <iframe src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`}
            width="100%" height="80" frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            style={{ borderRadius:12, display:'block' }} />
        )}

        {!spotifyId && carta.musica_link && (
          <a href={carta.musica_link} target="_blank" rel="noopener noreferrer"
            style={{ display:'block', textAlign:'center', padding:'14px', borderRadius:100, background:'linear-gradient(135deg,#FF2D7A,#7928FF)', color:'#fff', fontWeight:600, textDecoration:'none', fontSize:15 }}>
            Abrir no Spotify
          </a>
        )}
      </div>
    </div>
  )
}

// ─── CONTADOR ─────────────────────────────────────────────────────────────────
function ContadorSection({ carta, fotoUrl }: { carta: Carta; fotoUrl: string | null }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const ano = carta.data_importante ? new Date(carta.data_importante).getUTCFullYear() : ''

  useEffect(() => {
    const t = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(t)
  }, [carta.data_importante])

  return (
    <div className="section-card" style={{ background:'#1A1A1A' }}>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:600, padding:'20px 20px 12px' }}>Sobre o casal</p>
      {fotoUrl && (
        <div style={{ height:200, overflow:'hidden', margin:'0 12px', borderRadius:14 }}>
          <img src={fotoUrl} alt="Casal" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      )}
      <div style={{ padding:'16px 20px 20px' }}>
        <h2 style={{ color:'#fff', fontSize:22, fontWeight:800, fontFamily:'Poppins, sans-serif', marginBottom:4 }}>
          {carta.nome_remetente} e {carta.nome_destinatario}
        </h2>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:13, marginBottom:20 }}>Juntos desde {ano}</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
          {[{ v:tempo.anos, l:'Anos' }, { v:tempo.meses, l:'Meses' }, { v:tempo.dias, l:'Dias' }].map(i => (
            <div key={i.l} style={{ background:'#262626', borderRadius:12, padding:'14px 8px', textAlign:'center' }}>
              <p style={{ color:'#fff', fontSize:30, fontWeight:800, fontFamily:'Poppins, sans-serif', lineHeight:1 }}>{i.v}</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:4 }}>{i.l}</p>
            </div>
          ))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>
          {[
            { v:String(tempo.horas).padStart(2,'0'), l:'Horas' },
            { v:String(tempo.minutos).padStart(2,'0'), l:'Minutos' },
            { v:String(tempo.segundos).padStart(2,'0'), l:'Segundos' },
          ].map(i => (
            <div key={i.l} style={{ background:'#262626', borderRadius:12, padding:'14px 8px', textAlign:'center' }}>
              <p style={{ color:'#fff', fontSize:24, fontWeight:800, fontVariantNumeric:'tabular-nums', fontFamily:'Poppins, sans-serif', lineHeight:1 }}>{i.v}</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:4 }}>{i.l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── MAPA DAS ESTRELAS ────────────────────────────────────────────────────────
function MapaSection({ carta }: { carta: Carta }) {
  const [mapaUrl, setMapaUrl] = useState(carta.mapa_estrelas_url || '')
  const [loading, setLoading] = useState(!carta.mapa_estrelas_url)
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null

  useEffect(() => {
    if (carta.mapa_estrelas_url) return
    fetch('/api/mapa-estrelas', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ data:carta.data_importante, carta_id:carta.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setMapaUrl(d.imageUrl) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="section-card" style={{ background:'#0D0D1F', padding:'24px 20px', textAlign:'center' }}>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>O céu no dia de vocês</p>
      {loading && <p style={{ color:'rgba(255,255,255,0.3)', fontSize:14, marginBottom:16 }}>Gerando mapa das estrelas…</p>}
      {mapaUrl && (
        <div style={{ width:200, height:200, borderRadius:'50%', overflow:'hidden', margin:'0 auto 16px', border:'2px solid rgba(121,40,255,0.5)', boxShadow:'0 0 40px rgba(121,40,255,0.3)' }}>
          <img src={mapaUrl} alt="Mapa das estrelas" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      )}
      {estacao && (
        <div>
          <p style={{ color:'#fff', fontSize:15, fontWeight:600 }}>{estacao.emoji} {estacao.nome}</p>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:13, marginTop:4 }}>{formatarData(carta.data_importante)}</p>
        </div>
      )}
    </div>
  )
}

// ─── GALERIA ──────────────────────────────────────────────────────────────────
const FOTO_LABELS = ['Nossos Dates','Fotos aleatórias','Primeira viagem','Momentos','Favoritas']

function GaleriaSection({ carta, fotos }: { carta: Carta; fotos: Carta['fotos'] }) {
  return (
    <div className="section-card" style={{ background:'#1A1A1A', padding:'20px 0 20px' }}>
      <p style={{ color:'#fff', fontSize:18, fontWeight:700, fontFamily:'Poppins, sans-serif', padding:'0 20px', marginBottom:16 }}>
        Conheça {carta.nome_remetente} e {carta.nome_destinatario}
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:3, padding:'0 12px' }}>
        {fotos.map((foto, idx) => (
          <div key={foto.id} style={{ position:'relative', aspectRatio:'1', borderRadius:10, overflow:'hidden' }}>
            <img src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto"
              style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 8px 8px', background:'linear-gradient(to top,rgba(0,0,0,0.75),transparent)' }}>
              <p style={{ color:'#fff', fontSize:10, fontWeight:600, lineHeight:1.2 }}>{FOTO_LABELS[idx] || ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── JOGO DE PALAVRAS ─────────────────────────────────────────────────────────
function JogoSection({ carta }: { carta: Carta }) {
  const palavras = [carta.jogo_palavra1?.trim(), carta.jogo_palavra2?.trim(), carta.jogo_palavra3?.trim()].filter(Boolean) as string[]
  if (palavras.length === 0) palavras.push(carta.nome_remetente, carta.nome_destinatario, 'amor')

  const [acertos, setAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [msg, setMsg] = useState('')
  const [finalizado, setFinalizado] = useState(false)

  function tentar() {
    const p = tentativa.toLowerCase().trim()
    if (!p) return
    if (palavras.map(x => x.toLowerCase()).includes(p) && !acertos.includes(p)) {
      const novos = [...acertos, p]
      setAcertos(novos)
      setMsg('Acertou! 🎉')
      if (novos.length === palavras.length) setFinalizado(true)
    } else if (acertos.includes(p)) {
      setMsg('Já descobriu essa!')
    } else {
      setMsg('Tente novamente!')
    }
    setTentativa('')
    setTimeout(() => setMsg(''), 1500)
  }

  return (
    <div className="section-card" style={{ background:'#1A1A1A', padding:'20px' }}>
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Jogo de palavras</p>
      {finalizado ? (
        <div style={{ textAlign:'center', padding:'16px 0' }}>
          <div style={{ fontSize:36, marginBottom:8 }}>🎊</div>
          <p style={{ color:'#FF2D7A', fontWeight:700, fontSize:16 }}>Você descobriu tudo!</p>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:13, marginTop:4 }}>Só você saberia isso.</p>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:16 }}>
            {palavras.map(p => (
              <div key={p} style={{ background:'#262626', borderRadius:12, padding:'14px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', border:`1px solid ${acertos.includes(p.toLowerCase()) ? 'rgba(255,45,122,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                <div>
                  <p style={{ color:acertos.includes(p.toLowerCase()) ? '#FF2D7A' : 'rgba(255,255,255,0.2)', fontSize:16, fontWeight:700, letterSpacing:acertos.includes(p.toLowerCase()) ? 0 : 5, fontFamily:'Poppins, sans-serif' }}>
                    {acertos.includes(p.toLowerCase()) ? p : '•'.repeat(p.length)}
                  </p>
                  {!acertos.includes(p.toLowerCase()) && (
                    <p style={{ color:'rgba(255,255,255,0.2)', fontSize:11, marginTop:2 }}>Dica: {p.length} letras</p>
                  )}
                </div>
                {acertos.includes(p.toLowerCase()) && <span style={{ color:'#FF2D7A', fontSize:16 }}>✓</span>}
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tentar()}
              placeholder="Digite uma palavra…"
              style={{ flex:1, background:'#262626', color:'#fff', borderRadius:12, padding:'12px 16px', outline:'none', border:'1px solid rgba(255,255,255,0.08)', fontSize:14, fontFamily:'Inter, sans-serif' }} />
            <button onClick={tentar}
              style={{ background:'linear-gradient(135deg,#FF2D7A,#7928FF)', color:'#fff', padding:'12px 18px', borderRadius:12, border:'none', cursor:'pointer', fontWeight:700, fontSize:16 }}>→</button>
          </div>
          {msg && <p style={{ color:msg.includes('Acertou') ? '#FF2D7A' : 'rgba(255,255,255,0.4)', fontSize:13, marginTop:8, textAlign:'center' }}>{msg}</p>}
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:12, marginTop:8, textAlign:'center' }}>{acertos.length}/{palavras.length} descobertas</p>
        </>
      )}
    </div>
  )
}

// ─── MENSAGEM ─────────────────────────────────────────────────────────────────
function MensagemSection({ carta }: { carta: Carta }) {
  const [mostrar, setMostrar] = useState(false)
  const preview = carta.mensagem_principal?.slice(0, 100) || ''
  const temMais = (carta.mensagem_principal?.length || 0) > 100

  return (
    <div className="section-card" style={{ background:'linear-gradient(135deg,#1A2744,#1A1A1A)', padding:'20px' }}>
      <p style={{ color:'rgba(255,255,255,0.5)', fontSize:13, fontWeight:600, marginBottom:16 }}>Mensagem especial</p>
      <div style={{ position:'relative', marginBottom:mostrar ? 0 : 20 }}>
        <p style={{ color:'#fff', fontSize:20, fontWeight:700, lineHeight:1.5, fontFamily:'Poppins, sans-serif' }}>
          {mostrar ? carta.mensagem_principal : preview + (temMais && !mostrar ? '...' : '')}
        </p>
        {!mostrar && temMais && (
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:60, background:'linear-gradient(to bottom,transparent,#1A2744)' }} />
        )}
      </div>
      {!mostrar && temMais && (
        <button onClick={() => setMostrar(true)}
          style={{ background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', padding:'12px 24px', borderRadius:100, fontWeight:600, fontSize:14, cursor:'pointer', fontFamily:'Inter, sans-serif' }}>
          Mostrar Mensagem
        </button>
      )}
    </div>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CTASection({ carta }: { carta: Carta }) {
  const [copiado, setCopiado] = useState(false)
  const [clicou, setClicou] = useState(false)
  const [particulas, setParticulas] = useState<{ id:number; x:number; cor:string }[]>([])
  const url = `https://www.lovefy.app.br/c/${carta.slug}`
  const hoje = new Date().toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'numeric' })

  function handleBotao() {
    if (clicou) return
    setClicou(true)
    const ps = Array.from({ length:16 }, (_, i) => ({
      id:i, x:Math.random() * 100,
      cor:['#FF2D7A','#7928FF','#FFD700','#00F0FF'][Math.floor(Math.random() * 4)],
    }))
    setParticulas(ps)
    setTimeout(() => setParticulas([]), 1800)
  }

  function compartilharWpp() {
    const texto = `${carta.nome_remetente} criou algo especial para ${carta.nome_destinatario}! Ver aqui: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div className="section-card" style={{ background:'#1A1A1A', padding:'28px 20px', position:'relative', overflow:'hidden', textAlign:'center' }}>
      {particulas.map(p => (
        <div key={p.id} style={{ position:'absolute', bottom:'50%', left:`${p.x}%`, width:7, height:7, borderRadius:'50%', background:p.cor, animation:'burst 1.5s ease forwards', pointerEvents:'none' }} />
      ))}

      {!clicou ? (
        <>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:12, letterSpacing:2, textTransform:'uppercase', marginBottom:16 }}>Quer criar uma carta?</p>
          <p style={{ color:'#fff', fontSize:20, fontWeight:700, fontFamily:'Poppins, sans-serif', lineHeight:1.3, marginBottom:28 }}>
            Como {carta.nome_remetente} fez<br/>por {carta.nome_destinatario}.
          </p>
          <button onClick={handleBotao} className="pb"
            style={{ width:'100%', padding:'18px', borderRadius:100, background:'linear-gradient(135deg,#FF2D7A,#7928FF)', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:16, marginBottom:12, fontFamily:'Poppins, sans-serif', boxShadow:'0 4px 24px rgba(255,45,122,0.4)' }}>
            Criar minha carta
          </button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <button onClick={compartilharWpp}
              style={{ padding:'14px', borderRadius:100, background:'#25D366', color:'#fff', border:'none', cursor:'pointer', fontWeight:600, fontSize:14, fontFamily:'Inter, sans-serif' }}>
              WhatsApp
            </button>
            <button onClick={copiar}
              style={{ padding:'14px', borderRadius:100, background:'rgba(255,255,255,0.06)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontWeight:600, fontSize:14, fontFamily:'Inter, sans-serif' }}>
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </>
      ) : (
        <div className="si">
          <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.3)', borderRadius:16, padding:'14px 20px', marginBottom:20, display:'inline-block', animation:'sealPop 0.6s ease forwards' }}>
            <p style={{ color:'#FFD700', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>✦ Carta entregue</p>
            <p style={{ color:'rgba(255,215,0,0.6)', fontSize:12 }}>Estrela registrada · {hoje}</p>
          </div>
          <p style={{ color:'#fff', fontSize:18, fontWeight:700, fontFamily:'Poppins, sans-serif', marginBottom:6 }}>
            {carta.nome_remetente} & {carta.nome_destinatario}
          </p>
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:14, marginBottom:24 }}>Compartilhe este Wrapped</p>
          <button onClick={compartilharWpp}
            style={{ width:'100%', padding:'16px', borderRadius:100, background:'#25D366', color:'#fff', border:'none', cursor:'pointer', fontWeight:700, fontSize:15, marginBottom:10, fontFamily:'Inter, sans-serif' }}>
            WhatsApp
          </button>
          <button onClick={copiar}
            style={{ width:'100%', padding:'14px', borderRadius:100, background:'rgba(255,255,255,0.06)', color:'#fff', border:'1px solid rgba(255,255,255,0.1)', cursor:'pointer', fontWeight:600, fontSize:14, marginBottom:24, fontFamily:'Inter, sans-serif' }}>
            {copiado ? '✓ Link copiado!' : 'Copiar link'}
          </button>
          <a href="https://www.lovefy.app.br/criar"
            style={{ display:'inline-block', padding:'12px 28px', borderRadius:100, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.5)', fontSize:14, textDecoration:'none', fontFamily:'Inter, sans-serif' }}>
            Criar minha carta
          </a>
        </div>
      )}
    </div>
  )
}