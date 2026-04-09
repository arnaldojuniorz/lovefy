'use client'
 
import { useState, useEffect, useRef } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'
 
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
 
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #0B0B0F; overflow: hidden; }
 
  @keyframes fadeIn       { from { opacity: 0 }                          to { opacity: 1 } }
  @keyframes fadeInUp     { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes scaleIn      { from { opacity: 0; transform: scale(0.92) }  to { opacity: 1; transform: scale(1) } }
  @keyframes gradientMove { 0%,100% { background-position: 0% 50% }     50% { background-position: 100% 50% } }
  @keyframes pulse        { 0%,100% { opacity: 0.7; transform: scale(1) } 50% { opacity: 1; transform: scale(1.04) } }
  @keyframes countUp      { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes glow         { 0%,100% { box-shadow: 0 0 20px rgba(123,46,255,0.4) } 50% { box-shadow: 0 0 40px rgba(255,46,154,0.6) } }
  @keyframes blink        { 0%,49% { opacity: 1 } 50%,100% { opacity: 0 } }
  @keyframes zoomSlow     { from { transform: scale(1) } to { transform: scale(1.06) } }
 
  .fade-in     { animation: fadeIn 1s ease forwards; }
  .fade-in-up  { animation: fadeInUp 0.8s ease forwards; }
  .scale-in    { animation: scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .pulse-btn   { animation: pulse 2s ease-in-out infinite; }
  .glow-btn    { animation: glow 2s ease-in-out infinite; }
  .zoom-slow   { animation: zoomSlow 12s ease-out forwards; }
  .cursor      { display: inline-block; width: 2px; height: 1em; background: #fff; margin-left: 3px; animation: blink 0.8s infinite; vertical-align: text-bottom; }
 
  .grad-bg {
    background: linear-gradient(135deg, #7B2EFF, #FF2E9A, #2E9AFF, #7B2EFF);
    background-size: 300% 300%;
    animation: gradientMove 6s ease infinite;
  }
 
  .slide-enter { animation: fadeInUp 0.6s ease forwards; }
 
  /* Scrollbar invisível */
  ::-webkit-scrollbar { display: none; }
  * { scrollbar-width: none; }
`
 
type Slide = number // 1–24
 
export default function CartaViewer({ carta }: { carta: Carta }) {
  const [slide, setSlide] = useState<Slide>(1)
  const [transitioning, setTransitioning] = useState(false)
  const [musicaAtiva, setMusicaAtiva] = useState(false)
 
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null
  const spotifyId = getSpotifyId(carta.musica_link)
 
  function avancar() {
    if (slide >= 24 || transitioning) return
    setTransitioning(true)
    setTimeout(() => {
      setSlide(s => s + 1)
      setTransitioning(false)
    }, 350)
  }
 
  function reiniciar() {
    setTransitioning(true)
    setTimeout(() => {
      setSlide(1)
      setMusicaAtiva(false)
      setTransitioning(false)
    }, 350)
  }
 
  // Ativa música na tela 16
  useEffect(() => {
    if (slide === 16 && spotifyId) setMusicaAtiva(true)
  }, [slide, spotifyId])
 
  const props = { carta, avancar, fotoUrl, fotos, spotifyId, musicaAtiva, reiniciar }
 
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0B0B0F',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        overflow: 'hidden',
        cursor: slide < 24 ? 'pointer' : 'default',
      }}
      onClick={slide < 24 ? avancar : undefined}
    >
      <style>{STYLES}</style>
 
      {/* Barra de progresso */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 2, background: 'rgba(255,255,255,0.08)', zIndex: 200 }}>
        <div style={{ height: '100%', width: `${(slide / 24) * 100}%`, background: 'linear-gradient(90deg, #7B2EFF, #FF2E9A)', transition: 'width 0.5s ease' }} />
      </div>
 
      <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.35s ease' }}>
        {slide === 1  && <S1  {...props} />}
        {slide === 2  && <S2  {...props} />}
        {slide === 3  && <S3  {...props} />}
        {slide === 4  && <S4  {...props} />}
        {slide === 5  && <S5  {...props} />}
        {slide === 6  && <S6  {...props} />}
        {slide === 7  && <S7  {...props} />}
        {slide === 8  && <S8  {...props} />}
        {slide === 9  && <S9  {...props} />}
        {slide === 10 && <S10 {...props} />}
        {slide === 11 && <S11 {...props} />}
        {slide === 12 && <S12 {...props} />}
        {slide === 13 && <S13 {...props} />}
        {slide === 14 && <S14 {...props} />}
        {slide === 15 && <S15 {...props} />}
        {slide === 16 && <S16 {...props} />}
        {slide === 17 && <S17 {...props} />}
        {slide === 18 && <S18 {...props} />}
        {slide === 19 && <S19 {...props} />}
        {slide === 20 && <S20 {...props} />}
        {slide === 21 && <S21 {...props} />}
        {slide === 22 && <S22 {...props} />}
        {slide === 23 && <S23 {...props} />}
        {slide === 24 && <S24 {...props} />}
      </div>
    </div>
  )
}
 
// ─── Tipos ───────────────────────────────────────────────────────────────────
type SP = {
  carta: Carta
  avancar: () => void
  fotoUrl: string | null
  fotos: { id: string; storage_path: string; ordem: number; is_temp: boolean }[]
  spotifyId: string | null
  musicaAtiva: boolean
  reiniciar: () => void
}
 
// ─── Utilitários de layout ────────────────────────────────────────────────────
function Tela({ children, bg = '#0B0B0F', center = true }: { children: React.ReactNode; bg?: string; center?: boolean }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: bg,
      display: 'flex',
      flexDirection: 'column',
      alignItems: center ? 'center' : 'flex-start',
      justifyContent: center ? 'center' : 'flex-start',
      padding: '60px 28px 48px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  )
}
 
function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 20, fontFamily: 'Inter, sans-serif' }}>
      {children}
    </p>
  )
}
 
function Titulo({ children, grad }: { children: React.ReactNode; grad?: boolean }) {
  return (
    <h1 style={{
      fontFamily: 'Poppins, sans-serif',
      fontSize: 'clamp(32px, 8vw, 52px)',
      fontWeight: 800,
      lineHeight: 1.15,
      textAlign: 'center',
      ...(grad ? {
        background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      } : { color: '#fff' }),
    }}>
      {children}
    </h1>
  )
}
 
function Subtitulo({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 'clamp(16px, 4vw, 22px)', fontFamily: 'Inter, sans-serif', textAlign: 'center', lineHeight: 1.6, marginTop: 16 }}>
      {children}
    </p>
  )
}
 
function GradOverlay({ from = 'bottom' }: { from?: 'bottom' | 'top' | 'full' }) {
  const maps = {
    bottom: 'to top',
    top: 'to bottom',
    full: '180deg',
  }
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: `linear-gradient(${maps[from]}, rgba(11,11,15,0.95) 0%, rgba(11,11,15,0.4) 50%, rgba(11,11,15,0.1) 100%)`,
      pointerEvents: 'none',
    }} />
  )
}
 
// ─── SLIDE 1 — HOOK ──────────────────────────────────────────────────────────
function S1({ carta }: SP) {
  const [vis, setVis] = useState(false)
  useEffect(() => { setTimeout(() => setVis(true), 400) }, [])
  return (
    <Tela>
      <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.12 }} />
      {vis && (
        <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 380 }}>
          <Titulo>
            Eu transformei a gente em algo que você nunca viu…
          </Titulo>
        </div>
      )}
    </Tela>
  )
}
 
// ─── SLIDE 2 — QUEBRA ────────────────────────────────────────────────────────
function S2({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Label>Your Love</Label>
        <Titulo grad>
          Se nosso amor virasse um "Wrapped"…
        </Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 3 — INTRO ─────────────────────────────────────────────────────────
function S3({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center' }}>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(48px, 12vw, 80px)', fontWeight: 900, color: '#fff', letterSpacing: -2 }}>
          seria assim.
        </p>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 4 — DATA ───────────────────────────────────────────────────────────
function S4({ carta, fotoUrl }: SP) {
  const dataFmt = carta.data_importante ? formatarData(carta.data_importante) : ''
  return (
    <Tela center={false}>
      {fotoUrl && (
        <>
          <img src={fotoUrl} alt="Foto" className="zoom-slow"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <GradOverlay from="full" />
        </>
      )}
      {!fotoUrl && <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />}
      <div className="fade-in" style={{ position: 'relative', zIndex: 1, marginTop: 'auto', marginBottom: 'auto', width: '100%', textAlign: 'center' }}>
        <Label>O início de tudo</Label>
        <Titulo>Tudo começou em {dataFmt}</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 5 — CONTADOR ───────────────────────────────────────────────────────
function S5({ carta, fotoUrl }: SP) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  useEffect(() => {
    const t = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(t)
  }, [carta.data_importante])
 
  const total = tempo.anos * 365 + tempo.meses * 30 + tempo.dias
 
  return (
    <Tela center={false}>
      {fotoUrl && (
        <>
          <img src={fotoUrl} alt="Foto" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.35)' }} />
          <GradOverlay from="bottom" />
        </>
      )}
      {!fotoUrl && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0B0B0F, #1a0533)' }} />}
      <div className="fade-in-up" style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', marginTop: 'auto', marginBottom: 'auto' }}>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 'clamp(80px, 22vw, 130px)', fontWeight: 900, color: '#fff', lineHeight: 1, display: 'block', animation: 'countUp 0.8s ease forwards' }}>
          {total}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 22, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>dias com você…</p>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </p>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 6 — SIGNIFICADO ────────────────────────────────────────────────────
function S6({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 340 }}>
        <Titulo>e nenhum deles foi comum.</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 7 — VERDADE ───────────────────────────────────────────────────────
function S7({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 340 }}>
        <Label>A verdade</Label>
        <Titulo>Nem sempre foi perfeito…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 8 — RESOLUÇÃO ─────────────────────────────────────────────────────
function S8({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center', maxWidth: 340 }}>
        <Titulo grad>mas sempre foi você.</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 9 — GALERIA ───────────────────────────────────────────────────────
const fotoLabels = [
  'esse dia ainda mora em mim',
  'a gente sendo a gente',
  'aqui eu já sabia',
  'um dos meus favoritos',
  'impossível esquecer',
]
 
function S9({ carta, fotos }: SP) {
  const [ativa, setAtiva] = useState(0)
 
  return (
    <div style={{ minHeight: '100vh', background: '#0B0B0F', display: 'flex', flexDirection: 'column', paddingTop: 60, overflow: 'hidden' }}
      onClick={e => e.stopPropagation()}>
      <div className="fade-in" style={{ padding: '0 28px', marginBottom: 24 }}>
        <Label>Memórias</Label>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
          Alguns momentos que ficaram…
        </p>
      </div>
      {fotos.length > 0 ? (
        <>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 28, paddingRight: 28, paddingBottom: 12, scrollSnapType: 'x mandatory', scrollbarWidth: 'none', flex: 1 }}>
            {fotos.map((foto, idx) => (
              <div key={foto.id} onClick={() => setAtiva(idx)}
                style={{ flexShrink: 0, width: '75vw', maxWidth: 300, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', scrollSnapAlign: 'start', position: 'relative', border: idx === ativa ? '2px solid #FF2E9A' : '2px solid transparent', transition: 'border 0.2s' }}>
                <img src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '32px 16px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
                    {fotoLabels[idx] || ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, padding: '16px 28px 40px' }}>
            {fotos.map((_, idx) => (
              <div key={idx} style={{ width: idx === ativa ? 20 : 6, height: 6, borderRadius: 3, background: idx === ativa ? '#FF2E9A' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </>
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>Adicione fotos para aparecerem aqui</p>
        </div>
      )}
      <div style={{ padding: '0 28px 48px', textAlign: 'right' }}>
        <button
          onClick={e => { e.stopPropagation(); /* parent avancar is disabled */ }}
          onClickCapture={e => { e.stopPropagation() }}
          style={{ background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)', color: '#fff', border: 'none', borderRadius: 100, padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          onClick={(e) => { e.stopPropagation(); /* handled by parent tap */ }}>
          Continuar →
        </button>
      </div>
    </div>
  )
}
 
// ─── SLIDE 10 — RESPIRO ──────────────────────────────────────────────────────
function S10({ carta, fotoUrl }: SP) {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', background: '#000' }}>
      {fotoUrl && (
        <img src={fotoUrl} alt="Foto" className="zoom-slow"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5)' }} />
      )}
      {!fotoUrl && <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.2 }} />}
    </div>
  )
}
 
// ─── SLIDE 11 — QUIZ ─────────────────────────────────────────────────────────
const QUIZ_PALAVRAS = [
  { label: carta_palavra1_placeholder('Casa'), resposta: 'porque é onde eu pertenço' },
  { label: carta_palavra2_placeholder('Incrível'), resposta: 'porque você é' },
  { label: carta_palavra3_placeholder('Amor'), resposta: 'porque virou isso pra mim' },
]
 
function carta_palavra1_placeholder(d: string) { return d }
function carta_palavra2_placeholder(d: string) { return d }
function carta_palavra3_placeholder(d: string) { return d }
 
function S11({ carta }: SP) {
  const [escolhida, setEscolhida] = useState<number | null>(null)
  const [finalizado, setFinalizado] = useState(false)
 
  const palavras = [
    { label: carta.jogo_palavra1 || 'Casa', resposta: 'porque é onde eu pertenço' },
    { label: carta.jogo_palavra2 || 'Incrível', resposta: 'porque você é' },
    { label: carta.jogo_palavra3 || 'Amor', resposta: 'porque virou isso pra mim' },
  ]
 
  function escolher(idx: number) {
    setEscolhida(idx)
    setTimeout(() => setFinalizado(true), 1200)
  }
 
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 360, width: '100%' }}
        onClick={e => e.stopPropagation()}>
        <Label>Jogo de palavras</Label>
        <Titulo>Se eu tivesse que te definir…</Titulo>
        <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!finalizado ? palavras.map((p, idx) => (
            <button key={idx} onClick={(e) => { e.stopPropagation(); escolher(idx) }}
              style={{
                padding: '16px 24px', borderRadius: 16, border: `1px solid ${escolhida === idx ? '#FF2E9A' : 'rgba(255,255,255,0.1)'}`,
                background: escolhida === idx ? 'rgba(255,46,154,0.15)' : 'rgba(255,255,255,0.04)',
                color: '#fff', fontSize: 17, fontWeight: 600, cursor: 'pointer', fontFamily: 'Poppins, sans-serif',
                transition: 'all 0.3s', textAlign: 'left',
              }}>
              {p.label}
              {escolhida === idx && (
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 400, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>
                  → {p.resposta}
                </p>
              )}
            </button>
          )) : (
            <div className="fade-in" style={{ padding: '24px 0', textAlign: 'center' }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, fontStyle: 'italic', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                "E ainda assim… faltariam palavras."
              </p>
            </div>
          )}
        </div>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 12 — CONEXÃO ──────────────────────────────────────────────────────
function S12({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 340 }}>
        <Titulo>Entre todos os caminhos…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 13 — COMPLEMENTO ──────────────────────────────────────────────────
function S13({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Titulo grad>você virou o meu favorito.</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 14 — MAPA DAS ESTRELAS ────────────────────────────────────────────
function S14({ carta }: SP) {
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
      <div className="fade-in-up" style={{ textAlign: 'center', width: '100%', maxWidth: 380 }}>
        <Label>Momento cósmico</Label>
        <Titulo>Naquele dia… o universo já sabia.</Titulo>
        {carta.recursos.includes('mapa_estrelas') && (
          <div style={{ marginTop: 32 }}>
            {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Gerando mapa das estrelas…</p>}
            {mapaUrl && (
              <div style={{ width: 220, height: 220, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '3px solid rgba(123,46,255,0.4)', boxShadow: '0 0 60px rgba(123,46,255,0.3)' }}>
                <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            {estacao && (
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
                {estacao.emoji} {estacao.nome} · {formatarData(carta.data_importante)}
              </p>
            )}
          </div>
        )}
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 15 — PRÉ-MÚSICA ───────────────────────────────────────────────────
function S15({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 340 }}>
        <Label>A trilha sonora</Label>
        <Titulo>Se nosso amor tivesse som…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 16 — PLAYER ───────────────────────────────────────────────────────
function S16({ carta, fotoUrl, spotifyId, musicaAtiva }: SP) {
  const [tocando, setTocando] = useState(false)
 
  return (
    <Tela center={false}>
      <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.15 }} />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 400, margin: 'auto', padding: '0 8px' }}>
        <Label>seria esse.</Label>
        {/* Capa */}
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 24, aspectRatio: '1', background: '#1a1a2e' }}
          onClick={e => e.stopPropagation()}>
          {fotoUrl && <img src={fotoUrl} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />}
          {!fotoUrl && <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {spotifyId && !tocando && (
              <button onClick={() => setTocando(true)}
                style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 30px rgba(123,46,255,0.6)' }}
                className="pulse-btn">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
              </button>
            )}
          </div>
          <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, fontFamily: 'Poppins, sans-serif' }}>Nossa música</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, fontFamily: 'Inter, sans-serif' }}>{carta.nome_remetente} & {carta.nome_destinatario}</p>
          </div>
        </div>
        {spotifyId && tocando && (
          <div onClick={e => e.stopPropagation()}>
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`}
              width="100%" height="152" frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ borderRadius: 16 }} />
          </div>
        )}
        {!spotifyId && carta.musica_link && (
          <a href={carta.musica_link} target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: 16, borderRadius: 100, background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)', color: '#fff', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
            Abrir no Spotify
          </a>
        )}
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 17 — SURPRESA ─────────────────────────────────────────────────────
function S17({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Titulo>Mas tem uma coisa que eu nunca te disse…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 18 — MENSAGEM COM TYPING ──────────────────────────────────────────
function S18({ carta }: SP) {
  const mensagem = carta.mensagem_principal || ''
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
 
  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < mensagem.length) {
        setTyped(mensagem.slice(0, i + 1))
        i++
      } else {
        setDone(true)
        clearInterval(interval)
      }
    }, 35)
    return () => clearInterval(interval)
  }, [mensagem])
 
  return (
    <Tela center={false}>
      <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.08 }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
        <Label>A mensagem</Label>
        <p style={{ color: '#fff', fontSize: 'clamp(18px, 4.5vw, 26px)', fontFamily: 'Inter, sans-serif', fontWeight: 500, lineHeight: 1.7, fontStyle: 'italic' }}>
          &ldquo;{typed}{!done && <span className="cursor" />}&rdquo;
        </p>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 19 — CLÍMAX ───────────────────────────────────────────────────────
