'use client'

import { useState } from 'react'
import { useCarta } from '@/lib/carta-context'

export default function Etapa5() {
  const { data, update } = useCarta()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [plano, setPlano] = useState<'24h' | 'forever'>('forever')

  async function handleContinuar() {
    if (!data.nome_pagador || !data.email_pagador) {
      setErro('Preencha seu nome e e-mail!')
      return
    }

    setLoading(true)
    setErro('')

    try {
      const patchResponse = await fetch('/api/cartas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carta_id: data.carta_id,
          nome_pagador: data.nome_pagador,
          email_pagador: data.email_pagador,
          status: 'pendente',
        }),
      })

      if (!patchResponse.ok) {
        const result = await patchResponse.json()
        setErro(result.error || 'Erro ao salvar dados')
        return
      }

      window.location.href = `/checkout?carta_id=${data.carta_id}&plano=${plano}&tipo=digital&nome=${encodeURIComponent(data.nome_pagador)}&email=${encodeURIComponent(data.email_pagador)}`

    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Quase lá! 💳</h1>
      <p className="text-white/50 text-sm mb-6">Preencha seus dados e escolha seu plano</p>

      <div className="space-y-4">
        <div>
          <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
          <input
            type="text"
            value={data.nome_pagador}
            onChange={e => update({ nome_pagador: e.target.value })}
            placeholder="Seu nome completo"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">Seu e-mail *</label>
          <input
            type="email"
            value={data.email_pagador}
            onChange={e => update({ email_pagador: e.target.value })}
            placeholder="seu@email.com"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        {/* Seleção de plano */}
        <div>
          <label className="text-white/70 text-sm block mb-3">Escolha seu plano *</label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setPlano('24h')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                plano === '24h'
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-white/10 bg-[#0f3460] hover:border-white/30'
              }`}
            >
              <p className="text-white font-bold text-lg">R$ 6,90</p>
              <p className="text-white/70 text-sm font-medium">24 Horas</p>
              <p className="text-white/40 text-xs mt-1">Expira em 24h</p>
            </div>
            <div
              onClick={() => setPlano('forever')}
              className={`p-4 rounded-xl border cursor-pointer transition-all relative ${
                plano === 'forever'
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-white/10 bg-[#0f3460] hover:border-white/30'
              }`}
            >
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Popular</span>
              <p className="text-white font-bold text-lg">R$ 12,90</p>
              <p className="text-white/70 text-sm font-medium">Para Sempre</p>
              <p className="text-white/40 text-xs mt-1">Link vitalício</p>
            </div>
          </div>
        </div>

        {erro && (
          <p className="text-red-400 text-sm bg-red-500/10 rounded-xl px-4 py-3">{erro}</p>
        )}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => update({ etapa_atual: 4 })}
          disabled={loading}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={handleContinuar}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Aguarde...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}