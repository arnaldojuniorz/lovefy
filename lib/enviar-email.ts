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
  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #222;">
    
    <h2 style="margin-bottom: 16px;">Sua carta está pronta 💌</h2>

    <p>Olá, ${emailData.nome_pagador},</p>

    <p>
      Sua carta para <strong>${emailData.nome_destinatario}</strong> foi criada com sucesso.
    </p>

    <p>
      Você pode acessar pelo link abaixo:
    </p>

    <p>
      <a href="${cartaUrl}" style="color: #2563eb; word-break: break-all;">
        ${cartaUrl}
      </a>
    </p>

    <p>
      Você pode compartilhar esse link com quem quiser.
    </p>

    <p style="margin-top: 24px;">
      — ${emailData.nome_remetente}
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />

    <p style="font-size: 12px; color: #666;">
      Enviado por Lovefy
    </p>
  </div>
  `
}

export async function enviarEmail(emailData: EmailData) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const cartaUrl = `${appUrl}/c/${emailData.slug}`

    const html = gerarHtml(emailData, cartaUrl)

    const { data: result, error } = await resend.emails.send({
      from: 'Lovefy <contato@lovefy.app.br>',
      to: emailData.email_pagador,
      subject: `${emailData.nome_destinatario}, você recebeu uma carta 💌`,
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