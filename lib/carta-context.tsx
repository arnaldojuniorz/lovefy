'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartaData = {
  nome_destinatario: string
  nome_remetente: string
  data_importante: string
  mensagem_principal: string
  estilo_fundo: string
  estilo_animacao: string
  recursos: string[]
  musica_link: string
  foto_destaque: string
  fotos_ids: string[]
  jogo_palavra1: string
  jogo_palavra2: string
  jogo_palavra3: string
  slug: string
  nome_pagador: string
  email_pagador: string
  carta_id: string
  etapa_atual: number
}

const defaultData: CartaData = {
  nome_destinatario: '',
  nome_remetente: '',
  data_importante: '',
  mensagem_principal: '',
  estilo_fundo: 'stars',
  estilo_animacao: 'float',
  recursos: [],
  musica_link: '',
  foto_destaque: '',
  fotos_ids: [],
  jogo_palavra1: '',
  jogo_palavra2: '',
  jogo_palavra3: '',
  slug: '',
  nome_pagador: '',
  email_pagador: '',
  carta_id: '',
  etapa_atual: 1,
}

const STORAGE_KEY = 'lovefy_carta_draft'

type CartaContextType = {
  data: CartaData
  update: (fields: Partial<CartaData>) => void
  reset: () => void
}

const CartaContext = createContext<CartaContextType | null>(null)

export function CartaProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CartaData>(defaultData)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CartaData>
        if (parsed.etapa_atual && parsed.etapa_atual >= 1) {
          setData(prev => ({ ...prev, ...parsed }))
        }
      }
    } catch {
    } finally {
      setHydrated(true)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { }
  }, [data, hydrated])

  function update(fields: Partial<CartaData>) {
    setData(prev => ({ ...prev, ...fields }))
  }

  function reset() {
    setData(defaultData)
    try { localStorage.removeItem(STORAGE_KEY) } catch { }
  }

  if (!hydrated) return null

  return (
    <CartaContext.Provider value={{ data, update, reset }}>
      {children}
    </CartaContext.Provider>
  )
}

export function useCarta() {
  const context = useContext(CartaContext)
  if (!context) throw new Error('useCarta deve ser usado dentro de CartaProvider')
  return context
}