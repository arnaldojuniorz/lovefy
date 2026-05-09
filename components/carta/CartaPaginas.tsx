'use client'

import { useState, useEffect, useRef } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const BASE_URL    = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.lovefy.app.br'

function fotoPublicUrl(path: string) {
  return `${supabaseUrl}/storage/v1/object/public/fotos/${path}`
}

function copiarFallback(text: string) {
  const el = document.createElement('textarea')
  el.value = text
  el.style.position = 'fixed'
  el.style.opacity  = '0'
  document.body.appendChild(el)
  el.focus()
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
}

function copiarTexto(text: string, onCopied: () => void) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(onCopied)
      .catch(() => { copiarFallback(text); onCopied() })
  } else {
    copiarFallback(text)
    onCopied()
  }
}

export function SecaoAbertura({ carta }: { carta: Carta }) {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a0a 0%, #121212 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,185,84,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(29,185,84,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14 }}>✕</div>
        <div style={{ background: '#1DB954', color: '#000', fontWeight: 800, fontSize: 13, padding: '5px 14px', borderRadius: 100 }}>Wrapped</div>
        <div style={{ width: 36 }} />
      </div>
      <div style={{ textAlign: 'center', maxWidth: 380, position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: 'clamp(30px,7vw,44px)', fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 20 }}>
          {carta.nome_remetente} separou um{' '}
          <span style={{ color: '#1DB954' }}>presente</span> especial!
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, lineHeight: 1.6, marginBottom: 48 }}>
          Um momento único feito com carinho para celebrar a jornada de vocês
        </p>
        <div
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          style={{ background: '#1DB954', color: '#000', fontWeight: 700, fontSize: 17, padding: '16px 48px', borderRadius: 100, display: 'inline-block', cursor: 'pointer' }}>
          Ver Presente
        </div>
      </div>
    </div>
  )
}

