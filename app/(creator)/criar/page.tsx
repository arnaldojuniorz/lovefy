'use client'

import { Component, type ReactNode } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useCarta } from '@/lib/carta-context'

const EtapaLoading = () => (
  <div className="flex items-center justify-center h-40">
    <div className="w-6 h-6 rounded-full border-2 border-pink-500 border-t-transparent animate-spin" />
  </div>
)

const Etapa1 = dynamic(() => import('@/components/etapas/Etapa1'), { ssr: false, loading: EtapaLoading })
const Etapa2 = dynamic(() => import('@/components/etapas/Etapa2'), { ssr: false, loading: EtapaLoading })
const Etapa3 = dynamic(() => import('@/components/etapas/Etapa3'), { ssr: false, loading: EtapaLoading })
const Etapa4 = dynamic(() => import('@/components/etapas/Etapa4'), { ssr: false, loading: EtapaLoading })
const Etapa5 = dynamic(() => import('@/components/etapas/Etapa5'), { ssr: false, loading: EtapaLoading })

// Fonte única de verdade: TOTAL_ETAPAS agora é derivado do array,
// impossível ficar dessincronizado com os componentes reais.
const ETAPAS = [Etapa1, Etapa2, Etapa3, Etapa4, Etapa5] as const
const TOTAL_ETAPAS = ETAPAS.length

// Boundary local só para falhas de carregamento de chunk (rede instável).
// Reload é a estratégia de retry mais confiável aqui, pois o Next pode
// manter a promise do import() cacheada como rejeitada.
// IMPORTANTE: só é seguro assumir que o progresso não se perde no reload
// se `carta-context` persistir os dados (ex: localStorage). Confirmar
// isso ao revisar lib/carta-context.tsx.
class EtapaErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('[criar] Falha ao carregar etapa:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center py-8">
          <p className="text-white/70 text-sm mb-4">
            Não foi possível carregar esta etapa. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-full bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default function CriarPage() {
  const { data } = useCarta()

  const EtapaAtual = ETAPAS[data.etapa_atual - 1]

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        <div
          className="flex gap-2 mb-8"
          role="progressbar"
          aria-valuenow={data.etapa_atual}
          aria-valuemin={1}
          aria-valuemax={TOTAL_ETAPAS}
          aria-label={`Etapa ${data.etapa_atual} de ${TOTAL_ETAPAS}`}
        >
          {Array.from({ length: TOTAL_ETAPAS }, (_, i) => i + 1).map((n) => (
            <div
              key={n}
              aria-hidden="true"
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                n <= data.etapa_atual ? 'bg-pink-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {EtapaAtual ? (
          <EtapaErrorBoundary>
            <EtapaAtual />
          </EtapaErrorBoundary>
        ) : (
          <div className="text-center py-8">
            <p className="text-white/50 text-sm mb-4">
              Ocorreu um problema com o progresso da sua carta.
            </p>
            <Link
              href="/criar"
              className="inline-block px-5 py-2 rounded-full bg-pink-500 text-white text-sm font-medium hover:bg-pink-600 transition-colors"
            >
              Recomeçar
            </Link>
          </div>
        )}

      </div>
    </main>
  )
}