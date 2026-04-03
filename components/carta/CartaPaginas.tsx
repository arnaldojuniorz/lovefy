'use client'

import { useState, useEffect } from 'react'
import { Carta, getEstacao, getSpotifyId, formatarData, calcularTempo } from './CartaTypes'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export function Pagina1Abertura({ carta }: { carta: Carta }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 0' }}>
      <div className="lv-float" style={{ fontSize: 80, marginBottom: 32 }}>💌</div>
      <p className="lv-sans" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
        Uma surpresa especial
      </p>
      <h1 className="lv-serif" style={{ fontSize: 'clamp(28px,6vw,40px)', fontWeight: 900, lineHeight: 1.2, marginBottom: 16, color: '#fff' }}>
        <span style={{ color: '#ff6b9d' }}>{carta.nome_remetente}</span> separou<br />
        um presente especial<br />
        para <span style={{ color: '#ff6b9d' }}>{carta.nome_destinatario}</span>
      </h1>
      <p className="lv-sans" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16, lineHeight: 1.7, margin: '0 auto 48px', maxWidth: 360 }}>
        Um momento único feito com carinho para celebrar a história de vocês
      </p>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ecdc4' }} />
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Feito com amor · Lovefy</span>
      </div>
    </div>
  )
}

export function Pagina2Player({ carta }: { carta: Carta }) {
  const spotifyId = getSpotifyId(carta.musica_link)
  const fotoUrl = carta.foto_destaque
    ? `${supabaseUrl}/storage/v1/object/public/fotos/${carta.foto_destaque}`
    : null

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ color: '#ff6b9d', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>A música de vocês</p>
        <h2 className="lv-serif" style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Toque e sinta</h2>
      </div>
      {fotoUrl ? (
        <div className="lv-pulse" style={{ width: 200, height: 200, borderRadius: '50%', margin: '0 auto 32px', overflow: 'hidden', border: '3px solid rgba(255,107,157,0.5)', boxShadow: '0 0 60px rgba(255,107,157,0.3)' }}>
          <img src={fotoUrl} alt="Foto do casal" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div className="lv-heartbeat" style={{ width: 160, height: 160, borderRadius: '50%', margin: '0 auto 32px', background: 'linear-gradient(135deg,rgba(255,107,157,0.2),rgba(196,69,105,0.2))', border: '3px solid rgba(255,107,157,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
          💝
        </div>
      )}
      {spotifyId ? (
        <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 16 }}>
          <iframe
            src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
            width="100%" height="152" frameBorder={0}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy" style={{ borderRadius: 16 }}
          />
        </div>
      ) : (
        <div className="lv-card" style={{ padding: 20, textAlign: 'center', marginBottom: 16 }}>
          <a href={carta.musica_link} target="_blank" rel="noopener noreferrer" style={{ color: '#1DB954', fontWeight: 600, textDecoration: 'none', fontSize: 15 }}>
            🎵 Abrir música no Spotify
          </a>
        </div>
      )}
      <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Toque a música e continue lendo 💕</p>
    </div>
  )
}

