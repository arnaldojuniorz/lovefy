import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { CartaProvider } from '@/lib/carta-context'

// Rota de criação da carta é um funil client-side de múltiplas etapas,
// sem conteúdo relevante para indexação — evita poluir resultados de
// busca e desperdiçar crawl budget do Google.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function CreatorLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <CartaProvider>
      {children}
    </CartaProvider>
  )
}