'use client'

import { useState } from 'react'
import { useCarta } from '@/lib/carta-context'
import GaleriaUpload from './GaleriaUpload'

type Foto = {
  foto_id: string
  url:     string
  path:    string
}

const RECURSOS = [
  { id: 'galeria',       nome: 'Galeria de Fotos', desc: 'Adicione até 3 fotos' },
  { id: 'mapa_estrelas', nome: 'Mapa das Estrelas', desc: 'O céu do dia especial' },
  { id: 'jogo_palavras', nome: 'Jogo de Palavras',  desc: 'Um quiz com 3 palavras' },
  { id: 'musica',        nome: 'Música',            desc: 'Link do Spotify' },
]

export default function Etapa3() {
  const { data, update } = useCarta()
  const [uploadandoDestaque, setUploadandoDestaque] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro]       = useState('')

  function toggleRecurso(id: string) {
    const novos = data.recursos.includes(id)
      ? data.recursos.filter(r => r !== id)
      : [...data.recursos, id]
    update({ recursos: novos })
  }

  async function uploadFotoDestaque(file: File) {
    if (!data.carta_id) {
      setErro('Aguarde a carta ser criada.')
      return
    }
    setErro('')
    setUploadandoDestaque(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('carta_id', data.carta_id)
      const res    = await fetch('/api/upload-destaque', { method: 'POST', body: formData })
      const result = await res.json()
      if (!res.ok) {
        setErro(result.error || 'Erro ao fazer upload')
        return
      }
      update({ foto_destaque: result.url })
    } catch {
      setErro('Erro de conexão ao enviar foto.')
    } finally {
      setUploadandoDestaque(false)
    }
  }

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
    if (!res.ok) throw new Error(result.error || 'Erro ao salvar. Tente novamente.')

    // Salva os extras na carta recriada
    await fetch('/api/cartas', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        carta_id:      result.carta_id,
        recursos:      data.recursos,
        musica_link:   data.musica_link,
        foto_destaque: data.foto_destaque,
        jogo_palavra1: data.jogo_palavra1,
        jogo_palavra2: data.jogo_palavra2,
        jogo_palavra3: data.jogo_palavra3,
      }),
    })

    update({ carta_id: result.carta_id, etapa_atual: 4 })
  }

  async function avancar() {
    setErro('')
    setLoading(true)
    try {
      if (data.carta_id) {
        const res = await fetch('/api/cartas', {
          method:  'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            carta_id:      data.carta_id,
            recursos:      data.recursos,
            musica_link:   data.musica_link,
            foto_destaque: data.foto_destaque,
            jogo_palavra1: data.jogo_palavra1,
            jogo_palavra2: data.jogo_palavra2,
            jogo_palavra3: data.jogo_palavra3,
          }),
        })

        if (!res.ok) {
          await recriarCarta()
          return
        }
      } else {
        await recriarCarta()
        return
      }

      update({ etapa_atual: 4 })
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <h1 className="text-2xl font-bold text-white mb-2">Recursos extras ✨</h1>
      <p className="text-white/50 text-sm mb-6">Personalize sua carta</p>

      {/* Foto destaque */}
      <div className="mb-6">
        <label className="text-white/70 text-sm block mb-2">
          Foto destaque do casal <span className="text-white/30">(aparece como foto principal na carta)</span>
        </label>
        {data.foto_destaque ? (
          <div className="relative">
            <img src={data.foto_destaque} alt="Foto destaque" className="w-full h-48 object-cover rounded-xl border border-white/10" />
            <button
              onClick={() => update({ foto_destaque: '' })}
              className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg">
              Trocar
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 bg-[#0f3460] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500 transition-colors">
            {uploadandoDestaque ? (
              <p className="text-white/50 text-sm">Enviando...</p>
            ) : (
              <>
                <span className="text-3xl mb-2">📸</span>
                <p className="text-white/50 text-sm">Clique para adicionar foto principal</p>
                <p className="text-white/30 text-xs mt-1">JPG, PNG ou WEBP — máx 5MB</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden"
              onChange={e => { const file = e.target.files?.[0]; if (file) uploadFotoDestaque(file) }} />
          </label>
        )}
      </div>

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

            {r.id === 'galeria' && data.recursos.includes('galeria') && (
              <div className="mt-3 ml-2">
                <GaleriaUpload
                  carta_id={data.carta_id}
                  onFotosChange={(fotos: Foto[]) => update({ fotos_ids: fotos.map(f => f.foto_id) })}
                />
              </div>
            )}

            {r.id === 'mapa_estrelas' && data.recursos.includes('mapa_estrelas') && (
              <div className="mt-3 ml-2 bg-[#0f3460] rounded-xl p-4 border border-white/10">
                <p className="text-white/70 text-sm">O mapa será gerado automaticamente com base na data que você informou.</p>
                <p className="text-pink-400 font-medium text-sm mt-2">
                  {data.data_importante
                    ? new Date(data.data_importante).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
                    : 'Preencha a data na Etapa 2'}
                </p>
              </div>
            )}

            {r.id === 'jogo_palavras' && data.recursos.includes('jogo_palavras') && (
              <div className="mt-3 ml-2 bg-[#0f3460] rounded-xl p-4 border border-white/10">
                <p className="text-white/70 text-sm mb-1">3 palavras para o jogo:</p>
                <p className="text-white/30 text-xs mb-3">A dica exibida será o número de letras de cada palavra</p>
                <div className="space-y-2">
                  <input type="text" value={data.jogo_palavra1} onChange={e => update({ jogo_palavra1: e.target.value })}
                    placeholder="Palavra 1 (ex: cidade onde se conheceram)"
                    className="w-full bg-[#16213e] text-white rounded-xl px-4 py-2 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm" />
                  <input type="text" value={data.jogo_palavra2} onChange={e => update({ jogo_palavra2: e.target.value })}
                    placeholder="Palavra 2 (ex: apelido carinhoso)"
                    className="w-full bg-[#16213e] text-white rounded-xl px-4 py-2 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm" />
                  <input type="text" value={data.jogo_palavra3} onChange={e => update({ jogo_palavra3: e.target.value })}
                    placeholder="Palavra 3 (ex: lugar favorito)"
                    className="w-full bg-[#16213e] text-white rounded-xl px-4 py-2 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm" />
                </div>
              </div>
            )}

            {r.id === 'musica' && data.recursos.includes('musica') && (
              <div className="mt-3 ml-2">
                <input type="text" value={data.musica_link} onChange={e => update({ musica_link: e.target.value })}
                  placeholder="https://open.spotify.com/track/..."
                  className="w-full bg-[#0f3460] text-white rounded-xl px-4 py-3 outline-none border border-white/10 focus:border-pink-500 transition-colors text-sm" />
              </div>
            )}
          </div>
        ))}
      </div>

      {erro && (
        <p className="text-pink-400 text-sm mt-4">{erro}</p>
      )}

      <div className="flex gap-3 mt-6">
        <button onClick={() => update({ etapa_atual: 2 })} disabled={loading}
          className="flex-1 bg-white/10 text-white font-semibold py-4 rounded-xl hover:bg-white/20 transition-all disabled:opacity-50">
          ← Voltar
        </button>
        <button onClick={avancar} disabled={loading}
          className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all disabled:opacity-50">
          {loading ? 'Salvando...' : 'Continuar →'}
        </button>
      </div>
    </div>
  )
}