export function Pagina3Contador({ carta }: { carta: Carta }) {
  const [tempo, setTempo] = useState(calcularTempo(carta.data_importante))
  useEffect(() => {
    const interval = setInterval(() => setTempo(calcularTempo(carta.data_importante)), 1000)
    return () => clearInterval(interval)
  }, [carta.data_importante])
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null

  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <p style={{ color: '#ff6b9d', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Sobre vocês</p>
      <h2 className="lv-serif" style={{ fontSize: 28, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
        {carta.nome_remetente} & {carta.nome_destinatario}
      </h2>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 40 }}>
        Juntos desde {formatarData(carta.data_importante)} {estacao?.emoji}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[
          { v: tempo.anos, l: tempo.anos === 1 ? 'Ano' : 'Anos' },
          { v: tempo.meses, l: tempo.meses === 1 ? 'Mês' : 'Meses' },
          { v: tempo.dias, l: tempo.dias === 1 ? 'Dia' : 'Dias' },
        ].map(item => (
          <div key={item.l} className="lv-card" style={{ padding: '20px 8px' }}>
            <p className="lv-gradient-text lv-serif" style={{ fontSize: 40, fontWeight: 900, lineHeight: 1 }}>{item.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 4 }}>{item.l}</p>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { v: String(tempo.horas).padStart(2, '0'), l: 'Horas' },
          { v: String(tempo.minutos).padStart(2, '0'), l: 'Minutos' },
          { v: String(tempo.segundos).padStart(2, '0'), l: 'Segundos' },
        ].map(item => (
          <div key={item.l} className="lv-card" style={{ padding: '16px 8px' }}>
            <p className="lv-gradient-text lv-sans" style={{ fontSize: 28, fontWeight: 900 }}>{item.v}</p>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{item.l}</p>
          </div>
        ))}
      </div>
      {estacao && (
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13, marginTop: 24 }}>
          Vocês se encontraram no {estacao.nome} {estacao.emoji}
        </p>
      )}
    </div>
  )
}

