import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { nome, email, assunto, mensagem } = await request.json()

    if (!nome || !email || !assunto || !mensagem) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 })
    }

    await resend.emails.send({
      from: 'Lovefy <contato@lovefy.app.br>',
      to: 'contatolovefy@gmail.com',
      replyTo: email,
      subject: `[Contato Lovefy] ${assunto} - ${nome}`,
      html: `
        <div style="background:#1a1a2e;padding:40px 20px;font-family:Arial,sans-serif;color:#fff;max-width:600px;margin:0 auto">
          <h1 style="color:#ff6b9d;margin:0 0 24px">Nova mensagem de contato</h1>
          <div style="background:#16213e;borderRadius:12px;padding:20px;margin-bottom:16px">
            <p style="color:#888;font-size:12px;margin:0 0 4px">Nome</p>
            <p style="color:#fff;margin:0 0 16px;font-weight:600">${nome}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">E-mail</p>
            <p style="color:#ff6b9d;margin:0 0 16px">${email}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">Assunto</p>
            <p style="color:#fff;margin:0 0 16px;font-weight:600">${assunto}</p>
            <p style="color:#888;font-size:12px;margin:0 0 4px">Mensagem</p>
            <p style="color:#ccc;margin:0;line-height:1.6">${mensagem}</p>
          </div>
          <p style="color:#555;font-size:12px;text-align:center">Lovefy • lovefy.app.br</p>
        </div>
      `,
    })

    return NextResponse.json({ ok: true })

  } catch (error) {
    console.error('Erro ao enviar contato:', error)
    return NextResponse.json({ error: 'Erro ao enviar mensagem' }, { status: 500 })
  }
}