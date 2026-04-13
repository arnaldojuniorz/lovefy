'use client'

import { useState, useEffect, useRef } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800;900&family=Inter:wght@300;400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0B0A1A; overflow: hidden; height: 100%; }

  @keyframes fadeIn       { from { opacity: 0 }                            to { opacity: 1 } }
  @keyframes fadeInUp     { from { opacity: 0; transform: translateY(32px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes scaleIn      { from { opacity: 0; transform: scale(0.88) }    to { opacity: 1; transform: scale(1) } }
  @keyframes countUp      { from { opacity: 0; transform: translateY(40px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes zoomSlow     { from { transform: scale(1.04) }                 to { transform: scale(1) } }
  @keyframes pulse        { 0%,100% { transform: scale(1); opacity: 0.9 }  50% { transform: scale(1.06); opacity: 1 } }
  @keyframes blink        { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
  @keyframes gradMove     { 0%,100% { background-position: 0% 50% }        50% { background-position: 100% 50% } }
  @keyframes starBurst    { 0% { transform: scale(0) translateY(0); opacity: 1 } 100% { transform: scale(1.5) translateY(-80px); opacity: 0 } }
  @keyframes sealIn       { from { opacity: 0; transform: scale(0.6) rotate(-10deg) } to { opacity: 1; transform: scale(1) rotate(0deg) } }

  .fade-in      { animation: fadeIn 1s ease forwards; }
  .fade-in-up   { animation: fadeInUp 0.8s ease forwards; }
  .scale-in     { animation: scaleIn 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .zoom-slow    { animation: zoomSlow 8s ease-out forwards; }
  .pulse-btn    { animation: pulse 2s ease-in-out infinite; }
  .cursor       { display: inline-block; width: 2px; height: 1em; background: #fff; margin-left: 2px; animation: blink 0.8s infinite; vertical-align: text-bottom; }

  .grad-text {
    background: linear-gradient(135deg, #FF2D7A, #7928FF);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .grad-bg {
    background: linear-gradient(135deg, #FF2D7A, #7928FF, #00F0FF, #FF2D7A);
    background-size: 300% 300%;
    animation: gradMove 5s ease infinite;
  }

  .neon-border {
    box-shadow: 0 0 20px rgba(255,45,122,0.4), 0 0 40px rgba(121,40,255,0.2);
  }

  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
`

type CardId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

export default function CartaViewer({ carta }: { carta: Carta }) {
  const [card, setCard] = useState<CardId>(1)
  const [transitioning, setTransitioning] = useState(false)
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null
  const spotifyId = getSpotifyId(carta.musica_link)

  function avancar() {
    if (card >= 8 || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCard(c => (c + 1) as CardId)
      setTransitioning(false)
    }, 380)
  }

  function irPara(n: CardId) {
    if (transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setCard(n)
      setTransitioning(false)
    }, 380)
  }

  const props = { carta, avancar, irPara, fotoUrl, fotos, spotifyId }

  return (
    <div style={{ height: '100vh', background: '#0B0A1A', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden', cursor: card < 8 ? 'pointer' : 'default' }}
      onClick={card < 8 ? avancar : undefined}>
      <style>{STYLES}</style>

      {/* Barra de progresso */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.06)', zIndex: 200 }}>
        <div style={{ height: '100%', width: `${(card / 8) * 100}%`, background: 'linear-gradient(90deg, #FF2D7A, #7928FF)', transition: 'width 0.5s ease' }} />
      </div>

      {/* Indicadores */}
      <div style={{ position: 'fixed', top: 12, right: 16, zIndex: 200, display: 'flex', gap: 4 }}>
        {[1,2,3,4,5,6,7,8].map(n => (
          <div key={n} style={{ width: n === card ? 16 : 5, height: 5, borderRadius: 3, background: n === card ? '#FF2D7A' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
        ))}
      </div>

      <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.38s ease', height: '100%' }}>
        {card === 1 && <Card1 {...props} />}
        {card === 2 && <Card2 {...props} />}
        {card === 3 && <Card3 {...props} />}
        {card === 4 && <Card4 {...props} />}
        {card === 5 && <Card5 {...props} />}
        {card === 6 && <Card6 {...props} />}
        {card === 7 && <Card7 {...props} />}
        {card === 8 && <Card8 {...props} />}
      </div>
    </div>
  )
}

type CP = {
  carta: Carta
  avancar: () => void
  irPara: (n: CardId) => void
  fotoUrl: string | null
  fotos: Carta['fotos']
  spotifyId: string | null
}

function Tela({ children, bg = '#0B0A1A' }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ height: '100vh', background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px 48px', position: 'relative', overflow: 'hidden' }}>
      {children}
    </div>
  )
}

// ─── CARD 1 — Hook numérico ───────────────────────────────────────────────────
function Card1({ carta }: CP) {
  const [vis, setVis] = useState(false)
  const tempo = calcularTempo(carta.data_importante)
  const total = tempo.anos * 365 + tempo.meses * 30 + tempo.dias

  useEffect(() => { setTimeout(() => setVis(true), 200) }, [])

  return (
    <Tela>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(255,45,122,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(121,40,255,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {vis && (
        <div className="fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
            Wrapped do Afeto
          </p>
          <p className="grad-text" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(90px, 25vw, 160px)', fontWeight: 900, lineHeight: 1, display: 'block', animation: 'countUp 1s ease forwards' }}>
            {total}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 'clamp(16px, 4vw, 22px)', fontFamily: 'Inter, sans-serif', marginTop: 16, fontWeight: 300 }}>
            Não é só um número.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontFamily: 'Inter, sans-serif', marginTop: 8 }}>
            {carta.nome_remetente} → {carta.nome_destinatario}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: 12, marginTop: 48 }}>toque para continuar</p>
        </div>
      )}
    </Tela>
  )
}

// ─── CARD 2 — Foto + Player ───────────────────────────────────────────────────
function Card2({ carta, fotoUrl, spotifyId, avancar }: CP) {
  const [tocando, setTocando] = useState(false)
  const [vis, setVis] = useState(false)

  useEffect(() => { setTimeout(() => setVis(true), 300) }, [])

  return (
    <div style={{ height: '100vh', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={avancar}>
      {fotoUrl ? (
        <img src={fotoUrl} alt="Foto" className="zoom-slow" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <div style={{ position: 'absolute', inset: 0 }} className="grad-bg" />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11,10,26,0.97) 0%, rgba(11,10,26,0.5) 50%, rgba(11,10,26,0.2) 100%)' }} />

      {vis && (
        <div className="fade-in" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '0 28px 48px', zIndex: 10 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, fontStyle: 'italic', marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
            "Essa música sempre me leva até você."
          </p>

          {spotifyId && (
            <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)', borderRadius: 20, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16 }}>
              {!tocando ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}>
                    {fotoUrl && <img src={fotoUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 15, marginBottom: 2, fontFamily: 'Inter, sans-serif' }}>Nossa música</p>
                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{carta.nome_remetente} & {carta.nome_destinatario}</p>
                  </div>
                  <button onClick={() => setTocando(true)} className="pulse-btn"
                    style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                </div>
              ) : (
                <iframe src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`}
                  width="100%" height="80" frameBorder={0}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  style={{ borderRadius: 12, display: 'block' }} />
              )}
            </div>
          )}

          {!spotifyId && carta.musica_link && (
            <a href={carta.musica_link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', color: '#fff', fontWeight: 600, textDecoration: 'none', fontSize: 15, marginBottom: 16 }}>
              Abrir no Spotify
            </a>
          )}

          <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            Aperte o play. O resto você já sabe de cor.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── CARD 3 — Contador animado ────────────────────────────────────────────────
function Card3({ carta }: CP) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const [vis, setVis] = useState(false)
  const total = tempo.anos * 365 + tempo.meses * 30 + tempo.dias

  useEffect(() => {
    setTimeout(() => setVis(true), 200)
    const t = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(t)
  }, [carta.data_importante])

  return (
    <Tela>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 30%, rgba(0,240,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />
      {vis && (
        <div className="fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>O peso do tempo</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(64px, 18vw, 110px)', fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 8 }}>
            {total}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 40, fontFamily: 'Inter, sans-serif', fontWeight: 300, lineHeight: 1.6 }}>
            dias. E cada um deles ficou melhor porque você existia.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {[{ v: tempo.anos, l: 'Anos' }, { v: tempo.meses, l: 'Meses' }, { v: tempo.dias, l: 'Dias' }].map(i => (
              <div key={i.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: 'Montserrat, sans-serif' }}>{i.v}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>{i.l}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[{ v: String(tempo.horas).padStart(2,'0'), l: 'Horas' }, { v: String(tempo.minutos).padStart(2,'0'), l: 'Min' }, { v: String(tempo.segundos).padStart(2,'0'), l: 'Seg' }].map(i => (
              <div key={i.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'Montserrat, sans-serif' }}>{i.v}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 4 }}>{i.l}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </Tela>
  )
}

// ─── CARD 4 — Mapa das estrelas ───────────────────────────────────────────────
function Card4({ carta }: CP) {
  const [mapaUrl, setMapaUrl] = useState(carta.mapa_estrelas_url || '')
  const [loading, setLoading] = useState(!carta.mapa_estrelas_url && carta.recursos.includes('mapa_estrelas'))
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null

  useEffect(() => {
    if (!carta.recursos.includes('mapa_estrelas') || carta.mapa_estrelas_url) return
    fetch('/api/mapa-estrelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: carta.data_importante, carta_id: carta.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setMapaUrl(d.imageUrl) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <Tela>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(121,40,255,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div className="fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%', maxWidth: 380 }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Momento cósmico</p>

        {carta.recursos.includes('mapa_estrelas') ? (
          <>
            {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 24 }}>Gerando mapa das estrelas…</p>}
            {mapaUrl && (
              <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 24px', border: '2px solid rgba(121,40,255,0.4)', boxShadow: '0 0 60px rgba(121,40,255,0.3)' }}>
                <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <p style={{ color: '#fff', fontSize: 'clamp(18px, 4vw, 24px)', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4, marginBottom: 12 }}>
              Na noite de {formatarData(carta.data_importante)},<br />as estrelas desenharam isto.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontStyle: 'italic' }}>
              Talvez fosse um sinal. {estacao?.emoji}
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: 64, marginBottom: 20 }}>✨</p>
            <p style={{ color: '#fff', fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', lineHeight: 1.4, marginBottom: 12 }}>
              Na noite de {formatarData(carta.data_importante)},<br />as estrelas já sabiam.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, fontStyle: 'italic' }}>
              Talvez o acaso nunca tenha sido ingênuo. {estacao?.emoji}
            </p>
          </>
        )}
      </div>
    </Tela>
  )
}

// ─── CARD 5 — Galeria de memórias ─────────────────────────────────────────────
function Card5({ carta, fotos, avancar }: CP) {
  const [ativa, setAtiva] = useState(0)

  return (
    <div style={{ height: '100vh', background: '#0B0A1A', display: 'flex', flexDirection: 'column', paddingTop: 48, overflow: 'hidden' }}
      onClick={fotos.length === 0 ? avancar : undefined}>
      <div className="fade-in" style={{ padding: '0 28px', marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 10 }}>Galeria de memórias</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          Os momentos que não envelhecem.
        </p>
      </div>

      {fotos.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 28, paddingRight: 28, paddingBottom: 8, scrollSnapType: 'x mandatory', flex: 1, scrollbarWidth: 'none' }}
            onClick={e => e.stopPropagation()}>
            {fotos.map((foto, idx) => (
              <div key={foto.id} onClick={() => setAtiva(idx)}
                style={{ flexShrink: 0, width: '72vw', maxWidth: 280, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', scrollSnapAlign: 'start', position: 'relative', border: idx === ativa ? '2px solid #FF2D7A' : '2px solid transparent', transition: 'border 0.2s' }}>
                <img src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 14px 14px', background: 'linear-gradient(to top, rgba(0,0,0,0.75), transparent)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
                    {['esse dia ainda mora em mim','a gente sendo a gente','aqui eu já sabia','impossível esquecer','um dos meus favoritos'][idx] || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 28px' }}>
            {fotos.map((_, idx) => (
              <div key={idx} style={{ width: idx === ativa ? 18 : 5, height: 5, borderRadius: 3, background: idx === ativa ? '#FF2D7A' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
            ))}
          </div>
          <div style={{ padding: '0 28px 32px', textAlign: 'right' }}>
            <button onClick={e => { e.stopPropagation(); avancar() }}
              style={{ background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', color: '#fff', border: 'none', borderRadius: 100, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Continuar →
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>toque para continuar</p>
        </div>
      )}
    </div>
  )
}

// ─── CARD 6 — Jogo de palavras ────────────────────────────────────────────────
function Card6({ carta, avancar }: CP) {
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
      setMsg('✓')
      if (novos.length === palavras.length) setFinalizado(true)
    } else if (acertos.includes(p)) {
      setMsg('já descobriu!')
    } else {
      setMsg('tente outra vez')
    }
    setTentativa('')
    setTimeout(() => setMsg(''), 1200)
  }

  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}
        onClick={e => e.stopPropagation()}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>Segredo íntimo</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 28, lineHeight: 1.3 }}>
          Só você consegue desembaralhar o que a gente criou.
        </p>

        {finalizado ? (
          <div className="scale-in" style={{ padding: '24px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎊</p>
            <p className="grad-text" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Só você saberia isso.</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>Nossa conexão é única.</p>
            <button onClick={avancar} style={{ background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', color: '#fff', border: 'none', borderRadius: 100, padding: '14px 32px', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              Continuar →
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {palavras.map(p => (
                <div key={p} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid ${acertos.includes(p.toLowerCase()) ? 'rgba(255,45,122,0.4)' : 'rgba(255,255,255,0.06)'}` }}>
                  <div>
                    <p style={{ color: acertos.includes(p.toLowerCase()) ? '#FF2D7A' : 'rgba(255,255,255,0.2)', fontSize: 18, fontWeight: 700, letterSpacing: acertos.includes(p.toLowerCase()) ? 0 : 5, fontFamily: 'Montserrat, sans-serif' }}>
                      {acertos.includes(p.toLowerCase()) ? p : '•'.repeat(p.length)}
                    </p>
                    {!acertos.includes(p.toLowerCase()) && <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, marginTop: 2 }}>{p.length} letras</p>}
                  </div>
                  {acertos.includes(p.toLowerCase()) && <span style={{ color: '#FF2D7A', fontSize: 16 }}>✓</span>}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)} onKeyDown={e => e.key === 'Enter' && tentar()}
                placeholder="Digite uma palavra…"
                style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, fontFamily: 'Inter, sans-serif' }} />
              <button onClick={tentar} style={{ background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', color: '#fff', padding: '12px 18px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>→</button>
            </div>
            {msg && <p style={{ color: msg === '✓' ? '#FF2D7A' : 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>{msg}</p>}
            <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12, marginTop: 8 }}>{acertos.length}/{palavras.length} descobertas</p>
          </>
        )}
      </div>
    </Tela>
  )
}

// ─── CARD 7 — Mensagem com typing ─────────────────────────────────────────────
function Card7({ carta }: CP) {
  const mensagem = carta.mensagem_principal || ''
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < mensagem.length) { setTyped(mensagem.slice(0, i + 1)); i++ }
      else { setDone(true); clearInterval(interval) }
    }, 30)
    return () => clearInterval(interval)
  }, [mensagem])

  return (
    <Tela>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,45,122,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 24 }}>
          {carta.nome_remetente} escreveu
        </p>
        <p style={{ color: '#fff', fontSize: 'clamp(18px, 4.5vw, 26px)', fontFamily: 'Inter, sans-serif', fontWeight: 400, lineHeight: 1.8, fontStyle: 'italic' }}>
          &ldquo;{typed}{!done && <span className="cursor" />}&rdquo;
        </p>
      </div>
    </Tela>
  )
}

// ─── CARD 8 — Encerramento cinematográfico ────────────────────────────────────
function Card8({ carta }: CP) {
  const [clicou, setClicou] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const [particulas, setParticulas] = useState<{ id: number; x: number; cor: string }[]>([])
  const url = `https://www.lovefy.app.br/c/${carta.slug}`
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  function handleBotao(e: React.MouseEvent) {
    e.stopPropagation()
    if (clicou) return
    setClicou(true)
    const ps = Array.from({ length: 20 }, (_, i) => ({
      id: i, x: Math.random() * 100,
      cor: ['#FFD700','#00F0FF','#FF2D7A','#7928FF'][Math.floor(Math.random() * 4)],
    }))
    setParticulas(ps)
    setTimeout(() => setParticulas([]), 1800)
  }

  function compartilharWpp(e: React.MouseEvent) {
    e.stopPropagation()
    const texto = `${carta.nome_remetente} criou algo especial para ${carta.nome_destinatario}! Ver aqui: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function copiar(e: React.MouseEvent) {
    e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div style={{ height: '100vh', background: '#0B0A1A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px 48px', position: 'relative', overflow: 'hidden' }}
      onClick={e => e.stopPropagation()}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 40%, rgba(255,45,122,0.1) 0%, transparent 60%), radial-gradient(ellipse at 50% 70%, rgba(121,40,255,0.08) 0%, transparent 60%)', pointerEvents: 'none' }} />

      {particulas.map(p => (
        <div key={p.id} style={{ position: 'absolute', bottom: '40%', left: `${p.x}%`, width: 8, height: 8, borderRadius: '50%', background: p.cor, animation: 'starBurst 1.5s ease forwards', pointerEvents: 'none' }} />
      ))}

      <div className="fade-in-up" style={{ textAlign: 'center', position: 'relative', zIndex: 1, width: '100%', maxWidth: 400 }}>
        {!clicou ? (
          <>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 20 }}>Encerramento</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 'clamp(24px, 6vw, 36px)', fontWeight: 800, color: '#fff', lineHeight: 1.3, marginBottom: 40 }}>
              E se essa história<br />nunca acabar?
            </p>
            <button onClick={handleBotao} className="pulse-btn neon-border"
              style={{ background: 'linear-gradient(135deg, #FF2D7A, #7928FF)', color: '#fff', border: 'none', borderRadius: 100, padding: '20px 48px', fontSize: 17, fontWeight: 700, cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', width: '100%' }}>
              Eu guardo isso para sempre.
            </button>
          </>
        ) : (
          <div className="scale-in">
            <div style={{ background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: 20, padding: '16px 24px', marginBottom: 28, animation: 'sealIn 0.6s ease forwards' }}>
              <p style={{ color: '#FFD700', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>✦ Carta entregue</p>
              <p style={{ color: 'rgba(255,215,0,0.7)', fontSize: 12 }}>Estrela registrada · {hoje}</p>
            </div>
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', marginBottom: 8 }}>
              {carta.nome_remetente} & {carta.nome_destinatario}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 28, fontStyle: 'italic' }}>Compartilhe este Wrapped</p>
            <button onClick={compartilharWpp}
              style={{ width: '100%', padding: '16px', borderRadius: 100, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15, marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
              WhatsApp
            </button>
            <button onClick={copiar}
              style={{ width: '100%', padding: '14px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: 14, marginBottom: 24, fontFamily: 'Inter, sans-serif' }}>
              {copiado ? '✓ Link copiado!' : 'Copiar link'}
            </button>
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13, marginBottom: 12 }}>Como {carta.nome_remetente} fez por você.</p>
            <a href="https://www.lovefy.app.br/criar"
              style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.6)', fontSize: 14, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
              Criar minha carta
            </a>
          </div>
        )}
      </div>
    </div>
  )
}