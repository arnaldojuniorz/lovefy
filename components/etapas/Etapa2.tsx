'use client'

import { useCarta } from '@/lib/carta-context'

export default function Etapa2() {
  const { data, update } = useCarta()

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
            onChange={e => update({ data_importante: e.target.value })}
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-white/70 text-sm block mb-2">Mensagem principal *</label>
          <textarea
            value={data.mensagem_principal}
            onChange={e => update({ mensagem_principal: e.target.value })}
            placeholder="Escreva sua mensagem com carinho..."
            rows={6}
            className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => update({ etapa_atual: 1 })}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={() => {
            if (!data.data_importante || !data.mensagem_principal) {
              alert('Preencha a data e a mensagem!')
              return
            }
            update({ etapa_atual: 3 })
          }}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}
