import { Resend } from 'resend'

const DEFAULT_APP_URL = 'https://www.lovefy.app.br'
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_REGEX = /^[a-z0-9-]{3,60}$/

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ''
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

type EmailData = {
  nome_pagador: string
  email_pagador: string
  nome_destinatario: string
  nome_remetente: string
  slug: string
  qr_code_url: string | null
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function sanitizeText(value: unknown, max = 100, fallback = ''): string {
  const clean = String(value ?? '').trim().replace(/\s+/g, ' ')
  if (!clean) return fallback
  return clean.slice(0, max)
}

function normalizeEmail(value: unknown): string | null {
  const email = String(value ?? '').trim().toLowerCase()
  if (!email || email.length > 200) return null
  if (!EMAIL_REGEX.test(email)) return null
  return email
}

function normalizeSlug(value: unknown): string | null {
  const slug = String(value ?? '').trim().toLowerCase()
  if (!SLUG_REGEX.test(slug)) return null
  return slug
}

function normalizeUrl(value: unknown): string | null {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    return url.toString()
  } catch {
    return null
  }
}

function getAppUrl(): string {
  const raw = String(
    process.env.NEXT_PUBLIC_APP_URL ??
      process.env.APP_URL ??
      DEFAULT_APP_URL
  )

  const clean = raw.replace(/[\r\n\t ]+/g, '').trim()

  try {
    const url = new URL(clean)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      return DEFAULT_APP_URL
    }
    return url.origin
  } catch {
    return DEFAULT_APP_URL
  }
}

function gerarHtml(emailData: {
  nome_pagador: string
  nome_destinatario: string
  nome_remetente: string
  carta_url: string
  qr_code_url: string | null
}): string {
  const nomePagador = escapeHtml(emailData.nome_pagador)
  const nomeDestinatario = escapeHtml(emailData.nome_destinatario)
  const nomeRemetente = escapeHtml(emailData.nome_remetente)
  const cartaUrl = escapeHtml(emailData.carta_url)

  const qrBlock = emailData.qr_code_url
    ? `
      <p style="margin: 20px 0 8px;">Ou use este QR Code:</p>
      <img src="${escapeHtml(emailData.qr_code_url)}" alt="QR Code da carta" style="max-width: 180px; border-radius: 8px;" />
    `
    : ''

  return `
  <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #222;">
    <h2 style="margin-bottom: 16px;">Sua carta está pronta 💌</h2>

    <p>Olá, ${nomePagador},</p>

    <p>
      Sua carta para <strong>${nomeDestinatario}</strong> foi criada com sucesso.
    </p>

    <p>Você pode acessar pelo link abaixo:</p>

    <p>
      <a href="${cartaUrl}" style="color: #2563eb; word-break: break-all;">
        ${cartaUrl}
      </a>
    </p>

    ${qrBlock}

    <p>Você pode compartilhar esse link com quem quiser.</p>

    <p style="margin-top: 24px;">
      — ${nomeRemetente}
    </p>

    <hr style="margin: 32px 0; border: none; border-top: 1px solid #eee;" />

    <p style="font-size: 12px; color: #666;">
      Enviado por Lovefy
    </p>
  </div>
  `
}

export async function enviarEmail(emailData: EmailData): Promise<boolean> {
  try {
    if (!resend) {
      console.error('[email] RESEND_API_KEY ausente')
      return false
    }

    const emailPagador = normalizeEmail(emailData.email_pagador)
    if (!emailPagador) {
      console.error('[email] email_pagador inválido')
      return false
    }

    const slug = normalizeSlug(emailData.slug)
    if (!slug) {
      console.error('[email] slug inválido')
      return false
    }

    const nomePagador = sanitizeText(emailData.nome_pagador, 80, 'Cliente')
    const nomeDestinatario = sanitizeText(emailData.nome_destinatario, 80, 'Pessoa especial')
    const nomeRemetente = sanitizeText(emailData.nome_remetente, 80, 'Lovefy')

    const cartaUrl = `${getAppUrl()}/c/${slug}`
    const qrCodeUrl = normalizeUrl(emailData.qr_code_url)

    const html = gerarHtml({
      nome_pagador: nomePagador,
      nome_destinatario: nomeDestinatario,
      nome_remetente: nomeRemetente,
      carta_url: cartaUrl,
      qr_code_url: qrCodeUrl,
    })

    const from = process.env.RESEND_FROM_EMAIL || 'Lovefy <contato@lovefy.app.br>'

    const { data, error } = await resend.emails.send({
      from,
      to: emailPagador,
      subject: `${nomeDestinatario}, você recebeu uma carta 💌`,
      html,
    })

    if (error) {
      console.error('[email] erro ao enviar:', error)
      return false
    }

    console.log('[email] enviado com sucesso:', data?.id)
    return true
  } catch (err) {
    console.error('[email] erro interno ao enviar:', err)
    return false
  }
}