'use client'

import { useState, useEffect } from 'react'
import { useCarta } from '@/lib/carta-context'

export default function Etapa4() {
  const { data, update } = useCarta()
  const [status, setStatus]   = useState<'idle' | 'verificando' | 'disponivel' | 'indisponivel'>('idle')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro]         = useState('')

  useEffect(() => {
    if (!data.slug || data.slug.length < 3) {
      setStatus('idle')
      return
    }

    setStatus('verificando')

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/cartas?slug=${encodeURIComponent(data.slug)}`)
        const result   = await response.json()
        setStatus(result.disponivel ? 'disponivel' : 'indisponivel')
      } catch {
        setStatus('idle')
      }
    }, 600)

    return () => clearTimeout(timer)
  }, [data.slug])

  async function avancar() {
    setErro('')

    if (!data.slug || data.slug.length < 3) {
      setErro('O link deve ter pelo menos 3 caracteres.')
      return
    }
    if (status === 'indisponivel') {
      setErro('Esse link já está em uso. Escolha outro.')
      return
    }
    if (status === 'verificando') {
      setErro('Aguarde a verificação do link.')
      return
    }
    if (!data.carta_id) {
      setErro('Carta não encontrada. Volte para o início.')
      return
    }

    setSalvando(true)

    try {
      const res    = await fetch('/api/cartas', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ carta_id: data.carta_id, slug: data.slug }),
      })
      const result = await res.json()

      if (!res.ok) {
        setErro(result.error || 'Erro ao salvar link. Tente novamente.')
        return
      }

      update({ etapa_atual: 5 })

    } catch {
      setErro('Erro de conexão. Tente novamente.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Seu link especial 🔗</h1>
      <p className="text-white/50 text-sm mb-8">Escolha um endereço único para sua carta</p>

      <div>
        <label className="text-white/70 text-sm block mb-2">Link da carta</label>
        <div className="flex items-center bg-[#0f3460] rounded-xl border border-white/10 focus-within:border-pink-500 transition-colors overflow-hidden">
          <span className="text-white/40 text-sm px-4 py-3 border-r border-white/10 whitespace-nowrap">lovefy.com/c/</span>
          <input
            type="text"
            value={data.slug}
            onChange={e => {
              update({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })
              setErro('')
            }}
            placeholder="ana-e-lucas"
            className="flex-1 bg-transparent text-white px-4 py-3 outline-none"
          />
        </div>

        <div className="mt-2 h-5">
          {status === 'verificando' && (
            <p className="text-white/40 text-xs">⏳ Verificando disponibilidade...</p>
          )}
          {status === 'disponivel' && (
            <p className="text-green-400 text-xs">✅ Link disponível!</p>
          )}
          {status === 'indisponivel' && (
            <p className="text-red-400 text-xs">❌ Esse link já está em uso. Escolha outro!</p>
          )}
          {status === 'idle' && data.slug && (
            <p className="text-white/40 text-xs">O link deve ter pelo menos 3 caracteres</p>
          )}
        </div>

        {data.slug && status === 'disponivel' && (
          <p className="text-white/40 text-xs mt-1">
            Ficará assim: lovefy.com/c/{data.slug}
          </p>
        )}
      </div>

      {erro && (
        <p className="text-pink-400 text-sm mt-4">{erro}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => update({ etapa_atual: 3 })}
          disabled={salvando}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50"
        >
          ← Voltar
        </button>
        <button
          onClick={avancar}
          disabled={status === 'verificando' || status === 'indisponivel' || salvando}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}