'use client'
console.log('CartaViewer carregado')

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
  slug: string
  fotos: Foto[]
}

type Props = {
  carta: Carta
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

export default function CartaViewer({ carta }: Props) {
  const [pagina, setPagina] = useState(0)
  const paginas = buildPaginas(carta)

  return (
    <main style={{minHeight:'100vh', background:'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', padding:'16px'}}>
        <div style={{width:'100%', maxWidth:'448px'}}>
          {paginas[pagina]}
          {pagina < paginas.length - 1 && (
            <button
              onClick={() => setPagina(p => p + 1)}
              style={{width:'100%', marginTop:'16px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', fontWeight:600, padding:'16px', borderRadius:'16px', border:'none', cursor:'pointer', fontSize:'16px'}}
            >
              Continuar
            </button>
          )}
        </div>
      </div>
    </main>
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
  if (carta.recursos.includes('jogo_palavras')) {
    paginas.push(<PaginaJogoPalavras carta={carta} key="jogo" />)
  }
  paginas.push(<PaginaFinal carta={carta} key="final" />)
  return paginas
}

function PaginaEnvelope({ carta }: { carta: Carta }) {
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{fontSize:'80px', marginBottom:'24px'}}>💌</div>
      <h1 style={{color:'#fff', fontSize:'22px', fontWeight:'bold', marginBottom:'16px'}}>Você recebeu uma carta especial</h1>
      <p style={{color:'rgba(255,255,255,0.5)', marginBottom:'8px'}}>De <span style={{color:'#ff6b9d', fontWeight:600}}>{carta.nome_remetente}</span></p>
      <p style={{color:'rgba(255,255,255,0.5)', marginBottom:'32px'}}>Para <span style={{color:'#ff6b9d', fontWeight:600}}>{carta.nome_destinatario}</span></p>
      <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px'}}>feito com amor pelo <span style={{color:'#ff6b9d', fontWeight:600}}>Lovefy</span></p>
    </div>
  )
}

function PaginaRevelacao({ carta }: { carta: Carta }) {
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <div style={{fontSize:'48px', marginBottom:'12px'}}>💝</div>
        <h2 style={{color:'#fff', fontSize:'20px', fontWeight:'bold'}}>Nossa história</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', marginTop:'4px'}}>Uma história escrita com amor</p>
      </div>
      <div style={{background:'#0f3460', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'8px'}}>MENSAGEM</p>
        <p style={{color:'rgba(255,255,255,0.8)', lineHeight:'1.6', fontSize:'14px', whiteSpace:'pre-wrap'}}>{carta.mensagem_principal}</p>
      </div>
      {carta.como_se_conheceram && (
        <div style={{background:'#0f3460', borderRadius:'16px', padding:'16px', marginBottom:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'6px'}}>COMO NOS CONHECEMOS</p>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:'14px'}}>{carta.como_se_conheceram}</p>
        </div>
      )}
      {carta.memoria_especial && (
        <div style={{background:'#0f3460', borderRadius:'16px', padding:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
          <p style={{color:'rgba(255,255,255,0.4)', fontSize:'11px', marginBottom:'6px'}}>UMA MEMORIA ESPECIAL</p>
          <p style={{color:'rgba(255,255,255,0.7)', fontSize:'14px'}}>{carta.memoria_especial}</p>
        </div>
      )}
    </div>
  )
}

