'use client'

import { useState, useEffect } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

function fotoStorageUrl(path: string) {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${supabaseUrl}/storage/v1/object/public/fotos/${path}`
}

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body { background: #0D0D0D; font-family: 'Inter', sans-serif; }

  @keyframes fadeUp   { from { opacity:0; transform:translateY(28px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulse    { 0%,100% { transform:scale(1) } 50% { transform:scale(1.05) } }
  @keyframes gradAnim { 0%,100% { background-position:0% 50% } 50% { background-position:100% 50% } }
  @keyframes zoomSlow { from { transform:scale(1.06) } to { transform:scale(1) } }
  @keyframes shimmer  { 0% { opacity:0.5 } 50% { opacity:1 } 100% { opacity:0.5 } }
  @keyframes starGlow { 0%,100% { box-shadow: 0 0 40px rgba(121,40,255,0.4), 0 0 80px rgba(121,40,255,0.2) } 50% { box-shadow: 0 0 60px rgba(121,40,255,0.7), 0 0 120px rgba(255,45,122,0.3) } }
  @keyframes lightboxIn { from { opacity:0; transform:scale(0.92) } to { opacity:1; transform:scale(1) } }
  @keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }

  .fu        { animation: fadeUp 0.7s ease both; }
  .pb        { animation: pulse 2s ease-in-out infinite; }
  .shim      { animation: shimmer 2s ease-in-out infinite; }
  .star-glow { animation: starGlow 3s ease-in-out infinite; }
  .spin      { animation: spin 8s linear infinite; }

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
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []

  const fotoDestaqueUrl = carta.foto_destaque
    ? fotoStorageUrl(carta.foto_destaque)
    : fotos.length > 0
      ? fotoStorageUrl(fotos[0].storage_path)
      : null

  const spotifyId = getSpotifyId(carta.musica_link)

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', paddingBottom: 48 }}>
      <style>{STYLES}</style>
      <HeroSection carta={carta} fotoUrl={fotoDestaqueUrl} />
      <div style={{ padding: '0 12px' }}>
        <PlayerSection carta={carta} fotoUrl={fotoDestaqueUrl} spotifyId={spotifyId} />
        <ContadorSection carta={carta} />
        {carta.recursos.includes('mapa_estrelas') && <MapaSection carta={carta} />}
        {fotos.length > 0 && carta.recursos.includes('galeria') && <GaleriaSection carta={carta} fotos={fotos} />}
        <MensagemSection carta={carta} />
        {carta.recursos.includes('jogo_palavras') && <JogoSection carta={carta} />}
        <WrappedCard carta={carta} fotoUrl={fotoDestaqueUrl} />
        <CTASection carta={carta} />
      </div>
    </div>
  )
}

// ─── HERO ─────────────────────────────────────────────────────────────────────
function HeroSection({ carta, fotoUrl }: { carta: Carta; fotoUrl: string | null }) {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {fotoUrl ? (
        <img src={fotoUrl} alt="" className="zoom-slow"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.3)' }} />
      ) : (
        <div className="grad-pill" style={{ position: 'absolute', inset: 0 }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #0D0D0D 0%, rgba(13,13,13,0.5) 50%, rgba(13,13,13,0.15) 100%)' }} />

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 0' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 15 }}>✕</div>
        <div className="grad-pill" style={{ color: '#fff', fontWeight: 800, fontSize: 12, padding: '5px 16px', borderRadius: 100, fontFamily: 'Poppins, sans-serif', letterSpacing: 1 }}>
          Wrapped
        </div>
        <div style={{ width: 36 }} />
      </div>

      <div className="fu" style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 28px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
          {carta.nome_remetente} preparou algo para você
        </p>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(40px,10vw,68px)', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginBottom: 16 }}>
          {carta.nome_destinatario}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 16, fontWeight: 300, maxWidth: 280, lineHeight: 1.6 }}>
          Um presente feito só para você.
        </p>
      </div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', paddingBottom: 32 }}>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginBottom: 6 }}>Role para ver</p>
        <div style={{ width: 2, height: 20, background: 'linear-gradient(to bottom,rgba(255,255,255,0.3),transparent)', margin: '0 auto', borderRadius: 2 }} />
      </div>
    </div>
  )
}

// ─── PLAYER CUSTOMIZADO ───────────────────────────────────────────────────────
function PlayerSection({ carta, fotoUrl, spotifyId }: { carta: Carta; fotoUrl: string | null; spotifyId: string | null }) {
  const [tocando, setTocando] = useState(false)
  const [progresso, setProgresso] = useState(5)

  useEffect(() => {
    if (!tocando) return
    const t = setInterval(() => setProgresso(p => p < 95 ? p + 0.04 : p), 1000)
    return () => clearInterval(t)
  }, [tocando])

  function togglePlay() {
    if (spotifyId) {
      setTocando(t => !t)
    } else if (carta.musica_link) {
      window.open(carta.musica_link, '_blank')
    }
  }

  return (
    <div className="section-card" style={{ background: 'linear-gradient(180deg, #1a4a6e 0%, #0d2d45 100%)', position: 'relative' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px 20px' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>↓</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Juntos para sempre ❤️</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>···</span>
      </div>

      {/* ✅ Foto do casal como capa — gira ao tocar */}
      <div style={{ margin: '0 16px 24px', borderRadius: 16, overflow: 'hidden', aspectRatio: '1', background: '#0d2d45', transition: 'border-radius 0.4s' }}
        className={tocando ? 'spin' : ''}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="grad-pill" style={{ width: '100%', height: '100%' }} />
        )}
      </div>

      {/* Nome + artista */}
      <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 800, fontSize: 22, fontFamily: 'Poppins, sans-serif', lineHeight: 1.2, marginBottom: 4 }}>
            Nossa música
          </p>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15 }}>
            {carta.nome_remetente} & {carta.nome_destinatario}
          </p>
        </div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#fff', fontSize: 14 }}>✓</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div style={{ padding: '0 20px', marginBottom: 20 }}>
        <div style={{ height: 4, background: 'rgba(255,255,255,0.15)', borderRadius: 2, position: 'relative' }}>
          <div style={{ height: '100%', width: `${tocando ? progresso : 5}%`, background: '#fff', borderRadius: 2, position: 'relative', transition: 'width 1s linear' }}>
            <div style={{ position: 'absolute', right: -5, top: '50%', transform: 'translateY(-50%)', width: 10, height: 10, borderRadius: '50%', background: '#fff' }} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{tocando ? '0:21' : '0:00'}</span>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>-4:26</span>
        </div>
      </div>

      {/* Controles */}
      <div style={{ padding: '0 20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: tocando ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 20, padding: 8 }}>⇄</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 28, padding: 8 }}>⏮</button>

        <button onClick={togglePlay}
          style={{ width: 68, height: 68, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.5)', flexShrink: 0 }}>
          {tocando
            ? <svg width="22" height="22" viewBox="0 0 24 24" fill="#0d2d45"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            : <svg width="22" height="22" viewBox="0 0 24 24" fill="#0d2d45"><path d="M8 5v14l11-7z" /></svg>
          }
        </button>

        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)', fontSize: 28, padding: 8 }}>⏭</button>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: tocando ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 20, padding: 8 }}>↻</button>
      </div>

      {/* ✅ Iframe Spotify invisível — só toca o áudio, não aparece na tela */}
      {spotifyId && tocando && (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`}
          width="1" height="1" frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', bottom: 0, left: 0 }}
        />
      )}
    </div>
  )
}

