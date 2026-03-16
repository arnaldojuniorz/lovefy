'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type CartaData = {
  nome_destinatario: string
  nome_remetente: string
  como_se_conheceram: string
  memoria_especial: string
  data_importante: string
  mensagem_principal: string
  estilo_fundo: string
  estilo_animacao: string
  recursos: string[]
  musica_link: string
  musica_nome: string
  fotos: File[]
  slug: string
  nome_pagador: string
  email_pagador: string
  carta_id: string
  etapa_atual: number
}

const defaultData: CartaData = {
  nome_destinatario: '',
  nome_remetente: '',
  como_se_conheceram: '',
  memoria_especial: '',
  data_importante: '',
  mensagem_principal: '',
  estilo_fundo: 'stars',
  estilo_animacao: 'float',
  recursos: [],
  musica_link: '',
  musica_nome: '',
  fotos: [],
  slug: '',
  nome_pagador: '',
  email_pagador: '',
  carta_id: '',
  etapa_atual: 1,
}

type CartaContextType = {
  data: CartaData
  update: (fields: Partial<CartaData>) => void
  reset: () => void
}

const CartaContext = createContext<CartaContextType | null>(null)

export function CartaProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CartaData>(defaultData)

  function update(fields: Partial<CartaData>) {
    setData(prev => ({ ...prev, ...fields }))
  }

  function reset() {
    setData(defaultData)
  }

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
