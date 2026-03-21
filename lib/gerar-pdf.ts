import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    const html = gerarHTML(carta)

    const chromium = await import('@sparticuz/chromium')
    const puppeteer = await import('puppeteer-core')

    const executablePath = await chromium.default.executablePath()

    const browser = await puppeteer.default.launch({
      args: chromium.default.args,
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    await browser.close()

    const path = `pdfs/${carta_id}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro ao salvar PDF:', uploadError)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fotos')
      .getPublicUrl(path)

    await supabaseAdmin
      .from('cartas_impressao')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', carta_id)

    console.log('PDF gerado:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    return null
  }
}

function gerarHTML(carta: any): string {
  const corFundo = carta.cor || '#ff6b9d'
  const estilo = carta.estilo || 'classico'
  const corTexto = corFundo === '#1a1a1a' ? '#ffffff' : '#1a1a2e'
  const corSecundaria = corFundo === '#1a1a1a' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
  const corDestaque = corFundo === '#1a1a1a' ? '#ff6b9d' : '#7c3aed'
  const fonteTitulo = estilo === 'classico' ? 'Georgia, serif' : 'Arial, sans-serif'

  const dataFormatada = carta.data_importante
    ? new Date(carta.data_importante).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : ''

  const paragrafos = (carta.mensagem || '')
    .split(/\n\s*\n/)
    .filter((p: string) => p.trim())
    .map((p: string) => `<p style="margin:0 0 1.4em;line-height:1.95;text-align:justify;">${p.trim()}</p>`)
    .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 210mm; height: 297mm; background: ${corFundo === '#ff6b9d' ? '#fff5f8' : corFundo}; font-family: sans-serif; color: ${corTexto}; }
.page { width: 210mm; height: 297mm; padding: 28mm 24mm; display: flex; flex-direction: column; }
.recipient { font-family: ${fonteTitulo}; font-size: 52px; font-weight: 700; color: ${corTexto}; line-height: 1; letter-spacing: -1px; margin-bottom: 12px; text-align: center; }
.subtitle { font-size: 15px; font-weight: 300; color: ${corSecundaria}; letter-spacing: 0.5px; text-align: center; }
.divider { width: 60px; height: 2px; background: ${corDestaque}; margin: 24px auto; opacity: 0.5; }
.body { font-size: 16px; color: ${corTexto}; flex: 1; margin-bottom: 32px; }
.extra { background: rgba(0,0,0,0.04); border-left: 3px solid ${corDestaque}; padding: 12px 16px; margin-bottom: 16px; border-radius: 0 8px 8px 0; }
.extra-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${corSecundaria}; margin-bottom: 4px; }
.extra-text { font-size: 14px; color: ${corTexto}; line-height: 1.6; }
.date { text-align: center; font-size: 13px; color: ${corDestaque}; margin: 24px 0; }
.sign-prefix { font-size: 14px; color: ${corSecundaria}; font-style: italic; margin-bottom: 8px; text-align: center; }
.sign-name { font-family: ${fonteTitulo}; font-size: 32px; font-weight: 600; color: ${corTexto}; text-align: center; }
.brand { text-align: center; margin-top: 32px; font-size: 10px; letter-spacing: 2px; color: ${corSecundaria}; }
</style>
</head>
<body>
<div class="page">
<div style="text-align:center;margin-bottom:48px;">
<h1 class="recipient">${carta.destinatario}</h1>
<p class="subtitle">Uma carta especial para voce</p>
<div class="divider"></div>
</div>
<div class="body">${paragrafos}</div>
${carta.como_se_conheceram ? `<div class="extra"><div class="extra-label">Como nos conhecemos</div><div class="extra-text">${carta.como_se_conheceram}</div></div>` : ''}
${carta.memoria_especial ? `<div class="extra"><div class="extra-label">Uma memoria especial</div><div class="extra-text">${carta.memoria_especial}</div></div>` : ''}
${dataFormatada ? `<div class="date">Data especial: ${dataFormatada}</div>` : ''}
<div style="margin-top:auto;padding-top:32px;">
<p class="sign-prefix">Com carinho,</p>
<p class="sign-name">${carta.remetente}</p>
</div>
<div class="brand">Lovefy • lovefy.app.br</div>
</div>
</body>
</html>`
}