function PaginaGaleria({ carta }: { carta: Carta }) {
  const [fotoAtiva, setFotoAtiva] = useState(0)
  const fotosAtivas = carta.fotos.filter(f => !f.is_temp).sort((a, b) => a.ordem - b.ordem)
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <div style={{fontSize:'40px', marginBottom:'8px'}}>📸</div>
        <h2 style={{color:'#fff', fontSize:'20px', fontWeight:'bold'}}>Nossa galeria</h2>
      </div>
      {fotosAtivas.length > 0 && (
        <div>
          <img
            src={`${supabaseUrl}/storage/v1/object/public/fotos/${fotosAtivas[fotoAtiva].storage_path}`}
            alt="Foto"
            style={{width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:'16px', marginBottom:'12px'}}
          />
          {fotosAtivas.length > 1 && (
            <div style={{display:'flex', gap:'8px', overflowX:'auto'}}>
              {fotosAtivas.map((foto, idx) => (
                <img
                  key={foto.id}
                  src={`${supabaseUrl}/storage/v1/object/public/fotos/${foto.storage_path}`}
                  alt="Mini"
                  onClick={() => setFotoAtiva(idx)}
                  style={{width:'64px', height:'64px', objectFit:'cover', borderRadius:'12px', cursor:'pointer', flexShrink:0, opacity: idx === fotoAtiva ? 1 : 0.5, border: idx === fotoAtiva ? '2px solid #ff6b9d' : 'none'}}
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
    ? Math.floor((new Date().getTime() - new Date(carta.data_importante).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const [segundos, setSegundos] = useState(dias * 24 * 60 * 60)
  useEffect(() => {
    const interval = setInterval(() => setSegundos(s => s + 1), 1000)
    return () => clearInterval(interval)
  }, [])
  const dataFormatada = carta.data_importante
    ? new Date(carta.data_importante).toLocaleDateString('pt-BR', {day:'numeric', month:'long', year:'numeric', timeZone:'UTC'})
    : ''
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'24px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{fontSize:'40px', marginBottom:'12px'}}>💕</div>
      <h2 style={{color:'#fff', fontSize:'22px', fontWeight:'900', marginBottom:'4px'}}>Momento Especial</h2>
      <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', marginBottom:'24px'}}>Uma historia escrita com amor</p>
      <div style={{background:'#0f3460', borderRadius:'16px', padding:'20px', marginBottom:'16px', border:'1px solid rgba(255,255,255,0.08)'}}>
        <p style={{color:'#fff', fontWeight:500, marginBottom:'12px'}}>Desde {dataFormatada}</p>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'center', gap:'8px'}}>
          <span style={{fontSize:'48px', fontWeight:'900', background:'linear-gradient(135deg, #ff6b9d, #c44569)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{dias.toLocaleString('pt-BR')}</span>
          <span style={{color:'#fff', fontWeight:600, fontSize:'20px'}}>dias juntos</span>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px'}}>
        {[{v:(dias*24).toLocaleString('pt-BR'),l:'horas'},{v:(dias*24*60).toLocaleString('pt-BR'),l:'minutos'},{v:segundos.toLocaleString('pt-BR'),l:'segundos'}].map(item => (
          <div key={item.l} style={{background:'#0f3460', borderRadius:'12px', padding:'12px', border:'1px solid rgba(255,255,255,0.08)'}}>
            <p style={{fontWeight:'bold', fontSize:'14px', background:'linear-gradient(135deg, #ff6b9d, #c44569)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent'}}>{item.v}</p>
            <p style={{color:'rgba(255,255,255,0.4)', fontSize:'12px', marginTop:'4px'}}>{item.l}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function PaginaJogoPalavras({ carta }: { carta: Carta }) {
  const palavras = [carta.nome_remetente, carta.nome_destinatario, 'amor', 'juntos', 'sempre'].filter(Boolean)
  const [acertos, setAcertos] = useState<string[]>([])
  const [tentativa, setTentativa] = useState('')
  const [mensagem, setMensagem] = useState('')
  function tentar() {
    const p = tentativa.toLowerCase().trim()
    if (palavras.map(x => x.toLowerCase()).includes(p) && !acertos.includes(p)) {
      setAcertos(prev => [...prev, p])
      setMensagem('Acertou!')
    } else {
      setMensagem('Tente novamente!')
    }
    setTentativa('')
    setTimeout(() => setMensagem(''), 1500)
  }
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{textAlign:'center', marginBottom:'24px'}}>
        <div style={{fontSize:'40px', marginBottom:'8px'}}>🎮</div>
        <h2 style={{color:'#fff', fontSize:'20px', fontWeight:'bold'}}>Jogo de Palavras</h2>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'14px', marginTop:'4px'}}>Adivinhe as palavras especiais</p>
      </div>
      <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'24px', justifyContent:'center'}}>
        {palavras.map(p => (
          <div key={p} style={{padding:'8px 16px', borderRadius:'20px', fontSize:'14px', fontWeight:500, background: acertos.includes(p.toLowerCase()) ? '#ff6b9d' : '#0f3460', color: acertos.includes(p.toLowerCase()) ? '#fff' : 'rgba(255,255,255,0.3)'}}>
            {acertos.includes(p.toLowerCase()) ? p : '?'.repeat(p.length)}
          </div>
        ))}
      </div>
      <div style={{display:'flex', gap:'8px'}}>
        <input type="text" value={tentativa} onChange={e => setTentativa(e.target.value)} onKeyDown={e => e.key === 'Enter' && tentar()} placeholder="Digite uma palavra..." style={{flex:1, background:'#0f3460', color:'#fff', borderRadius:'12px', padding:'12px 16px', outline:'none', border:'1px solid rgba(255,255,255,0.08)', fontSize:'14px'}} />
        <button onClick={tentar} style={{background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', padding:'12px 16px', borderRadius:'12px', border:'none', cursor:'pointer', fontWeight:600}}>→</button>
      </div>
      {mensagem && <p style={{textAlign:'center', marginTop:'12px', fontSize:'14px', fontWeight:500, color: mensagem === 'Acertou!' ? '#4ecdc4' : '#ff6b9d'}}>{mensagem}</p>}
      <p style={{textAlign:'center', color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'16px'}}>{acertos.length}/{palavras.length} palavras descobertas</p>
    </div>
  )
}

function PaginaFinal({ carta }: { carta: Carta }) {
  return (
    <div style={{background:'#16213e', borderRadius:'24px', padding:'32px', textAlign:'center', border:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{fontSize:'64px', marginBottom:'24px'}}>💝</div>
      <h2 style={{color:'#fff', fontSize:'22px', fontWeight:'bold', marginBottom:'16px'}}>Com todo meu amor</h2>
      <p style={{color:'#ff6b9d', fontSize:'20px', fontWeight:500, marginBottom:'32px'}}>{carta.nome_remetente}</p>
      <div style={{borderTop:'1px solid rgba(255,255,255,0.08)', paddingTop:'24px'}}>
        <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px', marginBottom:'4px'}}>Essa carta foi criada com</p>
        <p style={{color:'#ff6b9d', fontWeight:'bold', fontSize:'20px', marginBottom:'24px'}}>Lovefy</p>
        <p style={{color:'#fff', fontSize:'16px', fontWeight:500, marginBottom:'16px'}}>Crie uma carta para alguem especial tambem</p>
        <a href="https://lovefy.app.br/criar" style={{display:'block', background:'linear-gradient(135deg, #ff6b9d, #c44569)', color:'#fff', padding:'16px', borderRadius:'16px', textDecoration:'none', fontWeight:600, fontSize:'16px', marginBottom:'12px'}}>Criar minha carta</a>
        <button onClick={() => window.location.reload()} style={{width:'100%', padding:'16px', borderRadius:'16px', color:'#fff', fontWeight:500, border:'2px solid rgba(255,255,255,0.2)', background:'transparent', cursor:'pointer'}}>Ver novamente</button>
      </div>
      <p style={{color:'rgba(255,255,255,0.3)', fontSize:'12px', marginTop:'24px'}}>Transformando palavras em momentos inesqueciveis</p>
    </div>
  )
}