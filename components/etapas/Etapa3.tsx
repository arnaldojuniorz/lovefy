'use client'

import { useCarta } from '@/lib/carta-context'
import GaleriaUpload from './GaleriaUpload'

const RECURSOS = [
  { id: 'galeria', emoji: '📸', nome: 'Galeria de Fotos', desc: 'Adicione até 5 fotos' },
  { id: 'mapa_estrelas', emoji: '🌟', nome: 'Mapa das Estrelas', desc: 'O céu do dia especial' },
  { id: 'jogo_palavras', emoji: '🎮', nome: 'Jogo de Palavras', desc: 'Um quiz divertido' },
  { id: 'musica', emoji: '🎵', nome: 'Música', desc: 'Link do Spotify' },
]

export default function Etapa3() {
  const { data, update } = useCarta()

  function toggleRecurso(id: string) {
    const novos = data.recursos.includes(id)
      ? data.recursos.filter(r => r !== id)
      : [...data.recursos, id]
    update({ recursos: novos })
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Recursos extras ✨</h1>
      <p className="text-white/50 text-sm mb-8">Selecione o que quer incluir</p>

      <div className="space-y-3">
        {RECURSOS.map(r => (
          <div key={r.id}>
            <div
              onClick={() => toggleRecurso(r.id)}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                data.recursos.includes(r.id)
                  ? 'border-pink-500 bg-pink-500/10'
                  : 'border-white/10 bg-[#0f3460] hover:border-white/30'
              }`}
            >
              <span className="text-2xl">{r.emoji}</span>
              <div className="flex-1">
                <p className="text-white font-medium">{r.nome}</p>
                <p className="text-white/50 text-xs">{r.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                data.recursos.includes(r.id) ? 'border-pink-500 bg-pink-500' : 'border-white/30'
              }`}>
                {data.recursos.includes(r.id) && <span className="text-white text-xs">✓</span>}
              </div>
            </div>

            {/* Galeria de fotos */}
            {r.id === 'galeria' && data.recursos.includes('galeria') && (
              <div className="mt-3 ml-2">
                <GaleriaUpload
                  carta_id={data.carta_id}
                  onFotosChange={(fotos) => console.log('fotos:', fotos)}
                />
              </div>
            )}

            {/* Música */}
            {r.id === 'musica' && data.recursos.includes('musica') && (
              <div className="mt-3 ml-2">
                <input
                  type="text"
                  value={data.musica_link}
                  onChange={e => update({ musica_link: e.target.value })}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => update({ etapa_atual: 2 })}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all"
        >
          ← Voltar
        </button>
        <button
          onClick={() => update({ etapa_atual: 4 })}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all"
        >
          Continuar →
        </button>
      </div>
    </div>
  )
}