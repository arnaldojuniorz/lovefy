import QRCode from 'qrcode'
import { supabaseAdmin } from './supabase'

const FALLBACK_URL = 'https://www.lovefy.app.br'
const SLUG_REGEX   = /^[a-z0-9-]{3,80}$/

function getBaseUrl(): string {
  const raw   = String(process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_URL)
  const clean = raw.replace(/[\r\n\t ]+/g, '').trim()
  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return FALLBACK_URL
    return url.origin
  } catch {
    return FALLBACK_URL
  }
}

export async function gerarQRCode(carta_id: string, slug: string): Promise<string | null> {
  if (!carta_id || !slug) {
    console.error('[qrcode] carta_id ou slug ausente')
    return null
  }

  const slugLimpo = slug.trim().toLowerCase()
  if (!SLUG_REGEX.test(slugLimpo)) {
    console.error('[qrcode] slug inválido:', slugLimpo)
    return null
  }

  try {
    const cartaUrl     = `${getBaseUrl()}/c/${slugLimpo}`
    const qrCodeBase64 = await QRCode.toDataURL(cartaUrl, { width: 400, margin: 2 })
    const base64Data   = qrCodeBase64.replace(/^data:image\/png;base64,/, '')
    const buffer       = Buffer.from(base64Data, 'base64')
    const path         = `qrcodes/${carta_id}.png`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })

    if (uploadError) {
      console.error('[qrcode] erro ao salvar no storage:', uploadError.message)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage.from('fotos').getPublicUrl(path)

    await supabaseAdmin
      .from('cartas')
      .update({ qr_code_url: urlData.publicUrl })
      .eq('id', carta_id)

    return urlData.publicUrl

  } catch (err) {
    console.error('[qrcode] erro ao gerar:', err instanceof Error ? err.message : err)
    return null
  }
}