export function Pagina4Mensagem({ carta }: { carta: Carta }) {
  const [typed, setTyped] = useState('')
  const [done, setDone] = useState(false)
  const texto = carta.mensagem_principal || ''

  useEffect(() => {
    if (done) return
    let i = 0
    const interval = setInterval(() => {
      if (i < texto.length) { setTyped(texto.slice(0, i + 1)); i++ }
      else { setDone(true); clearInterval(interval) }
    }, 20)
    return () => clearInterval(interval)
  }, [texto, done])

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div className="lv-heartbeat" style={{ fontSize: 48, marginBottom: 16 }}>💝</div>
        <p style={{ color: '#ff6b9d', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Mensagem especial</p>
        <h2 className="lv-serif" style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>
          Do coração de {carta.nome_remetente}
        </h2>
      </div>
      <div className="lv-card" style={{ padding: 28, marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.9, whiteSpace: 'pre-wrap', fontStyle: 'italic', fontFamily: 'Georgia,serif' }}>
          &ldquo;{typed}{!done && <span className="lv-cursor" />}&rdquo;
        </p>
      </div>
      {carta.como_se_conheceram && (
        <div className="lv-card" style={{ padding: 20, marginBottom: 12 }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Como se conheceram</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{carta.como_se_conheceram}</p>
        </div>
      )}
      {carta.memoria_especial && (
        <div className="lv-card" style={{ padding: 20 }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Uma memória especial</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{carta.memoria_especial}</p>
        </div>
      )}
    </div>
  )
}

export function Pagina5Galeria({ carta }: { carta: Carta }) {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const fotos = carta.fotos.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem)

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ color: '#ff6b9d', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Galeria</p>
        <h2 className="lv-serif" style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Momentos de vocês 📸</h2>
      </div>
      {fotos.length > 0 && (
        <div>
          <div style={{ position: 'relative', marginBottom: 12, borderRadius: 20, overflow: 'hidden' }}>
            <img
              src={`${supabaseUrl}/storage/v1/object/public/fotos/${fotos[fotoAtiva].storage_path}`}
              alt="Memória"
              style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
            />
            <div style={{ position: 'absolute', bottom: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: 12, padding: '4px 12px', borderRadius: 20 }}>
              {fotoAtiva + 1}/{fotos.length}
            </div>
          </div>
          {fotos.length > 1 && (
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              {fotos.map((foto, idx) => (
                <img key={foto.id}
                  src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`}
                  alt="Mini" onClick={() => setFotoAtiva(idx)}
                  style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, cursor: 'pointer', flexShrink: 0, opacity: idx === fotoAtiva ? 1 : 0.5, border: idx === fotoAtiva ? '2px solid #ff6b9d' : '2px solid transparent', transition: 'all 0.2s' }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function Pagina6Retrospectiva({ carta }: { carta: Carta }) {
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null
  const momentos = [
    carta.como_se_conheceram && { emoji: '💫', titulo: 'Como se conheceram', desc: carta.como_se_conheceram },
    carta.data_importante && { emoji: estacao?.emoji || '📅', titulo: 'Data especial', desc: `${formatarData(carta.data_importante)} — ${estacao?.nome}` },
    carta.memoria_especial && { emoji: '🌟', titulo: 'Memória especial', desc: carta.memoria_especial },
    carta.momento_marcante && { emoji: '✨', titulo: 'Momento marcante', desc: carta.momento_marcante },
    carta.localizacao && { emoji: '📍', titulo: 'Lugar especial', desc: carta.localizacao },
  ].filter(Boolean) as { emoji: string; titulo: string; desc: string }[]

  return (
    <div style={{ width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <p style={{ color: '#ff6b9d', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>A história de vocês</p>
        <h2 className="lv-serif" style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>Retrospectiva 💕</h2>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom,#ff6b9d,transparent)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingLeft: 52 }}>
          {momentos.map((m, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: -40, top: 8, width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b9d,#c44569)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>
                {m.emoji}
              </div>
              <div className="lv-card" style={{ padding: 16 }}>
                <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{m.titulo}</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Pagina7Wrapped({ carta }: { carta: Carta }) {
  const [mapaUrl, setMapaUrl] = useState(carta.mapa_estrelas_url || '')
  const [loadingMapa, setLoadingMapa] = useState(!carta.mapa_estrelas_url && carta.recursos.includes('mapa_estrelas'))
  const [jogoAcertos, setJogoAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [msgJogo, setMsgJogo] = useState('')
  const [jogoFinalizado, setJogoFinalizado] = useState(false)
  const [copiado, setCopiado] = useState(false)

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
  const estacao = carta.data_importante ? getEstacao(carta.data_importante) : null
  const tempo = carta.data_importante ? calcularTempo(carta.data_importante) : null
  const fotos = carta.fotos?.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem) || []

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
    const lista = palavrasJogo.map(x => x.toLowerCase())
    if (lista.includes(p) && !jogoAcertos.includes(p)) {
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
      navigator.share({ title: 'Lovefy', text: `${carta.nome_remetente} criou algo especial para ${carta.nome_destinatario}`, url })
    } else {
      navigator.clipboard.writeText(url)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  const tempoLabel = tempo
    ? tempo.anos > 0
      ? `${tempo.anos} ${tempo.anos === 1 ? 'ano' : 'anos'}, ${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'} e ${tempo.dias} dias juntos`
      : tempo.meses > 0
        ? `${tempo.meses} ${tempo.meses === 1 ? 'mês' : 'meses'} e ${tempo.dias} dias juntos`
        : `${tempo.dias} dias juntos`
    : ''

  return (
    <div style={{ width: '100%' }}>

      <div className="lv-gradient-bg" style={{ borderRadius: 24, padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 }}>Lovefy Wrapped</p>
        <h2 className="lv-serif" style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 4 }}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16 }}>{tempoLabel}</p>
      </div>

      {carta.recursos.includes('mapa_estrelas') && (
        <div className="lv-card" style={{ padding: 20, marginBottom: 16, textAlign: 'center' }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>⭐ O céu no dia de vocês</p>
          {loadingMapa && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>Gerando mapa das estrelas...</p>}
          {mapaUrl && (
            <div style={{ width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', margin: '0 auto', border: '3px solid rgba(255,107,157,0.3)' }}>
              <img src={mapaUrl} alt="Mapa das estrelas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          {estacao && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 12 }}>{estacao.emoji} {estacao.nome} · {formatarData(carta.data_importante)}</p>}
        </div>
      )}

      {carta.recursos.includes('jogo_palavras') && (
        <div className="lv-card" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12, textAlign: 'center' }}>🎮 Jogo de palavras</p>
          {jogoFinalizado ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🎊</div>
              <p style={{ color: '#4ecdc4', fontWeight: 700 }}>Você descobriu tudo!</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
                {palavrasJogo.map(p => (
                  <div key={p} style={{ padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, background: jogoAcertos.includes(p.toLowerCase()) ? 'linear-gradient(135deg,#ff6b9d,#c44569)' : '#0f3460', color: jogoAcertos.includes(p.toLowerCase()) ? '#fff' : 'rgba(255,255,255,0.3)', letterSpacing: jogoAcertos.includes(p.toLowerCase()) ? 0 : 4, transition: 'all 0.3s' }}>
                    {jogoAcertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)} onKeyDown={e => e.key === 'Enter' && tentarJogo()} placeholder="Digite uma palavra..."
                  style={{ flex: 1, background: '#0f3460', color: '#fff', borderRadius: 12, padding: '12px 16px', outline: 'none', border: '1px solid rgba(255,107,157,0.3)', fontSize: 14 }} />
                <button onClick={tentarJogo} className="lv-btn" style={{ padding: '12px 20px', borderRadius: 12, fontSize: 18 }}>→</button>
              </div>
              {msgJogo && <p style={{ textAlign: 'center', color: msgJogo.includes('Acertou') ? '#4ecdc4' : '#ff6b9d', fontSize: 13, marginTop: 8 }}>{msgJogo}</p>}
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 8 }}>{jogoAcertos.length}/{palavrasJogo.length} descobertas</p>
            </>
          )}
        </div>
      )}

      {carta.momento_marcante && (
        <div className="lv-card" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>✨ Momento marcante</p>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>{carta.momento_marcante}</p>
          {carta.localizacao && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 8 }}>📍 {carta.localizacao}</p>}
        </div>
      )}

      {fotos.length > 0 && (
        <div className="lv-card" style={{ padding: 20, marginBottom: 16 }}>
          <p style={{ color: '#ff6b9d', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>📸 Momentos juntos</p>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {fotos.map(foto => (
              <img key={foto.id} src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`} alt="Foto"
                style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />
            ))}
          </div>
        </div>
      )}

      <div style={{ background: 'linear-gradient(135deg,#1a1a2e,#16213e)', border: '1px solid rgba(255,107,157,0.2)', borderRadius: 24, padding: 24, marginBottom: 16, textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, marginBottom: 16 }}>LOVEFY WRAPPED</p>
        <p style={{ fontSize: 32, marginBottom: 8 }}>💝</p>
        <h3 className="lv-serif" style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
          {carta.nome_remetente} & {carta.nome_destinatario}
        </h3>
        {tempo && (
          <p className="lv-gradient-text" style={{ fontSize: 48, fontWeight: 900, lineHeight: 1, marginBottom: 8 }}>
            {tempo.anos > 0 ? tempo.anos : tempo.meses > 0 ? tempo.meses : tempo.dias}
          </p>
        )}
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>{tempoLabel}</p>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Criado com amor no Lovefy</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={compartilhar} className="lv-btn" style={{ padding: 16, borderRadius: 16, fontSize: 15, width: '100%' }}>
          {copiado ? '✅ Link copiado!' : '💚 Compartilhar no WhatsApp'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <a href="https://www.instagram.com/" target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', textAlign: 'center', padding: 14, borderRadius: 16, fontSize: 14, fontWeight: 600, background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', color: '#fff', textDecoration: 'none' }}>
            📸 Instagram
          </a>
          <button onClick={() => { navigator.clipboard.writeText(`https://lovefy.app.br/c/${carta.slug}`); setCopiado(true); setTimeout(() => setCopiado(false), 2500) }}
            style={{ padding: 14, borderRadius: 16, fontSize: 14, fontWeight: 600, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer' }}>
            🔗 Copiar link
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 16 }}>Quer criar uma carta para alguém especial?</p>
        <a href="https://lovefy.app.br/criar" style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg,#ff6b9d,#c44569)', color: '#fff', textDecoration: 'none' }}>
          💝 Criar minha carta
        </a>
      </div>

    </div>
  )
}