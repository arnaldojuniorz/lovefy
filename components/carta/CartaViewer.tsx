'use client'

import { useState } from 'react'

type Foto = {
  id: string
  storage_path: string
  ordem: number
  is_temp: boolean
}

type Carta = {
  id: string
  nome_destinatario: string
  nome_remetente: string
  como_se_conheceram: string
  memoria_especial: string
  data_importante: string
  mensagem_principal: string
  estilo_fundo: string
  recursos: string[]
  musica_link: string
  slug: string
  fotos: Foto[]
}

type Props = {
  carta: Carta
}

export default function CartaViewer({ carta }: Props) {
  const [pagina, setPagina] = useState(0)

  const paginas = buildPaginas(carta)

  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {paginas[pagina]}

        {pagina < paginas.length - 1 && (
          <button
            onClick={() => setPagina(p => p + 1)}
            className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 rounded-xl hover:brightness-110 transition-all"
          >
            Continuar →
          </button>
        )}
      </div>
    </main>
  )
}

function buildPaginas(carta: Carta) {
  const paginas = []

  // Página 1 — Envelope
  paginas.push(<PaginaEnvelope carta={carta} key="envelope" />)

  // Página 2 — Mensagem principal
  paginas.push(<PaginaMensagem carta={carta} key="mensagem" />)

  // Página 3 — Galeria de fotos
  if (carta.recursos.includes('galeria') && carta.fotos?.length > 0) {
    paginas.push(<PaginaGaleria carta={carta} key="galeria" />)
  }

  // Página 4 — Contador de dias
  paginas.push(<PaginaContador carta={carta} key="contador" />)

  // Página 5 — Tela final
  paginas.push(<PaginaFinal carta={carta} key="final" />)

  return paginas
}

function PaginaEnvelope({ carta }: { carta: Carta }) {
  return (
    <div className="bg-[#16213e] rounded-3xl p-8 text-center">
      <div className="text-8xl mb-6">💌</div>
      <h1 className="text-2xl font-bold text-white mb-3">
        Você recebeu uma carta especial
      </h1>
      <p className="text-white/50 mb-2">De <span className="text-pink-400 font-medium">{carta.nome_remetente}</span></p>
      <p className="text-white/50">Para <span className="text-pink-400 font-medium">{carta.nome_destinatario}</span></p>
    </div>
  )
}

function PaginaMensagem({ carta }: { carta: Carta }) {
  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <div className="text-4xl mb-4 text-center">✉️</div>
      <h2 className="text-xl font-bold text-white mb-6 text-center">Minha mensagem para você</h2>
      <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{carta.mensagem_principal}</p>
      {carta.como_se_conheceram && (
        <div className="mt-6 p-4 bg-[#0f3460] rounded-xl border border-white/10">
          <p className="text-white/40 text-xs mb-1">Como nos conhecemos</p>
          <p className="text-white/70 text-sm">{carta.como_se_conheceram}</p>
        </div>
      )}
      {carta.memoria_especial && (
        <div className="mt-3 p-4 bg-[#0f3460] rounded-xl border border-white/10">
          <p className="text-white/40 text-xs mb-1">Uma memória especial</p>
          <p className="text-white/70 text-sm">{carta.memoria_especial}</p>
        </div>
      )}
    </div>
  )
}

function PaginaGaleria({ carta }: { carta: Carta }) {
  const fotosAtivas = carta.fotos.filter(f => !f.is_temp)

  return (
    <div className="bg-[#16213e] rounded-3xl p-8">
      <div className="text-4xl mb-4 text-center">📸</div>
      <h2 className="text-xl font-bold text-white mb-6 text-center">Nossa galeria</h2>
      <div className="grid grid-cols-2 gap-3">
        {fotosAtivas.map((foto) => {
          const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/fotos/${foto.storage_path}`
          return (
            <img
              key={foto.id}
              src={url}
              alt="Foto"
              className="w-full aspect-square object-cover rounded-xl"
            />
          )
        })}
      </div>
    </div>
  )
}

function PaginaContador({ carta }: { carta: Carta }) {
  const dias = carta.data_importante
    ? Math.floor((new Date().getTime() - new Date(carta.data_importante).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="bg-[#16213e] rounded-3xl p-8 text-center">
      <div className="text-4xl mb-4">💕</div>
      <h2 className="text-xl font-bold text-white mb-2">Nossa história</h2>
      <p className="text-white/50 text-sm mb-8">
        Desde {new Date(carta.data_importante).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
      <div className="bg-[#0f3460] rounded-2xl p-6 border border-white/10">
        <span className="text-5xl font-black text-pink-400">{dias.toLocaleString('pt-BR')}</span>
        <p className="text-white/50 text-sm mt-2">dias juntos</p>
      </div>
    </div>
  )
}

function PaginaFinal({ carta }: { carta: Carta }) {
  return (
    <div className="bg-[#16213e] rounded-3xl p-8 text-center">
      <div className="text-6xl mb-6">💝</div>
      <h2 className="text-2xl font-bold text-white mb-4">Com todo meu amor</h2>
      <p className="text-pink-400 text-xl font-medium mb-8">{carta.nome_remetente} 💕</p>
      <div className="border-t border-white/10 pt-6">
        <p className="text-white/30 text-xs">Criado com</p>
        <p className="text-pink-400 font-bold">Lovefy ✨</p>
      </div>
    </div>
  )
}