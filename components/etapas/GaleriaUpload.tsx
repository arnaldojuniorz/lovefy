'use client'

import { useState } from 'react'

type Foto = {
  foto_id: string
  url:     string
  path:    string
}

type Props = {
  carta_id:      string
  onFotosChange: (fotos: Foto[]) => void
}

const MAX_FOTOS    = 3
const MAX_SIZE_MB  = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

export default function GaleriaUpload({ carta_id, onFotosChange }: Props) {
  const [fotos, setFotos]       = useState<Foto[]>([])
  const [progresso, setProgresso] = useState<Record<string, 'enviando' | 'ok' | 'erro'>>({})
  const [erro, setErro]         = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    // Guard: carta_id obrigatório
    if (!carta_id) {
      setErro('Carta não encontrada. Volte para a etapa anterior.')
      e.target.value = ''
      return
    }

    const disponiveis = MAX_FOTOS - fotos.length
    if (disponiveis <= 0) {
      setErro(`Máximo de ${MAX_FOTOS} fotos atingido.`)
      e.target.value = ''
      return
    }

    // Validação de tamanho no cliente — evita upload desnecessário
    const arquivosGrandes = files.filter(f => f.size > MAX_SIZE_BYTES)
    if (arquivosGrandes.length > 0) {
      setErro(`${arquivosGrandes.length > 1 ? 'Alguns arquivos ultrapassam' : 'O arquivo ultrapassa'} ${MAX_SIZE_MB}MB. Reduza o tamanho e tente novamente.`)
      e.target.value = ''
      return
    }

    const selecionadas = files.slice(0, disponiveis)
    setErro('')

    const novoProgresso: Record<string, 'enviando' | 'ok' | 'erro'> = {}
    // Usa index + timestamp para evitar colisão de chave com arquivos de mesmo nome
    selecionadas.forEach((_, i) => { novoProgresso[`${Date.now()}-${i}`] = 'enviando' })
    const chaves = Object.keys(novoProgresso)
    setProgresso(prev => ({ ...prev, ...novoProgresso }))

    const resultados = await Promise.allSettled(
      selecionadas.map(async (file, i) => {
        const key      = chaves[i]
        const formData = new FormData()
        formData.append('file',     file)
        formData.append('carta_id', carta_id)
        formData.append('ordem',    String(fotos.length + i))

        const res    = await fetch('/api/upload', { method: 'POST', body: formData })
        const result = await res.json()

        if (!res.ok) throw new Error(result.error || 'Erro ao enviar foto')

        setProgresso(prev => ({ ...prev, [key]: 'ok' }))
        return result as Foto
      })
    )

    const novasFotos: Foto[] = []
    resultados.forEach((r, i) => {
      const key = chaves[i]
      if (r.status === 'fulfilled') {
        novasFotos.push(r.value)
      } else {
        setProgresso(prev => ({ ...prev, [key]: 'erro' }))
      }
    })

    const total = [...fotos, ...novasFotos]
    setFotos(total)
    onFotosChange(total)

    if (novasFotos.length < selecionadas.length) {
      setErro(`${selecionadas.length - novasFotos.length} foto(s) não foram enviadas. Tente novamente.`)
    }

    e.target.value = ''
  }

  function remover(idx: number) {
    const novas = fotos.filter((_, i) => i !== idx)
    setFotos(novas)
    onFotosChange(novas)
  }

  const enviando  = Object.values(progresso).some(v => v === 'enviando')
  const restantes = MAX_FOTOS - fotos.length

  return (
    <div>
      {fotos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
          {fotos.map((foto, idx) => (
            <div key={foto.foto_id} style={{ position: 'relative', aspectRatio: '1' }}>
              <img
                src={foto.url}
                alt={`Foto ${idx + 1} da galeria`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }}
              />
              <button
                onClick={() => remover(idx)}
                aria-label={`Remover foto ${idx + 1}`}
                style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {restantes > 0 && (
        <label className="flex flex-col items-center justify-center w-full h-24 bg-[#16213e] border border-dashed border-white/20 rounded-xl cursor-pointer hover:border-pink-500 transition-colors">
          {enviando ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, margin: '0 auto 8px', overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#ff6b9d', borderRadius: 2, animation: 'progress 1.5s ease-in-out infinite', width: '60%' }} />
              </div>
              <p className="text-white/50 text-xs">Enviando fotos...</p>
            </div>
          ) : (
            <>
              <span className="text-2xl mb-1">📸</span>
              <p className="text-white/50 text-xs">
                {fotos.length === 0
                  ? `Adicionar até ${MAX_FOTOS} fotos`
                  : `Adicionar mais ${restantes} foto${restantes > 1 ? 's' : ''}`}
              </p>
              <p className="text-white/20 text-xs mt-1">Selecione várias de uma vez · máx {MAX_SIZE_MB}MB cada</p>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleUpload}
            disabled={enviando}
            className="hidden"
          />
        </label>
      )}

      {erro && <p className="text-red-400 text-xs mt-2">{erro}</p>}
      <p className="text-white/30 text-xs mt-2">{fotos.length}/{MAX_FOTOS} fotos adicionadas</p>

      <style>{`
        @keyframes progress {
          0%   { transform: translateX(-100%) }
          100% { transform: translateX(250%) }
        }
      `}</style>
    </div>
  )
}