const FALLBACK_APP_URL = 'https://www.lovefy.app.br'

function getSafeAppUrl() {
  const raw = String(process.env.NEXT_PUBLIC_APP_URL || FALLBACK_APP_URL)
  const clean = raw.replace(/[\r\n\t ]+/g, '').trim()

  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return FALLBACK_APP_URL
    }
    return url.origin
  } catch {
    return FALLBACK_APP_URL
  }
}

function formatBrl(cents) {
  return `R$ ${(cents / 100).toFixed(2).replace('.', ',')}`
}

const PRICE_DIGITAL = 1290
const PRICE_IMPRESSAO = 990

export const config = {
  appName: 'Lovefy',
  appUrl: getSafeAppUrl(),

  // retrocompatibilidade (plano principal digital)
  price: PRICE_DIGITAL,
  priceDisplay: formatBrl(PRICE_DIGITAL),

  // novos preços por plano
  plans: {
    forever: {
      price: PRICE_DIGITAL,
      priceDisplay: formatBrl(PRICE_DIGITAL),
    },
    impressao: {
      price: PRICE_IMPRESSAO,
      priceDisplay: formatBrl(PRICE_IMPRESSAO),
    },
  },

  maxPhotos: 3,
  slugMinLength: 3,
  slugMaxLength: 50,
}