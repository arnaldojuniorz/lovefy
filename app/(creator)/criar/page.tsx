'use client'

import { useCarta } from '@/lib/carta-context'
import Etapa1 from '@/components/etapas/Etapa1'
import Etapa2 from '@/components/etapas/Etapa2'
import Etapa3 from '@/components/etapas/Etapa3'
import Etapa4 from '@/components/etapas/Etapa4'
import Etapa5 from '@/components/etapas/Etapa5'

export default function CriarPage() {
  const { data } = useCarta()

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((n) => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                n <= data.etapa_atual ? 'bg-pink-500' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {data.etapa_atual === 1 && <Etapa1 />}
        {data.etapa_atual === 2 && <Etapa2 />}
        {data.etapa_atual === 3 && <Etapa3 />}
        {data.etapa_atual === 4 && <Etapa4 />}
        {data.etapa_atual === 5 && <Etapa5 />}
      </div>
    </main>
  )
}
