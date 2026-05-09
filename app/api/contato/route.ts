import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  prefix: 'rl:contato',
})

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}

// Escapa caracteres HTML para evitar XSS no corpo do email
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

function sanitizeString(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string') throw new Error(`${label} inválido`)
  const clean = value.replace(/\u0000/g, '').trim()
  if (!clean) throw new Error(`${label} é obrigatório`)
  if (clean.length > max) throw new Error(`${label} muito longo (máximo ${max} caracteres)`)
  return clean
}

function sanitizeEmail(value: unknown): string {
  if (typeof value !== 'string') throw new Error('E-mail inválido')
  const clean = value.trim().toLowerCase()
  if (!clean) throw new Error('E-mail é obrigatório')
  if (clean.length > 200) throw new Error('E-mail muito longo')
  if (!EMAIL_REGEX.test(clean)) throw new Error('E-mail inválido')
  return clean
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { success } = await ratelimit.limit(`contato:${ip}`)

  if (!success) {
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em instantes.' },
      { status: 429 }
    )
  }

  try {
    let parsedBody: unknown
    try {
      parsedBody = await request.json()
    } catch {
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
    }

    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
    }

    const body = parsedBody as Record<string, unknown>

    const nome     = sanitizeString(body.nome,     'Nome',     100)
    const email    = sanitizeEmail(body.email)
    const assunto  = sanitizeString(body.assunto,  'Assunto',  150)
    const mensagem = sanitizeString(body.mensagem, 'Mensagem', 2000)

    // Escapa todos os campos antes de interpolar no HTML
    const nomeEsc     = escapeHtml(nome)
    const emailEsc    = escapeHtml(email)
    const assuntoEsc  = escapeHtml(assunto)
    const mensagemEsc = escapeHtml(mensagem).replace(/\n/g, '<br>')

    const { error: resendError } = await resend.emails.send({
      from:    'Lovefy <contato@lovefy.app.br>',
      to:      'contatolovefy@gmail.com',
      replyTo: email,
      subject: `[Contato Lovefy] ${assuntoEsc} - ${nomeEsc}`,
      html: `
        <div style="background:#1a1a2e;padding:40px 20px;font-family:Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
          <h1 style="color:#ff6b9d;margin:0 0 24px">Nova mensagem de contato</h1>
          <div style="background:#16213e;border-radius:12px;padding:20px;margin-bottom:16px">
            <p style="color:#888;font-size:12px;margin:0 0 4px">Nome</p>
            <p style="color:#fff;margin:0 0 16px;font-weight:600">${nomeEsc}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">E-mail</p>
            <p style="color:#ff6b9d;margin:0 0 16px">${emailEsc}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">Assunto</p>
            <p style="color:#fff;margin:0 0 16px;font-weight:600">${assuntoEsc}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">Mensagem</p>
            <p style="color:#ccc;margin:0;line-height:1.6">${mensagemEsc}</p>
          </div>
          <p style="color:#555;font-size:12px;text-align:center">Lovefy • lovefy.app.br</p>
        </div>
      `,
    })

    if (resendError) {
      console.error('[contato] erro ao enviar email:', resendError)
      return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })

  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('[contato] erro interno:', error)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}