// ─── CONTADOR ─────────────────────────────────────────────────────────────────
function ContadorSection({ carta }: { carta: Carta }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const ano = carta.data_importante ? new Date(carta.data_importante).getUTCFullYear() : ''

  useEffect(() => {
    const t = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(t)
  }, [carta.data_importante])

  return (
    <div className="section-card" style={{ background: '#1A1A1A', padding: '20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
        Tempos que fazem parte da vida um do outro
      </p>
      <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>
        {carta.nome_remetente} e {carta.nome_destinatario}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>Juntos desde {ano}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[{ v: tempo.anos, l: 'Anos' }, { v: tempo.meses, l: 'Meses' }, { v: tempo.dias, l: 'Dias' }].map(i => (
          <div key={i.l} style={{ background: '#262626', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 30, fontWeight: 800, fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{i.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{i.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { v: String(tempo.horas).padStart(2, '0'), l: 'Horas' },
          { v: String(tempo.minutos).padStart(2, '0'), l: 'Minutos' },
          { v: String(tempo.segundos).padStart(2, '0'), l: 'Segundos' },
        ].map(i => (
          <div key={i.l} style={{ background: '#262626', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 24, fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'Poppins, sans-serif', lineHeight: 1 }}>{i.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{i.l}</p>
          </div>
        ))}
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
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: carta.data_importante, carta_id: carta.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setMapaUrl(d.imageUrl) })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="section-card" style={{ background: 'linear-gradient(180deg, #05051A 0%, #0D0D2F 100%)', padding: '32px 20px 36px', textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>✦ Momento cósmico ✦</p>
      <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, fontFamily: 'Poppins, sans-serif', marginBottom: 28, lineHeight: 1.3 }}>
        O céu na noite<br />de vocês
      </p>

      {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 24 }} className="shim">Gerando mapa das estrelas…</p>}

      {mapaUrl && (
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
          <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', background: 'radial-gradient(circle, rgba(121,40,255,0.4) 0%, rgba(255,45,122,0.15) 50%, transparent 70%)', filter: 'blur(12px)' }} />
          <div className="star-glow"
            style={{ width: 280, height: 280, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(121,40,255,0.6)', position: 'relative' }}>
            <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      )}

      {estacao && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>{estacao.emoji} {estacao.nome}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>{formatarData(carta.data_importante)}</p>
        </div>
      )}

      <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 8 }}>
        {['✦', '✧', '✦', '✧', '✦'].map((s, i) => (
          <span key={i} style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>{s}</span>
        ))}
      </div>
    </div>
  )
}

// ─── GALERIA HORIZONTAL ───────────────────────────────────────────────────────
function GaleriaSection({ carta, fotos }: { carta: Carta; fotos: Carta['fotos'] }) {
  const [ativa, setAtiva] = useState(0)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const tresfotos = fotos.slice(0, 3)

  return (
    <div className="section-card" style={{ background: '#1A1A1A', paddingTop: 20, paddingBottom: 20 }}>
      <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Poppins, sans-serif', padding: '0 20px', marginBottom: 16 }}>
        Conheça {carta.nome_remetente} e {carta.nome_destinatario}
      </p>

      {lightbox && (
        <div onClick={() => setLightbox(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <img src={lightbox} alt="Foto"
            style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: 16, objectFit: 'contain', animation: 'lightboxIn 0.3s ease' }} />
          <button onClick={() => setLightbox(null)}
            style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', fontSize: 18, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 8, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        {tresfotos.map((foto, idx) => {
          const url = fotoStorageUrl(foto.storage_path)!
          return (
            <div key={foto.id}
              onClick={() => { setAtiva(idx); setLightbox(url) }}
              style={{ flexShrink: 0, width: '72vw', maxWidth: 300, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', scrollSnapAlign: 'start', position: 'relative', border: idx === ativa ? '2px solid #FF2D7A' : '2px solid transparent', transition: 'border 0.2s', cursor: 'pointer' }}>
              <img src={url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#fff', fontSize: 13 }}>⤢</span>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 14 }}>
        {tresfotos.map((_, idx) => (
          <div key={idx} onClick={() => setAtiva(idx)}
            style={{ width: idx === ativa ? 18 : 5, height: 5, borderRadius: 3, background: idx === ativa ? '#FF2D7A' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s', cursor: 'pointer' }} />
        ))}
      </div>
    </div>
  )
}

// ─── MENSAGEM ─────────────────────────────────────────────────────────────────
function MensagemSection({ carta }: { carta: Carta }) {
  const [mostrar, setMostrar] = useState(false)
  const preview = carta.mensagem_principal?.slice(0, 100) || ''
  const temMais = (carta.mensagem_principal?.length || 0) > 100

  return (
    <div className="section-card" style={{ background: 'linear-gradient(135deg,#1A2744,#1A1A1A)', padding: '20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Mensagem especial</p>
      <div style={{ position: 'relative', marginBottom: mostrar ? 0 : 20 }}>
        <p style={{ color: '#fff', fontSize: 20, fontWeight: 700, lineHeight: 1.5, fontFamily: 'Poppins, sans-serif' }}>
          {mostrar ? carta.mensagem_principal : preview + (temMais && !mostrar ? '...' : '')}
        </p>
        {!mostrar && temMais && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom,transparent,#1A2744)' }} />
        )}
      </div>
      {!mostrar && temMais && (
        <button onClick={() => setMostrar(true)}
          style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 100, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
          Mostrar Mensagem
        </button>
      )}
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
    <div className="section-card" style={{ background: '#1A1A1A', padding: '20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Jogo de palavras</p>
      {finalizado ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🎊</div>
          <p style={{ color: '#FF2D7A', fontWeight: 700, fontSize: 16 }}>Você descobriu tudo!</p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 4 }}>Só você saberia isso.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {palavras.map(p => (
              <div key={p} style={{ background: '#262626', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${acertos.includes(p.toLowerCase()) ? 'rgba(255,45,122,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                <div>
                  <p style={{ color: acertos.includes(p.toLowerCase()) ? '#FF2D7A' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700, letterSpacing: acertos.includes(p.toLowerCase()) ? 0 : 5, fontFamily: 'Poppins, sans-serif' }}>
                    {acertos.includes(p.toLowerCase()) ? p : '•'.repeat(p.length)}
                  </p>
                  {!acertos.includes(p.toLowerCase()) && (
                    <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 2 }}>Dica: {p.length} letras</p>
                  )}
                </div>
                {acertos.includes(p.toLowerCase()) && <span style={{ color: '#FF2D7A', fontSize: 16 }}>✓</span>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && tentar()}
              placeholder="Digite uma palavra…"
              style={{ flex: 1, background: '#262626', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,255,255,0.08)', fontSize: 14 }} />
            <button onClick={tentar}
              style={{ background: 'linear-gradient(135deg,#FF2D7A,#7928FF)', color: '#fff', padding: '12px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>→</button>
          </div>
          {msg && <p style={{ color: msg.includes('Acertou') ? '#FF2D7A' : 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{msg}</p>}
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8, textAlign: 'center' }}>{acertos.length}/{palavras.length} descobertas</p>
        </>
      )}
    </div>
  )
}

// ─── WRAPPED CARD ─────────────────────────────────────────────────────────────
function WrappedCard({ carta, fotoUrl }: { carta: Carta; fotoUrl: string | null }) {
  const [copiado, setCopiado] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const tempo = calcularTempo(carta.data_importante)
  const total = tempo.anos * 365 + tempo.meses * 30 + tempo.dias
  const url = `https://www.lovefy.app.br/c/${carta.slug}`
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  const tempoLabel = tempo.anos > 0
    ? `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'} juntos`
    : tempo.meses > 0
      ? `${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'} juntos`
      : `${tempo.dias} dias juntos`

  function compartilharWpp() {
    const texto = `💌 ${carta.nome_remetente} & ${carta.nome_destinatario}\n${tempoLabel}\n\nVer o Wrapped completo: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function copiarLink() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  async function salvarImagem() {
    setSalvando(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 1080
      canvas.height = 1920
      const ctx = canvas.getContext('2d')!

      const drawGrad = () => {
        const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
        grad.addColorStop(0, '#FF2D7A'); grad.addColorStop(0.5, '#7928FF'); grad.addColorStop(1, '#0D0D0D')
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1920)
      }

      if (fotoUrl) {
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image(); i.crossOrigin = 'anonymous'
            i.onload = () => resolve(i); i.onerror = reject; i.src = fotoUrl
          })
          const scale = Math.max(1080 / img.width, 1920 / img.height)
          ctx.drawImage(img, (1080 - img.width * scale) / 2, (1920 - img.height * scale) / 2, img.width * scale, img.height * scale)
        } catch { drawGrad() }
      } else { drawGrad() }

      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, 1080, 1920)
      const ov = ctx.createLinearGradient(0, 0, 1080, 1920)
      ov.addColorStop(0, 'rgba(255,45,122,0.5)'); ov.addColorStop(1, 'rgba(121,40,255,0.5)')
      ctx.fillStyle = ov; ctx.fillRect(0, 0, 1080, 1920)

      if (fotoUrl) {
        try {
          const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image(); i.crossOrigin = 'anonymous'
            i.onload = () => resolve(i); i.onerror = reject; i.src = fotoUrl
          })
          const cx = 540, cy = 680, r = 200
          ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip()
          const scale = Math.max((r * 2) / img.width, (r * 2) / img.height)
          ctx.drawImage(img, cx - img.width * scale / 2, cy - img.height * scale / 2, img.width * scale, img.height * scale)
          ctx.restore()
          ctx.beginPath(); ctx.arc(cx, cy, r + 6, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 6; ctx.stroke()
        } catch { }
      }

      ctx.textAlign = 'center'
      ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.font = '400 40px Inter, sans-serif'
      ctx.fillText('Wrapped Lovefy', 540, 340)
      ctx.fillStyle = '#fff'; ctx.font = '800 60px Poppins, sans-serif'
      ctx.fillText(`${carta.nome_remetente} & ${carta.nome_destinatario}`, 540, 980)
      ctx.font = '900 200px Poppins, sans-serif'; ctx.fillText(String(total), 540, 1240)
      ctx.font = '400 48px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.65)'
      ctx.fillText(tempoLabel, 540, 1340)
      ctx.font = '400 32px Inter, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillText('lovefy.app.br/c/' + carta.slug, 540, 1750)

      canvas.toBlob(async blob => {
        if (!blob) return
        const file = new File([blob], 'lovefy-wrapped.png', { type: 'image/png' })
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Wrapped Lovefy', text: `Ver aqui: ${url}` })
        } else {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob); a.download = 'lovefy-wrapped.png'; a.click()
        }
      }, 'image/png')
    } catch { }
    finally { setSalvando(false) }
  }

  return (
    <div className="section-card" style={{ marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ position: 'relative', background: 'linear-gradient(135deg, #FF2D7A 0%, #7928FF 60%, #0D0D0D 100%)', padding: '40px 28px 32px', textAlign: 'center', overflow: 'hidden' }}>
        {fotoUrl && (
          <img src={fotoUrl} alt=""
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, filter: 'blur(8px)', transform: 'scale(1.1)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,45,122,0.7),rgba(121,40,255,0.8))' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Wrapped Lovefy · {hoje}</p>
          {fotoUrl && (
            <div style={{ width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 20px', border: '3px solid rgba(255,255,255,0.4)' }}>
              <img src={fotoUrl} alt="Casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, fontFamily: 'Poppins, sans-serif', marginBottom: 4 }}>
            {carta.nome_remetente} & {carta.nome_destinatario}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>{tempoLabel}</p>
          <p style={{ color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(72px,18vw,96px)', fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
            {total}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28 }}>dias de história</p>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '10px 20px', display: 'inline-block' }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, letterSpacing: 1, marginBottom: 2 }}>Ver o Wrapped completo</p>
            <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>lovefy.app.br/c/{carta.slug}</p>
          </div>
        </div>
      </div>

      <div style={{ background: '#1A1A1A', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textAlign: 'center', marginBottom: 4 }}>Compartilhe seu Wrapped</p>
        <button onClick={salvarImagem} disabled={salvando}
          style={{ width: '100%', padding: '14px', borderRadius: 100, background: 'linear-gradient(135deg,#FF2D7A,#7928FF)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
          {salvando ? 'Preparando…' : '📱 Salvar para Stories'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <button onClick={compartilharWpp}
            style={{ padding: '14px', borderRadius: 100, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            WhatsApp
          </button>
          <button onClick={copiarLink}
            style={{ padding: '14px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
            {copiado ? '✓ Copiado!' : 'Copiar link'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CTA FINAL ────────────────────────────────────────────────────────────────
function CTASection({ carta }: { carta: Carta }) {
  return (
    <div className="section-card" style={{ background: '#1A1A1A', padding: '28px 20px', textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginBottom: 12 }}>
        Como {carta.nome_remetente} fez por {carta.nome_destinatario}.
      </p>
      <a href="https://www.lovefy.app.br/criar"
        style={{ display: 'block', padding: '18px', borderRadius: 100, background: 'linear-gradient(135deg,#FF2D7A,#7928FF)', color: '#fff', fontWeight: 700, fontSize: 16, textDecoration: 'none', fontFamily: 'Poppins, sans-serif', boxShadow: '0 4px 24px rgba(255,45,122,0.35)' }}>
        Criar minha carta
      </a>
      <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 11, marginTop: 16 }}>lovefy.app.br</p>
    </div>
  )
}