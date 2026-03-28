'use client'

import { useState, useEffect } from 'react'
import { useCarta } from '@/lib/carta-context'

export default function Etapa1() {
  const { data, update } = useCarta()
  const [loading, setLoading] = useState(false)

  // Aquece a função serverless assim que o usuário abre a página
  useEffect(() => {
    fetch('/api/cartas?slug=warmup').catch(() => {})
  }, [])

  async function avancar() {
    if (!data.nome_destinatario || !data.nome_remetente) {
      alert('Preencha o nome de quem envia e de quem recebe!')
      return
    }

    setLoading(true)

    try {
      if (data.carta_id) {
        await fetch('/api/cartas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            carta_id: data.carta_id,
            nome_destinatario: data.nome_destinatario,
            nome_remetente: data.nome_remetente,
            como_se_conheceram: data.como_se_conheceram,
            memoria_especial: data.memoria_especial,
          }),
        })
        update({ etapa_atual: 2 })
        return
      }

      const response = await fetch('/api/cartas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_destinatario:  data.nome_destinatario,
          nome_remetente:     data.nome_remetente,
          como_se_conheceram: data.como_se_conheceram || null,
          memoria_especial:   data.memoria_especial   || null,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        alert(result.error || 'Erro ao iniciar carta. Tente novamente.')
        return
      }

      update({ carta_id: result.carta_id, etapa_atual: 2 })

    } catch {
      alert('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Para quem é essa carta? 💌</h1>
      <p className="text-white/50 text-sm mb-8">Conte um pouco sobre vocês</p>

      <div className="space-y-4">
        <div>
          <label className="text-white/70 text-sm block mb-2">Nome de quem recebe *</label>
          <input
            type="text"
            value={data.nome_destinatario}
            onChange={e => update({ nome_destinatario: e.target.value })}
            placeholder="Ex: Ana"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">Nome de quem envia *</label>
          <input
            type="text"
            value={data.nome_remetente}
            onChange={e => update({ nome_remetente: e.target.value })}
            placeholder="Ex: Lucas"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">
            Como vocês se conheceram? <span className="text-white/30">(opcional)</span>
          </label>
          <input
            type="text"
            value={data.como_se_conheceram}
            onChange={e => update({ como_se_conheceram: e.target.value })}
            placeholder="Ex: Na faculdade, em 2019"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">
            Uma memória especial <span className="text-white/30">(opcional)</span>
          </label>
          <textarea
            value={data.memoria_especial}
            onChange={e => update({ memoria_especial: e.target.value })}
            placeholder="Ex: Nossa primeira viagem juntos..."
            rows={3}
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors resize-none"
          />
        </div>
      </div>

      <button
        onClick={avancar}
        disabled={loading}
        className="w-full mt-8 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
      >
        {loading ? 'Criando...' : 'Continuar →'}
      </button>
    </div>
  )
}