function S19({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Titulo>Você não foi só um capítulo…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 20 — RESOLUÇÃO DO CLÍMAX ─────────────────────────────────────────
function S20({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Titulo grad>foi onde tudo fez sentido.</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 21 — DECLARAÇÃO ───────────────────────────────────────────────────
function S21({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>{carta.nome_remetente} diz:</p>
        <p style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 'clamp(40px, 10vw, 68px)',
          fontWeight: 900,
          lineHeight: 1.1,
          background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          {carta.nome_destinatario}…<br />eu te amo.
        </p>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 22 — FINAL CINEMATOGRÁFICO ────────────────────────────────────────
function S22({ carta }: SP) {
  return (
    <Tela>
      <div className="fade-in-up" style={{ textAlign: 'center', maxWidth: 360 }}>
        <Titulo>E eu escolheria você…</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 23 — FECHAMENTO ───────────────────────────────────────────────────
function S23({ carta }: SP) {
  return (
    <Tela>
      <div className="scale-in" style={{ textAlign: 'center', maxWidth: 400 }}>
        <Titulo grad>em todas as versões da vida.</Titulo>
      </div>
    </Tela>
  )
}
 
// ─── SLIDE 24 — BOTÃO FINAL ──────────────────────────────────────────────────
function S24({ carta, reiniciar }: SP) {
  const [copiado, setCopiado] = useState(false)
  const url = `https://www.lovefy.app.br/c/${carta.slug}`
 
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  useEffect(() => {
    const t = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(t)
  }, [carta.data_importante])
 
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
    <div style={{ minHeight: '100vh', background: '#0B0B0F', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 28px 48px', position: 'relative', overflow: 'hidden' }}>
      <div className="grad-bg" style={{ position: 'absolute', inset: 0, opacity: 0.1 }} />
      <div className="fade-in-up" style={{ position: 'relative', zIndex: 1, textAlign: 'center', width: '100%', maxWidth: 400 }}>
 
        {/* Contador ao vivo */}
        <div style={{ marginBottom: 40 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            {carta.nome_remetente} & {carta.nome_destinatario}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {[{ v: tempo.anos, l: 'Anos' }, { v: tempo.meses, l: 'Meses' }, { v: tempo.dias, l: 'Dias' }].map(i => (
              <div key={i.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 8px' }}>
                <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontFamily: 'Poppins, sans-serif' }}>{i.v}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 4 }}>{i.l}</p>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { v: String(tempo.horas).padStart(2, '0'), l: 'Horas' },
              { v: String(tempo.minutos).padStart(2, '0'), l: 'Min' },
              { v: String(tempo.segundos).padStart(2, '0'), l: 'Seg' },
            ].map(i => (
              <div key={i.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 8px' }}>
                <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums', fontFamily: 'Poppins, sans-serif' }}>{i.v}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 4 }}>{i.l}</p>
              </div>
            ))}
          </div>
        </div>
 
        {/* Botão principal */}
        <button
          className="glow-btn pulse-btn"
          onClick={compartilharWpp}
          style={{ width: '100%', padding: '20px', borderRadius: 100, background: 'linear-gradient(135deg, #7B2EFF, #FF2E9A)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 17, fontFamily: 'Poppins, sans-serif', marginBottom: 12 }}>
          💌 Escolher você de novo
        </button>
 
        {/* Compartilhar */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 32 }}>
          <button onClick={compartilharWpp}
            style={{ padding: 14, borderRadius: 100, background: '#25D366', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            WhatsApp
          </button>
          <button onClick={copiar}
            style={{ padding: 14, borderRadius: 100, background: 'rgba(255,255,255,0.06)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'Inter, sans-serif' }}>
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>
 
        {/* CTA criar */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 12, fontFamily: 'Inter, sans-serif' }}>
            Como {carta.nome_remetente} fez por você.
          </p>
          <a href="https://www.lovefy.app.br/criar"
            style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
            Criar minha carta
          </a>
        </div>
 
        <button onClick={reiniciar}
          style={{ background: 'transparent', color: 'rgba(255,255,255,0.2)', border: 'none', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Inter, sans-serif' }}>
          Rever do início
        </button>
      </div>
    </div>
  )
}