export function SecaoPlayer({ carta }: { carta: Carta }) {
  const spotifyId = getSpotifyId(carta.musica_link)
  const fotoUrl   = carta.foto_destaque ? fotoPublicUrl(carta.foto_destaque) : null
  const [tocando, setTocando] = useState(false)

  return (
    <div style={{ background: 'linear-gradient(180deg, #1a4a6e 0%, #0d2d45 100%)', minHeight: '100vh', padding: '56px 20px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>↓</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Juntos para sempre ❤️</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>···</span>
      </div>

      <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 28, width: '100%', aspectRatio: '1', background: '#1a1a1a' }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto de destaque do casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, minHeight: 300 }}>💝</div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', pointerEvents: 'none' }} />

        <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ color: '#fff', fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Nossa música especial</p>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>{carta.nome_remetente} & {carta.nome_destinatario}</p>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
            <span style={{ color: '#1DB954', fontSize: 14 }}>✓</span>
          </div>
        </div>

        {spotifyId && !tocando && (
          <button
            onClick={() => setTocando(true)}
            aria-label="Reproduzir música"
            style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 72, height: 72, borderRadius: '50%', background: '#1DB954', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#000">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>

      {spotifyId && tocando && (
        <iframe
          src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0&autoplay=1`}
          width="100%" height="152" frameBorder={0}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy" style={{ borderRadius: 12 }}
          title="Player Spotify"
        />
      )}

      {!spotifyId && carta.musica_link && (
        <a href={carta.musica_link} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, background: '#1DB954', color: '#000', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          Abrir no Spotify
        </a>
      )}
    </div>
  )
}

export function SecaoContador({ carta }: { carta: Carta }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const fotoUrl = carta.foto_destaque ? fotoPublicUrl(carta.foto_destaque) : null

  useEffect(() => {
    const interval = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(interval)
  }, [carta.data_importante])

  const ano = new Date(carta.data_importante).getUTCFullYear()

  return (
    <div style={{ background: '#1a1a1a', padding: '40px 20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sobre o casal</p>
      {fotoUrl && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, height: 220 }}>
          <img src={fotoUrl} alt="Foto do casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
        {carta.nome_remetente} e {carta.nome_destinatario}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Juntos desde {ano}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { v: tempo.anos,  l: 'Anos' },
          { v: tempo.meses, l: 'Meses' },
          { v: tempo.dias,  l: 'Dias' },
        ].map(item => (
          <div key={item.l} style={{ background: '#2a2a2a', borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{item.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{item.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { v: String(tempo.horas).padStart(2,   '0'), l: 'Horas' },
          { v: String(tempo.minutos).padStart(2,  '0'), l: 'Minutos' },
          { v: String(tempo.segundos).padStart(2, '0'), l: 'Segundos' },
        ].map(item => (
          <div key={item.l} style={{ background: '#2a2a2a', borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{item.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{item.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SecaoMensagem({ carta }: { carta: Carta }) {
  const [mostrar, setMostrar] = useState(false)
  const preview = carta.mensagem_principal?.slice(0, 80) || ''
  const temMais = (carta.mensagem_principal?.length || 0) > 80

  return (
    <div style={{ background: '#1a7aad', padding: '40px 20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Mensagem especial</p>
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.4 }}>
          {mostrar ? carta.mensagem_principal : preview + (temMais ? '...' : '')}
        </p>
        {!mostrar && temMais && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, #1a7aad)' }} />
        )}
      </div>
      {!mostrar && temMais && (
        <button
          onClick={() => setMostrar(true)}
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 100, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          Mostrar Mensagem
        </button>
      )}
    </div>
  )
}

export function SecaoFotos({ carta }: { carta: Carta }) {
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []
  if (fotos.length === 0) return null
  const labels = ['Nossos Dates', 'Fotos aleatórias', 'Primeira viagem', 'Momentos', 'Favoritas']

  return (
    <div style={{ background: '#121212', padding: '40px 20px' }}>
      <h2 style={{ color: '#fff', fontSize: 24, fontWeight: 800, marginBottom: 20 }}>
        Conheça {carta.nome_remetente} e {carta.nome_destinatario}
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
        {fotos.map((foto, idx) => (
          <div key={foto.id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
            <img src={fotoPublicUrl(foto.storage_path)} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 8px 8px', background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <p style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{labels[idx] || ''}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SecaoRetrospectiva({ carta }: { carta: Carta }) {
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  function irPara(idx: number) {
    setFotoAtiva(idx)
    const el = scrollRef.current?.children[idx] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
  }

  return (
    <div style={{ background: '#0a0a0a', padding: '40px 0', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 30% 40%, rgba(220,30,80,0.2) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(220,30,80,0.12) 0%, transparent 60%)', pointerEvents: 'none' }} />
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.6 }} viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <path d="M-50 80 Q100 140 200 40 Q300 -40 450 30"  stroke="rgba(220,30,80,0.7)" strokeWidth="32" fill="none" strokeLinecap="round" />
        <path d="M-50 340 Q50 390 150 320 Q250 250 400 300" stroke="rgba(220,30,80,0.5)" strokeWidth="26" fill="none" strokeLinecap="round" />
        <path d="M80 460 Q180 500 280 440 Q380 380 480 420" stroke="rgba(180,20,60,0.4)" strokeWidth="20" fill="none" strokeLinecap="round" />
      </svg>
      <div style={{ position: 'relative', zIndex: 1, padding: '0 20px', marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 'clamp(28px,6vw,40px)', fontWeight: 900, marginBottom: 6 }}>Galeria de vocês</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Deslize para ver todos os momentos →</p>
      </div>
      {fotos.length > 0 ? (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div ref={scrollRef} style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingLeft: 20, paddingRight: 20, paddingBottom: 12, scrollSnapType: 'x mandatory', msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
            {fotos.map((foto, idx) => (
              <div key={foto.id} onClick={() => setFotoAtiva(idx)} style={{ flexShrink: 0, width: '80vw', maxWidth: 320, aspectRatio: '3/4', borderRadius: 20, overflow: 'hidden', scrollSnapAlign: 'start', border: idx === fotoAtiva ? '3px solid #1DB954' : '3px solid transparent', transition: 'border 0.2s' }}>
                <img src={fotoPublicUrl(foto.storage_path)} alt={`Foto ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16, padding: '0 20px' }} role="tablist" aria-label="Navegação de fotos">
            {fotos.map((_, idx) => (
              <div key={idx} onClick={() => irPara(idx)} role="tab" aria-selected={idx === fotoAtiva} style={{ width: idx === fotoAtiva ? 20 : 6, height: 6, borderRadius: 3, background: idx === fotoAtiva ? '#1DB954' : 'rgba(255,255,255,0.2)', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Adicione fotos para aparecerem aqui</p>
        </div>
      )}
    </div>
  )
}

export function SecaoWrapped({ carta }: { carta: Carta }) {
  const [mapaUrl, setMapaUrl]         = useState(carta.mapa_estrelas_url || '')
  const [loadingMapa, setLoadingMapa] = useState(
    !carta.mapa_estrelas_url && carta.recursos.includes('mapa_estrelas')
  )
  const [jogoAcertos, setJogoAcertos]     = useState<string[]>([])
  const [tentativa, setTentativa]         = useState('')
  const [msgJogo, setMsgJogo]             = useState('')
  const [jogoFinalizado, setJogoFinalizado] = useState(false)
  const [copiado, setCopiado]             = useState(false)
  const [mostrarStories, setMostrarStories] = useState(false)

  const tempo   = carta.data_importante ? calcularTempo(carta.data_importante) : null
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null
  const fotos   = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []

  const palavras: string[] = []
  if (carta.jogo_palavra1?.trim()) palavras.push(carta.jogo_palavra1.trim())
  if (carta.jogo_palavra2?.trim()) palavras.push(carta.jogo_palavra2.trim())
  if (carta.jogo_palavra3?.trim()) palavras.push(carta.jogo_palavra3.trim())
  if (palavras.length === 0) {
    if (carta.nome_remetente)    palavras.push(carta.nome_remetente)
    if (carta.nome_destinatario) palavras.push(carta.nome_destinatario)
    palavras.push('amor')
  }
  const palavrasJogo = palavras.slice(0, 3)

  const tempoLabel = tempo
    ? tempo.anos  > 0 ? `${tempo.anos}  ${tempo.anos  === 1 ? 'ano'  : 'anos'}  juntos`
    : tempo.meses > 0 ? `${tempo.meses} ${tempo.meses === 1 ? 'mês'  : 'meses'} juntos`
    : `${tempo.dias} dias juntos`
    : ''

  const cartaUrl = `${BASE_URL}/c/${carta.slug}`

  // Dependências completas — sem violação de exhaustive-deps
  useEffect(() => {
    if (!carta.recursos.includes('mapa_estrelas') || carta.mapa_estrelas_url) return
    fetch('/api/mapa-estrelas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ data: carta.data_importante, carta_id: carta.id }),
    })
      .then(r => r.json())
      .then(d => { if (d.imageUrl) setMapaUrl(d.imageUrl) })
      .catch(() => {})
      .finally(() => setLoadingMapa(false))
  }, [carta.id, carta.data_importante, carta.recursos, carta.mapa_estrelas_url])

  function tentarJogo() {
    const p = tentativa.toLowerCase().trim()
    if (!p) return
    if (palavrasJogo.map(x => x.toLowerCase()).includes(p) && !jogoAcertos.includes(p)) {
      const novos = [...jogoAcertos, p]
      setJogoAcertos(novos)
      setMsgJogo('Acertou! 🎉')
      if (novos.length === palavrasJogo.length) setJogoFinalizado(true)
    } else if (jogoAcertos.includes(p)) {
      setMsgJogo('Já descobriu essa!')
    } else {
      setMsgJogo('Tente novamente!')
    }
    setTentativa('')
    setTimeout(() => setMsgJogo(''), 1500)
  }

  function getDica(palavra: string): string {
    const len = palavra.length
    if (len <= 3) return `Palavra curta — ${len} letras`
    if (len <= 5) return `${len} letras`
    if (len <= 8) return `Palavra com ${len} letras`
    return `Palavra longa — ${len} letras`
  }

  function compartilharWhatsapp() {
    const texto = `${carta.nome_remetente} criou algo especial para ${carta.nome_destinatario}! Ver aqui: ${cartaUrl}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
  }

  function copiarLink() {
    copiarTexto(cartaUrl, () => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    })
  }

  async function compartilharStories() {
    const canvas = document.createElement('canvas')
    canvas.width  = 1080
    canvas.height = 1920
    const ctx = canvas.getContext('2d')
    if (!ctx) { setMostrarStories(true); return }

    const grad = ctx.createLinearGradient(0, 0, 1080, 1920)
    grad.addColorStop(0,   '#1DB954')
    grad.addColorStop(0.5, '#0d8c3c')
    grad.addColorStop(1,   '#121212')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 1080, 1920)

    ctx.fillStyle  = '#fff'
    ctx.font       = 'bold 80px Inter, sans-serif'
    ctx.textAlign  = 'center'
    ctx.fillText(`${carta.nome_remetente} & ${carta.nome_destinatario}`, 540, 900)

    if (tempo) {
      ctx.font      = 'bold 160px Inter, sans-serif'
      ctx.fillStyle = '#fff'
      const num = tempo.anos > 0 ? tempo.anos : tempo.meses > 0 ? tempo.meses : tempo.dias
      ctx.fillText(String(num), 540, 1100)
      ctx.font      = '60px Inter, sans-serif'
      ctx.fillStyle = 'rgba(255,255,255,0.7)'
      ctx.fillText(tempoLabel, 540, 1200)
    }

    ctx.font      = 'bold 48px Inter, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.fillText(BASE_URL.replace('https://', ''), 540, 1750)

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) { setMostrarStories(true); return }
        const file = new File([blob], 'lovefy-wrapped.png', { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Lovefy Wrapped', text: `Ver presente: ${cartaUrl}` })
        } else {
          setMostrarStories(true)
        }
      }, 'image/png')
    } catch {
      setMostrarStories(true)
    }
  }

  return (
    <div style={{ background: '#121212', padding: '40px 20px 60px' }}>

      {/* Modal Stories */}
      {mostrarStories && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ width: '100%', maxWidth: 360 }}>
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'linear-gradient(135deg, #1DB954 0%, #0d8c3c 40%, #121212 100%)', aspectRatio: '9/16', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, position: 'relative' }}>
              <div style={{ position: 'absolute', top: 24, left: 24, right: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 18 }}>Lovefy</span>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Wrapped</span>
              </div>
              {carta.foto_destaque && (
                <div style={{ width: 120, height: 120, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,0.3)', marginBottom: 24 }}>
                  <img src={fotoPublicUrl(carta.foto_destaque)} alt="Foto do casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <h2 style={{ color: '#fff', fontSize: 28, fontWeight: 900, textAlign: 'center', marginBottom: 12, lineHeight: 1.2 }}>
                {carta.nome_remetente} & {carta.nome_destinatario}
              </h2>
              {tempo && (
                <p style={{ color: '#fff', fontSize: 56, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
                  {tempo.anos > 0 ? tempo.anos : tempo.meses > 0 ? tempo.meses : tempo.dias}
                </p>
              )}
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18, marginBottom: 32 }}>{tempoLabel}</p>
              <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 12, padding: '10px 20px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 2 }}>Ver presente completo</p>
                <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>{BASE_URL.replace('https://', '')}/c/{carta.slug}</p>
              </div>
            </div>
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>
                Salve a imagem e poste nos Stories do Instagram
              </p>
              <button
                onClick={() => copiarTexto(cartaUrl, () => { setCopiado(true); setTimeout(() => setCopiado(false), 2500) })}
                style={{ padding: '14px', borderRadius: 100, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>
                {copiado ? 'Link copiado! Cole nos Stories' : 'Copiar link para Stories'}
              </button>
              <button
                onClick={() => setMostrarStories(false)}
                style={{ padding: '12px', borderRadius: 100, background: 'rgba(255,255,255,0.1)', color: '#fff', fontWeight: 600, fontSize: 14, border: 'none', cursor: 'pointer' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Wrapped */}
      <div style={{ background: 'linear-gradient(135deg, #1DB954, #0d8c3c)', borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center' }}>
        <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Lovefy Wrapped</p>
        <h2 style={{ color: '#000', fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </h2>
        {tempo && <p style={{ color: 'rgba(0,0,0,0.7)', fontSize: 16, fontWeight: 600 }}>{tempoLabel}</p>}
      </div>

      {/* Mapa das estrelas */}
      {carta.recursos.includes('mapa_estrelas') && (
        <div style={{ background: '#0d0d1a', borderRadius: 20, padding: '28px 24px', marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 20 }}>O céu no dia de vocês</p>
          {loadingMapa && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Gerando mapa das estrelas...</p>}
          {mapaUrl && (
            <div style={{ width: '100%', maxWidth: 280, aspectRatio: '1', borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: '4px solid rgba(255,255,255,0.08)', boxShadow: '0 0 60px rgba(255,255,255,0.05)' }}>
              <img src={mapaUrl} alt="Mapa das estrelas no dia especial" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {estacao && (
            <div>
              <p style={{ color: '#fff', fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{estacao.emoji} {estacao.nome}</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{formatarData(carta.data_importante)}</p>
            </div>
          )}
        </div>
      )}

      {/* Jogo de palavras */}
      {carta.recursos.includes('jogo_palavras') && (
        <div style={{ background: '#1a1a1a', borderRadius: 20, padding: '24px', marginBottom: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>Jogo de palavras</p>
          {jogoFinalizado ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎊</div>
              <p style={{ color: '#1DB954', fontWeight: 700, fontSize: 16 }}>Você descobriu tudo!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {palavrasJogo.map((p) => (
                  <div key={p} style={{ background: '#2a2a2a', borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ color: jogoAcertos.includes(p.toLowerCase()) ? '#1DB954' : 'rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 700, letterSpacing: jogoAcertos.includes(p.toLowerCase()) ? 0 : 4, marginBottom: 4 }}>
                        {jogoAcertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
                      </p>
                      {!jogoAcertos.includes(p.toLowerCase()) && (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Dica: {getDica(p)}</p>
                      )}
                    </div>
                    {jogoAcertos.includes(p.toLowerCase()) && (
                      <span style={{ color: '#1DB954', fontSize: 20 }}>✓</span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={tentativa}
                  onChange={e => setTentativa(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && tentarJogo()}
                  placeholder="Digite uma palavra..."
                  style={{ flex: 1, background: '#2a2a2a', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 }}
                />
                <button onClick={tentarJogo} style={{ background: '#1DB954', color: '#000', padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>→</button>
              </div>
              {msgJogo && <p style={{ textAlign: 'center', color: msgJogo.includes('Acertou') ? '#1DB954' : '#e8375a', fontSize: 13, marginTop: 8 }}>{msgJogo}</p>}
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>{jogoAcertos.length}/{palavrasJogo.length} descobertas</p>
            </>
          )}
        </div>
      )}

      {/* Galeria horizontal */}
      {fotos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Momentos juntos</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {fotos.map((foto, idx) => (
              <img key={foto.id} src={fotoPublicUrl(foto.storage_path)} alt={`Momento ${idx + 1}`}
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      {/* Resumo */}
      <div style={{ background: '#1a1a1a', borderRadius: 20, padding: '28px 24px', marginBottom: 20, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Lovefy Wrapped</p>
        <p style={{ fontSize: 40, marginBottom: 12 }}>💝</p>
        <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </h3>
        {tempo && (
          <p style={{ color: '#1DB954', fontSize: 40, fontWeight: 900, lineHeight: 1, marginBottom: 4 }}>
            {tempo.anos > 0 ? tempo.anos : tempo.meses > 0 ? tempo.meses : tempo.dias}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>{tempoLabel}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Criado com amor no Lovefy</p>
      </div>

      {/* Botões de compartilhamento */}
      <button onClick={compartilharWhatsapp} style={{ width: '100%', padding: '16px', borderRadius: 100, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
        WhatsApp
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <button onClick={compartilharStories}
          style={{ padding: 14, borderRadius: 100, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Stories
        </button>
        <button onClick={copiarLink}
          style={{ padding: 14, borderRadius: 100, fontSize: 14, fontWeight: 700, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
          {copiado ? 'Copiado!' : 'Copiar link'}
        </button>
      </div>

      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16 }}>Quer criar uma carta para alguém especial?</p>
        <a href={`${BASE_URL}/criar`} style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 700, background: '#1DB954', color: '#000', textDecoration: 'none' }}>
          Criar minha carta
        </a>
      </div>
    </div>
  )
}