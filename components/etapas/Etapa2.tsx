'use client'

import { useState } from 'react'
import { useCarta } from '@/lib/carta-context'

export default function Etapa2() {
  const { data, update } = useCarta()
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  async function recriarCarta(): Promise<void> {
    const res = await fetch('/api/cartas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        nome_destinatario:  data.nome_destinatario,
        nome_remetente:     data.nome_remetente,
        data_importante:    data.data_importante,
        mensagem_principal: data.mensagem_principal,
      }),
    })

    const result = await res.json()

    if (!res.ok) {
      throw new Error(result.error || 'Erro ao salvar. Tente novamente.')
    }

    update({ carta_id: result.carta_id, etapa_atual: 3 })
  }

  async function avancar() {
    if (!data.data_importante || !data.mensagem_principal) {
      setErro('Preencha a data e a mensagem.')
      return
    }

    setErro('')
    setLoading(true)

    try {
      if (data.carta_id) {
        const res = await fetch('/api/cartas', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            carta_id:           data.carta_id,
            data_importante:    data.data_importante,
            mensagem_principal: data.mensagem_principal,
          }),
        })

        if (!res.ok) {
          // Carta não existe mais — recria propagando qualquer erro
          await recriarCarta()
          return
        }
      } else {
        await recriarCarta()
        return
      }

      update({ etapa_atual: 3 })

    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">A carta em si ✍️</h1>
      <p className="text-white/50 text-sm mb-8">Escreva sua mensagem</p>

      <div className="space-y-4">
        <div>
          <label className="text-white/70 text-sm block mb-2">Data importante *</label>
          <input
            type="date"
            value={data.data_importante}
            onChange={e => { update({ data_importante: e.target.value }); setErro('') }}
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">Mensagem principal *</label>
          <textarea
            value={data.mensagem_principal}
            onChange={e => { update({ mensagem_principal: e.target.value }); setErro('') }}
            placeholder="Escreva sua mensagem com carinho..."
            rows={6}
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors resize-none"
          />
        </div>
      </div>

      {erro && (
        <p className="text-pink-400 text-sm mt-4">{erro}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => update({ etapa_atual: 1 })}
          disabled={loading}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={avancar}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}