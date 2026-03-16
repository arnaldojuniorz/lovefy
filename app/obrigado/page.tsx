'use client'

import { useState } from 'react'
import { useCarta } from '@/lib/carta-context'

export default function Etapa5() {
  const { data, update } = useCarta()
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')

  async function handlePagar() {
    if (!data.nome_pagador || !data.email_pagador) {
      setErro('Preencha seu nome e e-mail!')
      return
    }

    setLoading(true)
    setErro('')

    try {
      // Atualizar dados do pagador na carta
      const patchResponse = await fetch('/api/cartas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          carta_id: data.carta_id,
          nome_pagador: data.nome_pagador,
          email_pagador: data.email_pagador,
          slug: data.slug,
          status: 'pendente',
        }),
      })

      if (!patchResponse.ok) {
        const result = await patchResponse.json()
        setErro(result.error || 'Erro ao salvar dados')
        return
      }

      // Criar preferência de pagamento
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carta_id: data.carta_id }),
      })

      const checkoutResult = await checkoutResponse.json()

      if (!checkoutResponse.ok) {
        setErro(checkoutResult.error || 'Erro ao criar pagamento')
        return
      }

      // Redirecionar para o Mercado Pago
      window.location.href = checkoutResult.checkout_url

    } catch (error) {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Quase lá! 💳</h1>
      <p className="text-white/50 text-sm mb-8">Preencha seus dados para finalizar</p>

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

        <div className="bg-[#0f3460] rounded-xl p-4 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-white/70">Carta interativa Lovefy</span>
            <span className="text-white font-bold text-lg">R$ 29,90</span>
          </div>
          <p className="text-white/40 text-xs mt-1">Pagamento único, acesso vitalício</p>
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
          onClick={handlePagar}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Aguarde...' : 'Pagar R$ 29,90 💳'}
        </button>
      </div>
    </div>
  )
}