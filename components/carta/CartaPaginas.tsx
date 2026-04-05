'use client'

import { useState, useEffect, useRef } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

// ─── Máquina de estados da experiência ───────────────────────────────────────
type Ato =
  | 'tela_preta'      // 0–3s: tela preta + frase typewriter
  | 'nome_trovao'     // 3–8s: nome do remetente surge
  | 'botao_coragem'   // 8–20s: botão pulsante
  | 'capitulos'       // 20–60s: slides
  | 'climax'          // 60–90s: foto fullscreen + mensagem
  | 'final'           // 90–120s: contador + screenshot
  | 'pos_carta'       // após: rever + CTA

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #000; overflow-x: hidden; }

  @keyframes typewriter { from { width: 0 } to { width: 100% } }
  @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
  @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes scaleIn { from { opacity: 0; transform: scale(0.8) } to { opacity: 1; transform: scale(1) } }
  @keyframes pulse { 0%,100% { opacity: 0.7 } 50% { opacity: 1 } }
  @keyframes zoomSlow { from { transform: scale(1) } to { transform: scale(1.05) } }
  @keyframes countUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
  @keyframes slideInRight { from { opacity: 0; transform: translateX(40px) } to { opacity: 1; transform: translateX(0) } }
  @keyframes slideOutLeft { from { opacity: 1; transform: translateX(0) } to { opacity: 0; transform: translateX(-40px) } }

  .fade-in { animation: fadeIn 1s ease forwards; }
  .fade-in-up { animation: fadeInUp 0.8s ease forwards; }
  .scale-in { animation: scaleIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards; }
  .pulse-btn { animation: pulse 2s ease-in-out infinite; }
  .zoom-slow { animation: zoomSlow 10s ease-out forwards; }
  .slide-in { animation: slideInRight 0.6s ease forwards; }
  .slide-out { animation: slideOutLeft 0.4s ease forwards; }
