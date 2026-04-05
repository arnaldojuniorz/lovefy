'use client'

import { Carta, STYLES } from './CartaTypes'
import {
  SecaoAbertura,
  SecaoPlayer,
  SecaoContador,
  SecaoMensagem,
  SecaoFotos,
  SecaoRetrospectiva,
  SecaoWrapped,
} from './CartaPaginas'

export default function CartaViewer({ carta }: { carta: Carta }) {
  return (
    <main style={{
      background: '#121212',
      fontFamily: 'Inter, system-ui, sans-serif',
      minHeight: '100vh',
    }}>
      <style>{STYLES}</style>

      <SecaoAbertura carta={carta} />
      {carta.recursos.includes('musica') && carta.musica_link && (
        <SecaoPlayer carta={carta} />
      )}
      <SecaoContador carta={carta} />
      <SecaoMensagem carta={carta} />
      {carta.recursos.includes('galeria') && carta.fotos?.length > 0 && (
        <SecaoFotos carta={carta} />
      )}
      <SecaoRetrospectiva carta={carta} />
      <SecaoWrapped carta={carta} />
    </main>
  )
}