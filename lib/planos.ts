// ✅ Fonte única de verdade para planos e preços
// Importar aqui em vez de duplicar em checkout/page.tsx e processar/route.ts

export const PLANOS = {
  forever: {
    preco:  9.90,
    titulo: 'Lovefy - Carta Digital Para Sempre',
    label:  'Carta Digital',
    desc:   'Link ativo para sempre',
  },
  impressao: {
    preco:  6.90,
    titulo: 'Lovefy - Carta para Impressao',
    label:  'Carta para Impressão',
    desc:   'PDF em alta qualidade',
  },
} as const

export type Plano = keyof typeof PLANOS

export function getPlano(key: unknown): { plano: Plano; data: typeof PLANOS[Plano] } | null {
  if (typeof key !== 'string') return null
  const k = key.trim().toLowerCase()
  if (k !== 'forever' && k !== 'impressao') return null
  return { plano: k, data: PLANOS[k] }
}