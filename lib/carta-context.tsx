'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type CartaData = {
  nome_destinatario:  string
  nome_remetente:     string
  data_importante:    string
  mensagem_principal: string
  estilo_fundo:       string
  estilo_animacao:    string
  recursos:           string[]
  musica_link:        string
  foto_destaque:      string
  fotos_ids:          string[]
  jogo_palavra1:      string
  jogo_palavra2:      string
  jogo_palavra3:      string
  slug:               string
  nome_pagador:       string
  email_pagador:      string
  carta_id:           string
  etapa_atual:        number
}

const defaultData: CartaData = {
  nome_destinatario:  '',
  nome_remetente:     '',
  data_importante:    '',
  mensagem_principal: '',
  estilo_fundo:       'stars',
  estilo_animacao:    'float',
  recursos:           [],
  musica_link:        '',
  foto_destaque:      '',
  fotos_ids:          [],
  jogo_palavra1:      '',
  jogo_palavra2:      '',
  jogo_palavra3:      '',
  slug:               '',
  nome_pagador:       '',
  email_pagador:      '',
  carta_id:           '',
  etapa_atual:        1,
}

const STORAGE_KEY = 'lovefy_carta_draft'

type CartaContextType = {
  data:   CartaData
  update: (fields: Partial<CartaData>) => void
  reset:  () => void
}

const CartaContext = createContext<CartaContextType | null>(null)

// Valida e sanitiza os dados lidos do localStorage antes de aplicar ao estado
// Impede que dados corrompidos ou adulterados quebrem a aplicação
function sanitizeFromStorage(raw: unknown): Partial<CartaData> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}

  const obj = raw as Record<string, unknown>
  const out: Partial<CartaData> = {}

  const str = (v: unknown): string =>
    typeof v === 'string' ? v.slice(0, 5000) : ''

  const strArr = (v: unknown): string[] => {
    if (!Array.isArray(v)) return []
    return v.filter((i): i is string => typeof i === 'string').slice(0, 20)
  }

  if (typeof obj.nome_destinatario  === 'string') out.nome_destinatario  = str(obj.nome_destinatario)
  if (typeof obj.nome_remetente     === 'string') out.nome_remetente     = str(obj.nome_remetente)
  if (typeof obj.data_importante    === 'string') out.data_importante    = str(obj.data_importante)
  if (typeof obj.mensagem_principal === 'string') out.mensagem_principal = str(obj.mensagem_principal)
  if (typeof obj.estilo_fundo       === 'string') out.estilo_fundo       = str(obj.estilo_fundo)
  if (typeof obj.estilo_animacao    === 'string') out.estilo_animacao    = str(obj.estilo_animacao)
  if (typeof obj.musica_link        === 'string') out.musica_link        = str(obj.musica_link)
  if (typeof obj.foto_destaque      === 'string') out.foto_destaque      = str(obj.foto_destaque)
  if (typeof obj.jogo_palavra1      === 'string') out.jogo_palavra1      = str(obj.jogo_palavra1)
  if (typeof obj.jogo_palavra2      === 'string') out.jogo_palavra2      = str(obj.jogo_palavra2)
  if (typeof obj.jogo_palavra3      === 'string') out.jogo_palavra3      = str(obj.jogo_palavra3)
  if (typeof obj.slug               === 'string') out.slug               = str(obj.slug)
  if (typeof obj.nome_pagador       === 'string') out.nome_pagador       = str(obj.nome_pagador)
  if (typeof obj.email_pagador      === 'string') out.email_pagador      = str(obj.email_pagador)
  if (typeof obj.carta_id           === 'string') out.carta_id           = str(obj.carta_id)
  if (Array.isArray(obj.recursos))  out.recursos  = strArr(obj.recursos)
  if (Array.isArray(obj.fotos_ids)) out.fotos_ids = strArr(obj.fotos_ids)

  if (typeof obj.etapa_atual === 'number' && Number.isInteger(obj.etapa_atual) && obj.etapa_atual >= 1 && obj.etapa_atual <= 5) {
    out.etapa_atual = obj.etapa_atual
  }

  return out
}

export function CartaProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CartaData>(defaultData)

  useEffect(() => {
    // Aplicado após mount — não bloqueia a renderização inicial
    try {
      const saved  = localStorage.getItem(STORAGE_KEY)
      if (!saved) return
      const parsed = JSON.parse(saved)
      const safe   = sanitizeFromStorage(parsed)
      if (Object.keys(safe).length > 0) {
        setData(prev => ({ ...prev, ...safe }))
      }
    } catch { }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch { }
  }, [data])

  function update(fields: Partial<CartaData>) {
    setData(prev => ({ ...prev, ...fields }))
  }

  function reset() {
    setData(defaultData)
    try { localStorage.removeItem(STORAGE_KEY) } catch { }
  }

  // Renderiza children imediatamente — sem flash de tela vazia
  return (
    <CartaContext.Provider value={{ data, update, reset }}>
      {children}
    </CartaContext.Provider>
  )
}

export function useCarta() {
  const ctx = useContext(CartaContext)
  if (!ctx) throw new Error('useCarta deve ser usado dentro de CartaProvider')
  return ctx
}