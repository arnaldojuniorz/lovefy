'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function ObrigadoContent() {
  const searchParams = useSearchParams()
  const carta_id = searchParams.get('carta_id') || ''
  const tipo = searchParams.get('tipo') || 'digital'

  const [carta, setCarta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(false)
  const [tentativas, setTentativas] = useState(0)

  useEffect(() => {
    if (!carta_id) { setLoading(false); return }

    const endpoint = tipo === 'impressao'
      ? '/api/cartas-impressao?id=' + carta_id
      : '/api/cartas?id=' + carta_id

    let interval: any
    let timeout: any

    async function verificar() {
      try {
        const res = await fetch(endpoint)
        const data = await res.json()
        if (data?.status === 'ativo' || data?.pdf_url) {
          setCarta(data)
          setLoading(false)
          clearInterval(interval)
          clearTimeout(timeout)
        } else {
          setTentativas(t => t + 1)
        }
      } catch {
        setTentativas(t => t + 1)
      }
    }

    verificar()
    interval = setInterval(verificar, 2000)
    timeout = setTimeout(() => { clearInterval(interval); setLoading(false) }, 30000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [carta_id, tipo])

  function copiar() {
    const link = 'https://lovefy.app.br/c/' + carta?.slug
    navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2500)
  }

  function whatsapp() {
    const link = 'https://lovefy.app.br/c/' + carta?.slug
    const texto = 'Criei algo especial para você! Abra aqui: ' + link
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
  }

  const s: Record<string, React.CSSProperties> = {
    main:    { minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: 'Inter, system-ui, sans-serif' },
    wrap:    { maxWidth: 440, width: '100%' },
    center:  { textAlign: 'center' },
    spinner: { width: 48, height: 48, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTop: '3px solid #1DB954', margin: '0 auto 24px', animation: 'spin 0.8s linear infinite' },
    h1:      { color: '#fff', fontSize: 26, fontWeight: 900, marginBottom: 8 },
    sub:     { color: 'rgba(255,255,255,0.5)', fontSize: 15 },
    qrWrap:  { background: '#fff', borderRadius: 20, padding: 20, textAlign: 'center', marginBottom: 16 },
    qrImg:   { width: 180, height: 180, display: 'block', margin: '0 auto 12px' },
    linkRow: { background: '#1a1a1a', borderRadius: 16, padding: '16px 20px', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
    linkTxt: { color: '#fff', fontSize: 14, fontWeight: 600, wordBreak: 'break-all', flex: 1 } as React.CSSProperties,
    btnWa:   { width: '100%', padding: '16px', borderRadius: 100, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer', marginBottom: 12 },
    btnPdf:  { display: 'block', textAlign: 'center', padding: '18px', borderRadius: 16, background: '#1DB954', color: '#000', fontWeight: 800, fontSize: 17, textDecoration: 'none', marginBottom: 12 },
    btnBack: { display: 'block', textAlign: 'center', padding: '14px', borderRadius: 100, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 14, textDecoration: 'none' },
  }

  if (loading) {
    return (
      <main style={s.main}>
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
        <div style={s.wrap}>
          <div style={s.center}>
            <div style={s.spinner} />
            <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              {tipo === 'impressao' ? 'Gerando seu PDF...' : 'Preparando sua carta...'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              {tentativas < 5 ? 'Confirmando pagamento...' : 'Quase pronto...'}
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (tipo === 'impressao') {
    return (
      <main style={s.main}>
        <div style={s.wrap}>
          <div style={{ ...s.center, marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h1 style={s.h1}>Pagamento confirmado!</h1>
            <p style={s.sub}>Seu PDF está pronto para baixar</p>
          </div>
          {carta?.pdf_url
            ? <a href={carta.pdf_url} target="_blank" rel="noopener noreferrer" style={s.btnPdf}>Baixar PDF</a>
            : <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, textAlign: 'center', marginBottom: 12 }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>PDF enviado para o e-mail cadastrado.</p>
              </div>
          }
          <a href="/" style={s.btnBack}>Voltar ao início</a>
        </div>
      </main>
    )
  }

  return (
    <main style={s.main}>
      <div style={s.wrap}>
        <div style={{ ...s.center, marginBottom: 32 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>💌</div>
          <h1 style={s.h1}>Sua carta está pronta!</h1>
          <p style={s.sub}>Compartilhe com {carta?.nome_destinatario || 'quem você ama'}</p>
        </div>

        {carta?.slug && (
          <>
            <div style={s.qrWrap}>
              <img
                src={'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent('https://lovefy.app.br/c/' + carta.slug)}
                alt="QR Code"
                style={s.qrImg}
              />
              <p style={{ color: '#888', fontSize: 12 }}>Escaneie para abrir a carta</p>
            </div>

            <div style={s.linkRow}>
              <p style={s.linkTxt}>lovefy.app.br/c/{carta.slug}</p>
              <button
                onClick={copiar}
                style={{ background: copiado ? '#1DB954' : 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 600, flexShrink: 0 }}>
                {copiado ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            <button onClick={whatsapp} style={s.btnWa}>Enviar pelo WhatsApp</button>
          </>
        )}

        <a href="/" style={s.btnBack}>Voltar ao início</a>
      </div>
    </main>
  )
}

export default function ObrigadoPage() {
  return (
    <Suspense>
      <ObrigadoContent />
    </Suspense>
  )
}