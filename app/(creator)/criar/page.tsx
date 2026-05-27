'use client'

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

const TOTAL_ETAPAS = 5

const ETAPAS_MAP: Record<number, React.ComponentType> = {
  1: Etapa1,
  2: Etapa2,
  3: Etapa3,
  4: Etapa4,
  5: Etapa5,
}

export default function CriarPage() {
  const { data } = useCarta()

  const EtapaAtual = ETAPAS_MAP[data.etapa_atual]

  return (
    <main style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
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
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                n <= data.etapa_atual ? 'bg-pink-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {EtapaAtual ? (
          <EtapaAtual />
        ) : (
          <p className="text-white/50 text-center text-sm">
            Etapa inválida. Por favor, recarregue a página.
          </p>
        )}

      </div>
    </main>
  )
}