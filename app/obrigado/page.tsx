'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function ObrigadoContent() {
  const searchParams = useSearchParams()
  const carta_id = searchParams.get('carta_id')

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="bg-[#16213e] rounded-3xl p-8 max-w-md w-full text-center">
        <div className="text-6xl mb-6">💌</div>
        <h1 className="text-2xl font-bold text-white mb-4">Pagamento confirmado!</h1>
        <p className="text-white/50 mb-8">Sua carta esta sendo preparada. Voce recebera um email em breve.</p>
        <div className="bg-[#0f3460] rounded-xl p-4 border border-white/10 mb-8">
          <p className="text-white/40 text-xs mb-1">ID da sua carta</p>
          <p className="text-white font-mono text-sm break-all">{carta_id}</p>
        </div>
        <a href="/" className="block w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl">
          Voltar ao inicio
        </a>
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