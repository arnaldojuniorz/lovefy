import { PLANOS } from '@/lib/planos'

const FALLBACK_APP_URL = 'https://www.lovefy.app.br'

function getSafeAppUrl(): string {
  const raw   = String(process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL)
  const clean = raw.replace(/[\r\n\t ]+/g, '').trim()
  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return FALLBACK_APP_URL
    return url.origin
  } catch {
    return FALLBACK_APP_URL
  }
}

function formatBrl(valor: number): string {
  return `R$ ${valor.toFixed(2).replace('.', ',')}`
}

export const config = {
  appName: 'Lovefy',
  appUrl:  getSafeAppUrl(),

  // Fonte de verdade única: PLANOS
  price:        PLANOS.forever.preco,
  priceDisplay: formatBrl(PLANOS.forever.preco),

  plans: {
    forever: {
      price:        PLANOS.forever.preco,
      priceDisplay: formatBrl(PLANOS.forever.preco),
    },
    impressao: {
      price:        PLANOS.impressao.preco,
      priceDisplay: formatBrl(PLANOS.impressao.preco),
    },
  },

  maxPhotos:     3,
  slugMinLength: 3,
  slugMaxLength: 50,
} as const

export type Config = typeof config