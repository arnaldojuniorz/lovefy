'use client'

import { useState, useEffect } from 'react'
import { Carta, STYLES } from './CartaTypes'
import {
  Pagina1Abertura,
  Pagina2Player,
  Pagina3Contador,
  Pagina4Mensagem,
  Pagina5Galeria,
  Pagina6Retrospectiva,
  Pagina7Wrapped,
} from './CartaPaginas'

function buildPaginas(carta: Carta) {
  const paginas = []
  paginas.push(<Pagina1Abertura carta={carta} key="abertura" />)
  if (carta.recursos.includes('musica') && carta.musica_link) {
    paginas.push(<Pagina2Player carta={carta} key="player" />)
  }
  paginas.push(<Pagina3Contador carta={carta} key="contador" />)
  paginas.push(<Pagina4Mensagem carta={carta} key="mensagem" />)
  if (carta.recursos.includes('galeria') && carta.fotos?.length > 0) {
    paginas.push(<Pagina5Galeria carta={carta} key="galeria" />)
  }
  paginas.push(<Pagina6Retrospectiva carta={carta} key="retrospectiva" />)
  paginas.push(<Pagina7Wrapped carta={carta} key="wrapped" />)
  return paginas
}

export default function CartaViewer({ carta }: { carta: Carta }) {
  const [pagina, setPagina] = useState(0)
  const [visible, setVisible] = useState(false)
  const paginas = buildPaginas(carta)
  const total = paginas.length

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [pagina])

  function avancar() {
    setVisible(false)
    setTimeout(() => {
      setPagina(p => p + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 400)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #0f3460 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowX: 'hidden',
    }}>
      <style>{STYLES}</style>

      {/* Barra de progresso */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 3, background: 'rgba(255,255,255,0.1)' }}>
        <div style={{
          height: '100%',
          width: `${((pagina + 1) / total) * 100}%`,
          background: 'linear-gradient(90deg, #ff6b9d, #c44569)',
          transition: 'width 0.6s ease',
        }} />
      </div>

      <div className={`lv-page ${visible ? 'visible' : ''}`} style={{ maxWidth: 480, margin: '0 auto', width: '100%' }}>
        {paginas[pagina]}

        {pagina < paginas.length - 1 && (
          <button
            onClick={avancar}
            className="lv-btn"
            style={{ width: '100%', marginTop: 24, padding: 18, borderRadius: 16, fontSize: 16 }}
          >
            Continuar →
          </button>
        )}
      </div>
    </main>
  )
}