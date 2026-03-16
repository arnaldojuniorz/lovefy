'use client'

import { useState } from 'react'

type Foto = {
  foto_id: string
  url: string
  path: string
}

type Props = {
  carta_id: string
  onFotosChange: (fotos: Foto[]) => void
}

export default function GaleriaUpload({ carta_id, onFotosChange }: Props) {
  const [fotos, setFotos] = useState<Foto[]>([])
  const [uploading, setUploading] = useState(false)
  const [erro, setErro] = useState('')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    
    if (fotos.length + files.length > 5) {
      setErro('Máximo de 5 fotos permitido!')
      return
    }

    setUploading(true)
    setErro('')

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('carta_id', carta_id)
      formData.append('ordem', String(fotos.length + i))

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()

        if (!response.ok) {
          setErro(result.error || 'Erro ao fazer upload')
          continue
        }

        const novasFotos = [...fotos, result]
        setFotos(novasFotos)
        onFotosChange(novasFotos)

      } catch (error) {
        setErro('Erro de conexão ao fazer upload')
      }
    }

    setUploading(false)
  }

  function removerFoto(index: number) {
    const novasFotos = fotos.filter((_, i) => i !== index)
    setFotos(novasFotos)
    onFotosChange(novasFotos)
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {fotos.map((foto, index) => (
          <div key={foto.foto_id} className="relative aspect-square">
            <img
              src={foto.url}
              alt={`Foto ${index + 1}`}
              className="w-full h-full object-cover rounded-xl"
            />
            <button
              onClick={() => removerFoto(index)}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        ))}

        {fotos.length < 5 && (
          <label className="aspect-square bg-[#0f3460] border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-pink-500 transition-colors">
            <span className="text-2xl mb-1">📸</span>
            <span className="text-white/40 text-xs">Adicionar</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {uploading && (
        <p className="text-white/50 text-xs">Enviando fotos...</p>
      )}

      {erro && (
        <p className="text-red-400 text-xs">{erro}</p>
      )}

      <p className="text-white/30 text-xs">{fotos.length}/5 fotos adicionadas</p>
    </div>
  )
}