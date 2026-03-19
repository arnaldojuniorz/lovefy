import QRCode from 'qrcode'
import { supabaseAdmin } from './supabase'

export async function gerarQRCode(carta_id: string, slug: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lovefy.app.br'
    const cartaUrl = appUrl + '/c/' + slug
    const qrCodeBase64 = await QRCode.toDataURL(cartaUrl, { width: 400, margin: 2 })
    const base64Data = qrCodeBase64.replace(/^data:image\/png;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    const path = 'qrcodes/' + carta_id + '.png'
    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, buffer, { contentType: 'image/png', upsert: true })
    if (uploadError) {
      console.error('Erro ao salvar QR Code:', uploadError)
      return null
    }
    const { data: urlData } = supabaseAdmin.storage.from('fotos').getPublicUrl(path)
    await supabaseAdmin.from('cartas').update({ qr_code_url: urlData.publicUrl }).eq('id', carta_id)
    return urlData.publicUrl
  } catch (err) {
    console.error('Erro ao gerar QR Code:', err)
    return null
  }
}