`

export default function CartaViewer({ carta }: { carta: Carta }) {
  const [ato, setAto] = useState<Ato>('tela_preta')
  const [capitulo, setCapitulo] = useState(0)
  const [transitioning, setTransitioning] = useState(false)
  const [musicaIniciada, setMusicaIniciada] = useState(false)

  const capitulos = buildCapitulos(carta)

  function avancarAto(proximo: Ato) {
    setTransitioning(true)
    setTimeout(() => {
      setAto(proximo)
      setTransitioning(false)
    }, 400)
  }

  function avancarCapitulo() {
    if (capitulo < capitulos.length - 1) {
      setTransitioning(true)
      setTimeout(() => {
        setCapitulo(c => c + 1)
        setTransitioning(false)
      }, 400)
    } else {
      avancarAto('climax')
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', fontFamily: 'Inter, system-ui, sans-serif', position: 'relative', overflow: 'hidden' }}>
      <style>{STYLES}</style>

      <div style={{ opacity: transitioning ? 0 : 1, transition: 'opacity 0.4s ease' }}>

        {ato === 'tela_preta' && (
          <AtoPretaRespira
            carta={carta}
            onNext={() => avancarAto('nome_trovao')}
          />
        )}

        {ato === 'nome_trovao' && (
          <AtoNomeTrovao
            carta={carta}
            onNext={() => avancarAto('botao_coragem')}
            onMusicaIniciada={() => setMusicaIniciada(true)}
          />
        )}

        {ato === 'botao_coragem' && (
          <AtoBotaoCoragem
            carta={carta}
            onNext={() => avancarAto('capitulos')}
          />
        )}

        {ato === 'capitulos' && (
          <AtoCapitulos
            carta={carta}
            capitulo={capitulo}
            capitulos={capitulos}
            total={capitulos.length}
            onNext={avancarCapitulo}
            musicaIniciada={musicaIniciada}
          />
        )}

        {ato === 'climax' && (
          <AtoClimax
            carta={carta}
            onNext={() => avancarAto('final')}
          />
        )}

        {ato === 'final' && (
          <AtoFinal
            carta={carta}
            onNext={() => avancarAto('pos_carta')}
          />
        )}

        {ato === 'pos_carta' && (
          <AtoPosCarta
            carta={carta}
            onRever={() => {
              setCapitulo(0)
              setAto('tela_preta')
            }}
          />
        )}

      </div>
    </div>
  )
}

// ─── ATO 1: Tela preta que respira ───────────────────────────────────────────
function AtoPretaRespira({ carta, onNext }: { carta: Carta; onNext: () => void }) {
  const [fase, setFase] = useState<'silencio' | 'frase'>('silencio')
  const [typed, setTyped] = useState('')
  const frase = 'Alguém está pensando em você agora.'

  useEffect(() => {
    const t1 = setTimeout(() => setFase('frase'), 1200)
    return () => clearTimeout(t1)
  }, [])

  useEffect(() => {
    if (fase !== 'frase') return
    let i = 0
    const interval = setInterval(() => {
      if (i < frase.length) {
        setTyped(frase.slice(0, i + 1))
        i++
      } else {
        clearInterval(interval)
        setTimeout(onNext, 1000)
      }
    }, 80)
    return () => clearInterval(interval)
  }, [fase, onNext])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      {fase === 'frase' && (
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 300, textAlign: 'center', lineHeight: 1.6, letterSpacing: 0.5 }}>
          &ldquo;{typed}<span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(255,255,255,0.5)', marginLeft: 2, animation: 'pulse 0.8s infinite', verticalAlign: 'text-bottom' }} />&rdquo;
        </p>
      )}
    </div>
  )
}

// ─── ATO 1: Nome como trovão ──────────────────────────────────────────────────
function AtoNomeTrovao({ carta, onNext, onMusicaIniciada }: { carta: Carta; onNext: () => void; onMusicaIniciada: () => void }) {
  const [fase, setFase] = useState<'frase' | 'nome'>('frase')
  const spotifyId = getSpotifyId(carta.musica_link)

  useEffect(() => {
    const t1 = setTimeout(() => {
      setFase('nome')
      if (carta.musica_link) onMusicaIniciada()
    }, 1500)
    const t2 = setTimeout(onNext, 4000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [onNext, onMusicaIniciada, carta.musica_link])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, flexDirection: 'column', gap: 32 }}>
      {fase === 'frase' && (
        <p className="fade-in" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 18, fontWeight: 300, textAlign: 'center' }}>
          {carta.nome_remetente} preparou algo para você.
        </p>
      )}
      {fase === 'nome' && (
        <div className="scale-in" style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 12 }}>
            {carta.nome_remetente} preparou algo para você.
          </p>
          <h1 style={{ color: '#fff', fontSize: 'clamp(48px,10vw,80px)', fontWeight: 900, lineHeight: 1, letterSpacing: -2 }}>
            {carta.nome_destinatario}
          </h1>
        </div>
      )}
    </div>
  )
}

// ─── ATO 1: Botão que exige coragem ──────────────────────────────────────────
function AtoBotaoCoragem({ carta, onNext }: { carta: Carta; onNext: () => void }) {
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisivel(true), 600)
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
      {visivel && (
        <div className="fade-in-up" style={{ textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, marginBottom: 48, letterSpacing: 2, textTransform: 'uppercase' }}>
            uma carta especial te espera
          </p>
          <button
            onClick={onNext}
            className="pulse-btn"
            style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 100, padding: '20px 56px', fontSize: 18, fontWeight: 700, cursor: 'pointer', letterSpacing: -0.5 }}>
            Abrir a carta
          </button>
          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginTop: 16, fontStyle: 'italic' }}>
            {carta.nome_remetente} levou dias para escrever isso.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── ATO 2: Capítulos ────────────────────────────────────────────────────────
function AtoCapitulos({
  carta, capitulo, capitulos, total, onNext, musicaIniciada
}: {
  carta: Carta
  capitulo: number
  capitulos: React.ReactNode[]
  total: number
  onNext: () => void
  musicaIniciada: boolean
}) {
  const spotifyId = getSpotifyId(carta.musica_link)

  return (
    <div style={{ minHeight: '100vh', background: '#111', display: 'flex', flexDirection: 'column' }}>
      {/* Barra de progresso */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: `${((capitulo + 1) / total) * 100}%`, background: '#fff', transition: 'width 0.6s ease' }} />
      </div>

      {/* Player discreto no topo */}
      {spotifyId && (
        <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 100 }}>
          <details style={{ background: 'rgba(0,0,0,0.8)', borderRadius: 12, overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
            <summary style={{ padding: '8px 14px', color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', listStyle: 'none' }}>
              🎵 música
            </summary>
            <iframe
              src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
              width="260" height="80" frameBorder={0}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ display: 'block' }}
            />
          </details>
        </div>
      )}

      <div className="slide-in" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {capitulos[capitulo]}
      </div>

      <div style={{ padding: '20px 24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{capitulo + 1} / {total}</span>
        <button
          onClick={onNext}
          style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 100, padding: '14px 32px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
          {capitulo < total - 1 ? 'Continuar →' : 'Ver clímax →'}
        </button>
      </div>
    </div>
  )
}

// ─── ATO 2: Clímax visual ────────────────────────────────────────────────────
function AtoClimax({ carta, onNext }: { carta: Carta; onNext: () => void }) {
  const [mostrarMensagem, setMostrarMensagem] = useState(false)
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null

  useEffect(() => {
    setTimeout(() => setMostrarMensagem(true), 2000)
  }, [])

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={onNext}>
      {/* Foto fullscreen com zoom lento */}
      {fotoUrl ? (
        <img
          src={fotoUrl}
          className="zoom-slow"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          alt="Foto"
        />
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1a2e, #0f3460)' }} />
      )}

      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 100%)' }} />

      {/* Mensagem como subtítulo cinematográfico */}
      {mostrarMensagem && (
        <div className="fade-in" style={{ position: 'absolute', bottom: 60, left: 24, right: 24 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>
            {carta.nome_remetente} escreveu
          </p>
          <p style={{ color: '#fff', fontSize: 'clamp(20px,4vw,28px)', fontWeight: 700, lineHeight: 1.4, fontStyle: 'italic' }}>
            &ldquo;{carta.mensagem_principal?.slice(0, 120)}{(carta.mensagem_principal?.length || 0) > 120 ? '...' : ''}&rdquo;
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 32 }}>Toque para continuar</p>
        </div>
      )}
    </div>
  )
}

// ─── ATO 3: Final que vira screenshot ────────────────────────────────────────
function AtoFinal({ carta, onNext }: { carta: Carta; onNext: () => void }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const [visivel, setVisivel] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisivel(true), 300)
    const interval = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(interval)
  }, [carta.data_importante])

  const tempoLabel = tempo.anos > 0
    ? `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'}, ${tempo.dias} dias`
    : `${tempo.meses} meses, ${tempo.dias} dias`

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 32px', textAlign: 'center' }}>
      {visivel && (
        <div className="fade-in-up">
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 40 }}>
            {carta.nome_remetente} & {carta.nome_destinatario}
          </p>

          <div style={{ marginBottom: 16 }}>
            <span className="count-up" style={{ color: '#fff', fontSize: 'clamp(72px,18vw,120px)', fontWeight: 900, lineHeight: 1, display: 'block' }}>
              {tempo.anos > 0 ? tempo.anos : tempo.meses > 0 ? tempo.meses : tempo.dias}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 20, fontWeight: 300 }}>
              {tempo.anos > 0 ? (tempo.anos === 1 ? 'ano juntos' : 'anos juntos') : tempo.meses > 0 ? (tempo.meses === 1 ? 'mês juntos' : 'meses juntos') : 'dias juntos'}
            </span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 14, marginBottom: 64, fontStyle: 'italic' }}>
            Cada segundo valeu.
          </p>

          {/* Contador detalhado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 64, width: '100%', maxWidth: 320 }}>
            {[
              { v: String(tempo.horas).padStart(2, '0'), l: 'horas' },
              { v: String(tempo.minutos).padStart(2, '0'), l: 'min' },
              { v: String(tempo.segundos).padStart(2, '0'), l: 'seg' },
            ].map(item => (
              <div key={item.l} style={{ background: '#111', borderRadius: 12, padding: '16px 8px' }}>
                <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{item.v}</p>
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{item.l}</p>
              </div>
            ))}
          </div>

          <button
            onClick={onNext}
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '14px 32px', fontSize: 15, cursor: 'pointer' }}>
            Quero responder com uma carta
          </button>
        </div>
      )}
    </div>
  )
}

// ─── PÓS-CARTA ───────────────────────────────────────────────────────────────
function AtoPosCarta({ carta, onRever }: { carta: Carta; onRever: () => void }) {
  const [mostrarRever, setMostrarRever] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const url = `https://lovefy.app.br/c/${carta.slug}`

  useEffect(() => {
    setTimeout(() => setMostrarRever(true), 10000)
  }, [])

  function compartilharWhatsapp() {
    const texto = `${carta.nome_remetente} criou algo especial para ${carta.nome_destinatario}! Ver aqui: ${url}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function copiarLink() {
    navigator.clipboard.writeText(url)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', textAlign: 'center' }}>
      <div className="fade-in-up">
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>
          a história de vocês merece ser contada
        </p>

        <h2 style={{ color: '#fff', fontSize: 'clamp(24px,5vw,36px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 12, maxWidth: 400 }}>
          Crie uma carta para alguém especial
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, marginBottom: 48, maxWidth: 320 }}>
          Como {carta.nome_remetente} fez por {carta.nome_destinatario}.
        </p>

        <a href="https://lovefy.app.br/criar"
          style={{ display: 'inline-block', background: '#fff', color: '#000', fontWeight: 700, fontSize: 17, padding: '18px 48px', borderRadius: 100, textDecoration: 'none', marginBottom: 40 }}>
          Criar minha carta
        </a>

        {/* Compartilhar */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 40, flexWrap: 'wrap' }}>
          <button onClick={compartilharWhatsapp}
            style={{ background: '#25D366', color: '#fff', border: 'none', borderRadius: 100, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            WhatsApp
          </button>
          <button onClick={copiarLink}
            style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '12px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            {copiado ? 'Copiado!' : 'Copiar link'}
          </button>
        </div>

        {/* Botão rever discreto */}
        {mostrarRever && (
          <button
            onClick={onRever}
            className="fade-in"
            style={{ background: 'transparent', color: 'rgba(255,255,255,0.2)', border: 'none', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
            Rever do início
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Capítulos do ATO 2 ───────────────────────────────────────────────────────
function buildCapitulos(carta: Carta): React.ReactNode[] {
  const caps: React.ReactNode[] = []

  // Cap 1: Sobre o casal + contador
  caps.push(<CapContador carta={carta} key="contador" />)

  // Cap 2: Mensagem completa
  caps.push(<CapMensagem carta={carta} key="mensagem" />)

  // Cap 3: Galeria (se tiver)
  const fotos = carta.fotos?.filter(f => !f.is_temp) || []
  if (carta.recursos.includes('galeria') && fotos.length > 0) {
    caps.push(<CapGaleria carta={carta} key="galeria" />)
  }

  // Cap 4: Mapa + jogo (se tiver)
  if (carta.recursos.includes('mapa_estrelas') || carta.recursos.includes('jogo_palavras')) {
    caps.push(<CapExtras carta={carta} key="extras" />)
  }

  return caps
}

function CapContador({ carta }: { carta: Carta }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null
  const ano = new Date(carta.data_importante).getUTCFullYear()

  useEffect(() => {
    const interval = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(interval)
  }, [carta.data_importante])

  return (
    <div style={{ flex: 1, padding: '48px 24px 24px' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>Sobre o casal</p>
      {fotoUrl && (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 24, height: 240 }}>
          <img src={fotoUrl} alt="Casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
        {carta.nome_remetente} e {carta.nome_destinatario}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 24 }}>Juntos desde {ano}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { v: tempo.anos, l: 'Anos' },
          { v: tempo.meses, l: 'Meses' },
          { v: tempo.dias, l: 'Dias' },
        ].map(i => (
          <div key={i.l} style={{ background: '#1a1a1a', borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 32, fontWeight: 800 }}>{i.v}</p>
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
          <div key={i.l} style={{ background: '#1a1a1a', borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 28, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{i.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{i.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function CapMensagem({ carta }: { carta: Carta }) {
  const [mostrar, setMostrar] = useState(false)
  const preview = carta.mensagem_principal?.slice(0, 120) || ''
  const temMais = (carta.mensagem_principal?.length || 0) > 120

  return (
    <div style={{ flex: 1, padding: '48px 24px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 24 }}>Mensagem especial</p>
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <p style={{ color: '#fff', fontSize: 'clamp(18px,4vw,24px)', fontWeight: 600, lineHeight: 1.7, fontStyle: 'italic' }}>
          &ldquo;{mostrar ? carta.mensagem_principal : preview}{temMais && !mostrar ? '...' : ''}&rdquo;
        </p>
        {!mostrar && temMais && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, background: 'linear-gradient(to bottom, transparent, #111)' }} />
        )}
      </div>
      {!mostrar && temMais && (
        <button onClick={() => setMostrar(true)}
          style={{ alignSelf: 'flex-start', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 100, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>
          Ler tudo
        </button>
      )}
    </div>
  )
}

function CapGaleria({ carta }: { carta: Carta }) {
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []
  const [ativa, setAtiva] = useState(0)

  return (
    <div style={{ flex: 1, padding: '48px 0 24px' }}>
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Galeria de vocês</p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Deslize →</p>
      </div>
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 24, paddingRight: 24, paddingBottom: 12, scrollSnapType: 'x mandatory', scrollbarWidth: 'none' }}>
        {fotos.map((foto, idx) => (
          <div key={foto.id} onClick={() => setAtiva(idx)}
            style={{ flexShrink: 0, width: '75vw', maxWidth: 300, aspectRatio: '3/4', borderRadius: 16, overflow: 'hidden', scrollSnapAlign: 'start', border: idx === ativa ? '2px solid #fff' : '2px solid transparent', transition: 'border 0.2s' }}>
            <img src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
        {fotos.map((_, idx) => (
          <div key={idx} style={{ width: idx === ativa ? 20 : 6, height: 6, borderRadius: 3, background: idx === ativa ? '#fff' : 'rgba(255,255,255,0.2)', transition: 'all 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

function CapExtras({ carta }: { carta: Carta }) {
  const [mapaUrl, setMapaUrl] = useState(carta.mapa_estrelas_url || '')
  const [loadingMapa, setLoadingMapa] = useState(!carta.mapa_estrelas_url && carta.recursos.includes('mapa_estrelas'))
  const [jogoAcertos, setJogoAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [msgJogo, setMsgJogo] = useState('')
  const [jogoFinalizado, setJogoFinalizado] = useState(false)
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null

  const palavras: string[] = []
  if (carta.jogo_palavra1?.trim()) palavras.push(carta.jogo_palavra1.trim())
  if (carta.jogo_palavra2?.trim()) palavras.push(carta.jogo_palavra2.trim())
  if (carta.jogo_palavra3?.trim()) palavras.push(carta.jogo_palavra3.trim())
  if (palavras.length === 0) {
    if (carta.nome_remetente) palavras.push(carta.nome_remetente)
    if (carta.nome_destinatario) palavras.push(carta.nome_destinatario)
    palavras.push('amor')
  }
  const palavrasJogo = palavras.slice(0, 3)

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
      .finally(() => setLoadingMapa(false))
  }, [])

  function tentarJogo() {
    const p = tentativa.toLowerCase().trim()
    if (!p) return
    if (palavrasJogo.map(x => x.toLowerCase()).includes(p) && !jogoAcertos.includes(p)) {
      const novos = [...jogoAcertos, p]
      setJogoAcertos(novos)
      setMsgJogo('Acertou!')
      if (novos.length === palavrasJogo.length) setJogoFinalizado(true)
    } else if (jogoAcertos.includes(p)) {
      setMsgJogo('Já descobriu essa!')
    } else {
      setMsgJogo('Tente novamente!')
    }
    setTentativa('')
    setTimeout(() => setMsgJogo(''), 1500)
  }

  return (
    <div style={{ flex: 1, padding: '48px 24px 24px' }}>
      {carta.recursos.includes('mapa_estrelas') && (
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>O céu no dia de vocês</p>
          {loadingMapa && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Gerando mapa das estrelas...</p>}
          {mapaUrl && (
            <div style={{ width: '100%', maxWidth: 260, aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '3px solid rgba(255,255,255,0.08)' }}>
              <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {estacao && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>{estacao.emoji} {estacao.nome} · {formatarData(carta.data_importante)}</p>}
        </div>
      )}

      {carta.recursos.includes('jogo_palavras') && (
        <div>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Jogo de palavras</p>
          {jogoFinalizado ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 8 }}>🎊</p>
              <p style={{ color: '#fff', fontWeight: 700 }}>Você descobriu tudo!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {palavrasJogo.map(p => (
                  <div key={p} style={{ background: '#1a1a1a', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: jogoAcertos.includes(p.toLowerCase()) ? '#fff' : 'rgba(255,255,255,0.2)', fontSize: 16, fontWeight: 700, letterSpacing: jogoAcertos.includes(p.toLowerCase()) ? 0 : 4, marginBottom: 2 }}>
                        {jogoAcertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
                      </p>
                      {!jogoAcertos.includes(p.toLowerCase()) && (
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}>Dica: {p.length} letras</p>
                      )}
                    </div>
                    {jogoAcertos.includes(p.toLowerCase()) && <span style={{ color: '#fff' }}>✓</span>}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)} onKeyDown={e => e.key === 'Enter' && tentarJogo()}
                  placeholder="Digite uma palavra..."
                  style={{ flex: 1, background: '#1a1a1a', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 }} />
                <button onClick={tentarJogo} style={{ background: '#fff', color: '#000', padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}>→</button>
              </div>
              {msgJogo && <p style={{ color: msgJogo.includes('Acertou') ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8, textAlign: 'center' }}>{msgJogo}</p>}
            </>
          )}
        </div>
      )}
    </div>
  )
}