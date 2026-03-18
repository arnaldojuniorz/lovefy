import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

type EmailData = {
  nome_pagador: string
  email_pagador: string
  nome_destinatario: string
  nome_remetente: string
  slug: string
  qr_code_url: string | null
}

function gerarHtml(emailData: EmailData, cartaUrl: string): string {
  const qrCodeHtml = emailData.qr_code_url
    ? `<div style="text-align:center;margin-top:24px"><p style="color:#888;font-size:13px;margin:0 0 12px">Ou escaneie o QR Code</p><img src="${emailData.qr_code_url}" alt="QR Code" style="width:200px;height:200px;border-radius:12px" /></div>`
    : ''

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#1a1a2e;font-family:Arial,sans-serif">
      <div style="max-width:600px;margin:0 auto;padding:40px 20px">

        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#ff6b9d;font-size:32px;margin:0">💌 Lovefy</h1>
          <p style="color:#888;margin:8px 0 0">Transformando palavras em momentos inesquecíveis</p>
        </div>

        <div style="background:#16213e;border-radius:24px;padding:32px;margin-bottom:24px">
          <h2 style="color:#fff;font-size:22px;margin:0 0 8px">Olá, ${emailData.nome_pagador}! 🎉</h2>
          <p style="color:#ccc;margin:0 0 24px;line-height:1.6">
            Sua carta especial para <strong style="color:#ff6b9d">${emailData.nome_destinatario}</strong> está pronta!
            Compartilhe o link abaixo com quem você ama.
          </p>

          <div style="background:#0f3460;border-radius:12px;padding:16px;margin-bottom:24px;border:1px solid #333">
            <p style="color:#888;font-size:12px;margin:0 0 8px">Link da carta</p>
            <a href="${cartaUrl}" style="color:#ff6b9d;font-size:16px;font-weight:bold;text-decoration:none;word-break:break-all">${cartaUrl}</a>
          </div>

          <a href="${cartaUrl}" style="display:block;background:linear-gradient(135deg,#ff6b9d,#c44569);color:#fff;text-align:center;padding:16px;border-radius:12px;text-decoration:none;font-size:16px;font-weight:bold;margin-bottom:24px">
            💝 Abrir minha carta
          </a>

          ${qrCodeHtml}
        </div>

        <div style="background:#16213e;border-radius:16px;padding:20px;margin-bottom:24px">
          <p style="color:#888;font-size:13px;margin:0 0 8px">💡 Dica</p>
          <p style="color:#ccc;font-size:13px;margin:0;line-height:1.6">
            Envie o link ou o QR Code pelo WhatsApp ou Instagram.
            A carta ficará disponível para sempre!
          </p>
        </div>

        <div style="text-align:center">
          <p style="color:#555;font-size:12px;margin:0">Feito com 💕 por <strong style="color:#ff6b9d">Lovefy</strong></p>
        </div>

      </div>
    </body>
    </html>
  `
}

export async function enviarEmail(emailData: EmailData) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const cartaUrl = appUrl + '/c/' + emailData.slug
    const html = gerarHtml(emailData, cartaUrl)

    const { data: result, error } = await resend.emails.send({
      from: 'Lovefy <contato@lovefy.app.br>',
      to: emailData.email_pagador,
      subject: `💌 Sua carta para ${emailData.nome_destinatario} está pronta! - Lovefy`,
      html,
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return false
    }

    console.log('Email enviado:', result?.id)
    return true

  } catch (err) {
    console.error('Erro ao enviar email:', err)
    return false
  }
}