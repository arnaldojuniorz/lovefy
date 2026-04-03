'use client'

import { useState, useEffect } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export function SecaoAbertura({ carta }: { carta: Carta }) {
  return (
    <div style={{ minHeight: '100vh', background: '#121212', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 20, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</div>
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
        <div style={{ background: '#1DB954', color: '#000', fontWeight: 700, fontSize: 17, padding: '16px 48px', borderRadius: 100, display: 'inline-block' }}>
          Ver Presente
        </div>
      </div>
    </div>
  )
}

export function SecaoPlayer({ carta }: { carta: Carta }) {
  const spotifyId = getSpotifyId(carta.musica_link)
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null

  return (
    <div style={{ background: 'linear-gradient(180deg, #1a4a6e 0%, #0d2d45 100%)', minHeight: '100vh', padding: '56px 20px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 22 }}>↓</span>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Juntos para sempre ❤️</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>···</span>
      </div>
      <div style={{ borderRadius: 8, overflow: 'hidden', marginBottom: 28, width: '100%', aspectRatio: '1' }}>
        {fotoUrl ? (
          <img src={fotoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>💝</div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <p style={{ color: '#fff', fontWeight: 700, fontSize: 20, marginBottom: 2 }}>Nossa música especial</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>{carta.nome_remetente} & {carta.nome_destinatario}</p>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '2px solid #1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#1DB954', fontSize: 14 }}>✓</span>
        </div>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 6, position: 'relative' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '5%', background: '#fff', borderRadius: 2 }} />
        <div style={{ position: 'absolute', left: '5%', top: '50%', transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: '#fff' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
        <span>0:02</span><span>-4:45</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>⇄</span>
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>⏮</span>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>⏸</div>
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>⏭</span>
        <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)' }}>↻</span>
      </div>
      {spotifyId && (
        <div style={{ borderRadius: 12, overflow: 'hidden' }}>
          <iframe
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%" height="80" frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" style={{ borderRadius: 12 }}
          />
        </div>
      )}
      {!spotifyId && carta.musica_link && (
        <a href={carta.musica_link} target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, background: '#1DB954', color: '#000', fontWeight: 700, textDecoration: 'none', fontSize: 15 }}>
          🎵 Abrir no Spotify
        </a>
      )}
    </div>
  )
}

export function SecaoContador({ carta }: { carta: Carta }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null

  useEffect(() => {
    const interval = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(interval)
  }, [carta.data_importante])

  const ano = new Date(carta.data_importante).getUTCFullYear()

  return (
    <div style={{ background: '#1a1a1a', minHeight: '100vh', padding: '40px 20px' }}>
      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Sobre o casal</p>
      {fotoUrl && (
        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 20, height: 220 }}>
          <img src={fotoUrl} alt="Casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}
      <h2 style={{ color: '#fff', fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
        {carta.nome_remetente} e {carta.nome_destinatario}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 24 }}>Juntos desde {ano}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        {[
          { v: tempo.anos, l: 'Anos' },
          { v: tempo.meses, l: 'Meses' },
          { v: tempo.dias, l: 'Dias' },
        ].map(item => (
          <div key={item.l} style={{ background: '#2a2a2a', borderRadius: 12, padding: '16px 8px', textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1 }}>{item.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginTop: 4 }}>{item.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { v: String(tempo.horas).padStart(2, '0'), l: 'Horas' },
          { v: String(tempo.minutos).padStart(2, '0'), l: 'Minutos' },
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

  return (
    <div style={{ background: '#1a7aad', minHeight: '60vh', padding: '40px 20px', borderRadius: '24px 24px 0 0', marginTop: -24 }}>
      <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Mensagem especial</p>
      <div style={{ position: 'relative' }}>
        <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, lineHeight: 1.4, marginBottom: mostrar ? 16 : 0 }}>
          {mostrar ? carta.mensagem_principal : preview + (carta.mensagem_principal?.length > 80 ? '...' : '')}
        </p>
        {!mostrar && carta.mensagem_principal?.length > 80 && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, transparent, #1a7aad)' }} />
        )}
      </div>
      {!mostrar && (
        <button
          onClick={() => setMostrar(true)}
          style={{ marginTop: 20, background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 100, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
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
            <img
              src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`}
              alt="Foto"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
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
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null

  return (
    <div style={{ background: '#121212', minHeight: '100vh', padding: '0 0 40px', position: 'relative', overflow: 'hidden' }}>
      {/* Fundo com ribbons decorativos estilo Spotify */}
      <div style={{ position: 'relative', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(220,30,80,0.4) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(220,30,80,0.2) 0%, transparent 60%)', pointerEvents: 'none' }} />
        {/* Ribbons decorativos */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice">
          <path d="M-50 150 Q100 200 200 100 Q300 0 450 80" stroke="rgba(220,30,80,0.6)" strokeWidth="40" fill="none" strokeLinecap="round" />
          <path d="M-50 450 Q50 500 150 420 Q250 340 400 400 Q500 440 550 480" stroke="rgba(220,30,80,0.5)" strokeWidth="35" fill="none" strokeLinecap="round" />
          <path d="M100 600 Q200 650 300 580 Q400 510 500 560" stroke="rgba(180,20,60,0.4)" strokeWidth="28" fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <h2 style={{ color: '#fff', fontSize: 'clamp(36px,8vw,52px)', fontWeight: 900, marginBottom: 12 }}>
            Sua Retrospectiva
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 18 }}>
            Explore o seu tempo de casal
          </p>
        </div>
        <div style={{ position: 'absolute', bottom: 48, zIndex: 1 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', color: '#fff', fontWeight: 700, fontSize: 16, padding: '14px 40px', borderRadius: 100 }}>
            Vamos lá
          </div>
        </div>
      </div>

      {/* Linha do tempo */}
      <div style={{ padding: '0 20px' }}>
        {[
          carta.como_se_conheceram && { emoji: '💫', titulo: 'Como se conheceram', desc: carta.como_se_conheceram, cor: '#1a4a6e' },
          carta.data_importante && { emoji: estacao?.emoji || '📅', titulo: 'Data especial', desc: `${formatarData(carta.data_importante)} — ${estacao?.nome}`, cor: '#2d1a4e' },
          carta.memoria_especial && { emoji: '🌟', titulo: 'Memória especial', desc: carta.memoria_especial, cor: '#1a3a2e' },
          carta.momento_marcante && { emoji: '✨', titulo: 'Momento marcante', desc: carta.momento_marcante, cor: '#4e1a2e' },
          carta.localizacao && { emoji: '📍', titulo: 'Lugar especial', desc: carta.localizacao, cor: '#1a2e4e' },
        ].filter(Boolean).map((m: any, i: number) => (
          <div key={i} style={{ background: m.cor, borderRadius: 16, padding: '20px', marginBottom: 12 }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>{m.emoji} {m.titulo}</p>
            <p style={{ color: '#fff', fontSize: 15, lineHeight: 1.6 }}>{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SecaoWrapped({ carta }: { carta: Carta }) {
  const [mapaUrl, setMapaUrl] = useState(carta.mapa_estrelas_url || '')
  const [loadingMapa, setLoadingMapa] = useState(!carta.mapa_estrelas_url && carta.recursos.includes('mapa_estrelas'))
  const [jogoAcertos, setJogoAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [msgJogo, setMsgJogo] = useState('')
  const [jogoFinalizado, setJogoFinalizado] = useState(false)
  const [copiado, setCopiado] = useState(false)
  const tempo = carta.data_importante ? calcularTempo(carta.data_importante) : null
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []

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
      setMsgJogo('Acertou! 🎉')
      if (novos.length === palavrasJogo.length) setJogoFinalizado(true)
    } else if (jogoAcertos.includes(p)) {
      setMsgJogo('Já descobriu essa! 😄')
    } else {
      setMsgJogo('Tente novamente! 🤔')
    }
    setTentativa('')
    setTimeout(() => setMsgJogo(''), 1500)
  }

  function compartilhar() {
    const url = `https://lovefy.app.br/c/${carta.slug}`
    if (navigator.share) {
      navigator.share({ title: 'Lovefy', text: `${carta.nome_remetente} criou algo especial`, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  const tempoLabel = tempo
    ? tempo.anos > 0 ? `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'} juntos`
    : tempo.meses > 0 ? `${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'} juntos`
    : `${tempo.dias} dias juntos`
    : ''

  return (
    <div style={{ background: '#121212', padding: '40px 20px 60px' }}>

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
        <div style={{ background: '#1a1a2e', borderRadius: 20, padding: '24px', marginBottom: 12, textAlign: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>⭐ O céu no dia de vocês</p>
          {loadingMapa && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Gerando mapa das estrelas...</p>}
          {mapaUrl && (
            <div style={{ width: 180, height: 180, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 12px', border: '3px solid rgba(255,255,255,0.1)' }}>
              <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {estacao && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>{estacao.emoji} {estacao.nome} · {formatarData(carta.data_importante)}</p>}
        </div>
      )}

      {/* Jogo de palavras */}
      {carta.recursos.includes('jogo_palavras') && (
        <div style={{ background: '#1a1a1a', borderRadius: 20, padding: '24px', marginBottom: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16, textAlign: 'center' }}>🎮 Jogo de palavras</p>
          {jogoFinalizado ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎊</div>
              <p style={{ color: '#1DB954', fontWeight: 700, fontSize: 16 }}>Você descobriu tudo!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {palavrasJogo.map(p => (
                  <div key={p} style={{ padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 600, background: jogoAcertos.includes(p.toLowerCase()) ? '#1DB954' : '#2a2a2a', color: jogoAcertos.includes(p.toLowerCase()) ? '#000' : 'rgba(255,255,255,0.3)', letterSpacing: jogoAcertos.includes(p.toLowerCase()) ? 0 : 4, transition: 'all 0.3s' }}>
                    {jogoAcertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)} onKeyDown={e => e.key === 'Enter' && tentarJogo()} placeholder="Digite uma palavra..."
                  style={{ flex: 1, background: '#2a2a2a', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,255,255,0.1)', fontSize: 14 }} />
                <button onClick={tentarJogo} style={{ background: '#1DB954', color: '#000', padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 18 }}>→</button>
              </div>
              {msgJogo && <p style={{ textAlign: 'center', color: msgJogo.includes('Acertou') ? '#1DB954' : '#e8375a', fontSize: 13, marginTop: 8 }}>{msgJogo}</p>}
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>{jogoAcertos.length}/{palavrasJogo.length} descobertas</p>
            </>
          )}
        </div>
      )}

      {/* Momento marcante */}
      {carta.momento_marcante && (
        <div style={{ background: '#1a1a1a', borderRadius: 20, padding: '24px', marginBottom: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>✨ Momento marcante</p>
          <p style={{ color: '#fff', fontSize: 15, lineHeight: 1.6 }}>{carta.momento_marcante}</p>
          {carta.localizacao && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>📍 {carta.localizacao}</p>}
        </div>
      )}

      {/* Galeria horizontal */}
      {fotos.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>📸 Momentos juntos</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {fotos.map(foto => (
              <img key={foto.id} src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto"
                style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      {/* Resumo compartilhável */}
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

      {/* Botões compartilhar */}
      <button onClick={compartilhar} style={{ width: '100%', padding: '16px', borderRadius: 100, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 12 }}>
        {copiado ? '✅ Link copiado!' : '💚 Compartilhar no WhatsApp'}
      </button>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
          style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 100, fontSize: 14, fontWeight: 700, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', textDecoration: 'none' }}>
          📸 Stories
        </a>
        <button onClick={() => { navigator.clipboard.writeText(`https://lovefy.app.br/c/${carta.slug}`); setCopiado(true); setTimeout(() => setCopiado(false), 2500) }}
          style={{ padding: 14, borderRadius: 100, fontSize: 14, fontWeight: 700, background: '#2a2a2a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer' }}>
          🔗 Copiar link
        </button>
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 16 }}>Quer criar uma carta para alguém especial?</p>
        <a href="https://lovefy.app.br/criar" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 700, background: '#1DB954', color: '#000', textDecoration: 'none' }}>
          💝 Criar minha carta
        </a>
      </div>
    </div>
  )
}