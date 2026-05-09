'use client'

import { useState } from 'react'
import { useCarta } from '@/lib/carta-context'
import { PLANOS } from '@/lib/planos'

const PRECO_DISPLAY = PLANOS.forever.preco.toFixed(2).replace('.', ',')

export default function Etapa5() {
  const { data, update } = useCarta()
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  async function handleContinuar() {
    if (!data.nome_pagador || !data.email_pagador) {
      setErro('Preencha seu nome e e-mail.')
      return
    }

    setLoading(true)
    setErro('')

    try {
      let carta_id = data.carta_id

      if (carta_id) {
        const patchRes = await fetch('/api/cartas', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            carta_id,
            nome_pagador:  data.nome_pagador,
            email_pagador: data.email_pagador,
          }),
        })
        if (!patchRes.ok) carta_id = ''
      }

      if (!carta_id) {
        const postRes    = await fetch('/api/cartas', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            nome_destinatario:  data.nome_destinatario,
            nome_remetente:     data.nome_remetente,
            mensagem_principal: data.mensagem_principal,
            data_importante:    data.data_importante,
            musica_link:        data.musica_link,
            foto_destaque:      data.foto_destaque,
            recursos:           data.recursos,
            jogo_palavra1:      data.jogo_palavra1,
            jogo_palavra2:      data.jogo_palavra2,
            jogo_palavra3:      data.jogo_palavra3,
            slug:               data.slug,
            nome_pagador:       data.nome_pagador,
            email_pagador:      data.email_pagador,
          }),
        })
        const postResult = await postRes.json()

        if (!postRes.ok) {
          setErro(postResult.error || 'Erro ao criar carta')
          return
        }

        carta_id = postResult.carta_id
        update({ carta_id })
      }

      window.location.href = `/checkout?carta_id=${carta_id}&plano=forever&tipo=digital&nome=${encodeURIComponent(data.nome_pagador)}&email=${encodeURIComponent(data.email_pagador)}`

    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Quase lá! 💳</h1>
      <p className="text-white/50 text-sm mb-6">Preencha seus dados para finalizar</p>

      <div className="space-y-4">
        <div>
          <label className="text-white/70 text-sm block mb-2">Seu nome *</label>
          <input
            type="text"
            value={data.nome_pagador}
            onChange={e => { update({ nome_pagador: e.target.value }); setErro('') }}
            placeholder="Seu nome completo"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">Seu e-mail *</label>
          <input
            type="email"
            value={data.email_pagador}
            onChange={e => { update({ email_pagador: e.target.value }); setErro('') }}
            placeholder="seu@email.com"
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div className="p-5 rounded-xl border border-pink-500 bg-pink-500/10 relative">
          <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">Único plano</span>
          <div className="flex justify-between items-center">
            <div>
              <p className="text-white font-bold text-2xl">R$ {PRECO_DISPLAY}</p>
              <p className="text-white/70 text-sm font-medium">Carta Para Sempre</p>
              <p className="text-white/40 text-xs mt-1">Link vitalício · Nunca expira</p>
            </div>
            <div className="text-3xl">💌</div>
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
          {loading ? 'Aguarde...' : 'Finalizar →'}
        </button>
      </div>
    </div>
  )
}