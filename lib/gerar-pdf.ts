import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    })

    // ─── Paleta ───────────────────────────────────────────────────────────────
    const BG         = '#FEF9F0'
    const TEXTO      = '#2B2B2B'
    const CINZA      = '#6C757D'
    const CINZA_LEVE = '#AAAAAA'
    const ACENTO     = '#C44569'
    const DIVISOR    = '#EAEAEA'

    // ─── Dimensões A4 ─────────────────────────────────────────────────────────
    const PG_W  = 210
    const PG_H  = 297
    const ML    = 20       // margem esquerda
    const MR    = 20       // margem direita
    const MT    = 24       // margem superior
    const MB    = 20       // margem inferior
    const PW    = PG_W - ML - MR   // largura útil = 170
    const CX    = PG_W / 2         // centro = 105
    const MAX_Y = PG_H - MB - 16   // limite inferior = ~261

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function setSerif(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('times', style)
    }
    function setSans(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('helvetica', style)
    }

    // ✅ Remove entidades HTML e caracteres problemáticos para o jsPDF
    function limparTexto(raw: unknown): string {
      if (!raw) return ''
      return String(raw)
        .replace(/&amp;/gi,  '&')
        .replace(/&lt;/gi,   '<')
        .replace(/&gt;/gi,   '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi,  "'")
        .replace(/&[a-zA-Z0-9#]+;/g, '')   // remove qualquer outra entidade
        .replace(/[^\x20-\x7E\u00C0-\u024F\u0080-\u00FF]/g, '') // mantém latin
        .replace(/\s+/g, ' ')
        .trim()
    }

    function divisorLinha(y: number, pct = 0.45) {
      const w = PW * pct
      const x = CX - w / 2
      doc.setDrawColor(DIVISOR)
      doc.setLineWidth(0.35)
      doc.line(x, y, x + w, y)
    }

    // ─── Dados da carta ───────────────────────────────────────────────────────
    const destinatario = limparTexto(carta.nome_destinatario || carta.destinatario)  || 'Destinatário'
    const remetente    = limparTexto(carta.nome_remetente    || carta.remetente)     || 'Remetente'
    const mensagem     = limparTexto(carta.mensagem_principal || carta.mensagem)     || ''

    const dataImp = carta.data_importante
    let diasNum       = 0
    let dataFormatada = ''

    if (dataImp) {
      const d = new Date(dataImp)
      diasNum = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      dataFormatada = d.toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      })
        .replace(/&/g, 'e')   // "janeiro & 2024" -> nunca acontece, mas por segurança
    }

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 1
    // ══════════════════════════════════════════════════════════════════════════

    // Fundo
    doc.setFillColor(BG)
    doc.rect(0, 0, PG_W, PG_H, 'F')

    let y = MT

    // ─── Ícone coração ────────────────────────────────────────────────────────
    setSans()
    doc.setFontSize(13)
    doc.setTextColor(200, 200, 200)
    doc.text('o', CX, y, { align: 'center' })   // 'o' como placeholder visual
    // Usa símbolo de coração via texto simples
    doc.setFontSize(13)
    doc.setTextColor(210, 150, 150)
    doc.text('<3', CX, y, { align: 'center' })
    y += 12

    // ─── "para voce" ─────────────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(8.5)
    doc.setTextColor(CINZA)
    doc.text('para voce', CX, y, { align: 'center' })
    y += 7

    // ─── Nome destinatário ────────────────────────────────────────────────────
    setSerif('normal')
    doc.setFontSize(26)
    doc.setTextColor(TEXTO)

    // Garante que o nome cabe em uma linha — trunca se necessário
    const nomeLinhas = doc.splitTextToSize(destinatario, PW - 10)
    doc.text(nomeLinhas[0] ?? destinatario, CX, y, { align: 'center' })
    y += 9

    // ─── Data + dias ──────────────────────────────────────────────────────────
    if (dataImp && dataFormatada) {
      setSerif('italic')
      doc.setFontSize(9.5)
      doc.setTextColor(CINZA)
      const tempoTxt = `Desde ${dataFormatada}  -  ${diasNum} dias`
      const tempoLinhas = doc.splitTextToSize(tempoTxt, PW)
      doc.text(tempoLinhas[0], CX, y, { align: 'center' })
      y += 9
    }

    // ─── Divisor ─────────────────────────────────────────────────────────────
    divisorLinha(y)
    y += 10

    // ─── Mensagem ─────────────────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(11.5)
    doc.setTextColor(TEXTO)

    const linhasMensagem = doc.splitTextToSize(mensagem, PW)

    for (const linha of linhasMensagem) {
      if (y > MAX_Y - 50) break   // reserva espaço para assinatura e QR
      doc.text(linha, ML, y)
      y += 6.8
    }

    y += 8

    // ─── "te amo" ─────────────────────────────────────────────────────────────
    if (y < MAX_Y - 40) {
      setSerif('italic')
      doc.setFontSize(20)
      doc.setTextColor(ACENTO)
      doc.text('te amo', CX, y, { align: 'center' })
      y += 12
    }

    // ─── Divisor ─────────────────────────────────────────────────────────────
    if (y < MAX_Y - 30) {
      divisorLinha(y)
      y += 11
    }

    // ─── Assinatura ───────────────────────────────────────────────────────────
    if (y < MAX_Y - 20) {
      setSans('normal')
      doc.setFontSize(9.5)
      doc.setTextColor(CINZA)
      doc.text('com carinho,', CX, y, { align: 'center' })
      y += 7

      setSerif('normal')
      doc.setFontSize(13)
      doc.setTextColor(TEXTO)
      doc.text(remetente, CX, y, { align: 'center' })
      y += 12
    }

    // ─── QR Code ─────────────────────────────────────────────────────────────
    if (carta.musica_link && y < MAX_Y - 38) {
      try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(carta.musica_link)}&color=2B2B2B&bgcolor=FEF9F0`
        const res   = await fetch(qrUrl)
        const ab    = await res.arrayBuffer()
        const b64   = Buffer.from(ab).toString('base64')
        const imgUrl = `data:image/png;base64,${b64}`

        const qrSize = 28
        const qrX    = CX - qrSize / 2

        // Container leve
        doc.setFillColor('#FFFFFF')
        doc.setDrawColor(DIVISOR)
        doc.setLineWidth(0.3)
        doc.roundedRect(qrX - 5, y - 3, qrSize + 10, qrSize + 14, 3, 3, 'FD')

        doc.addImage(imgUrl, 'PNG', qrX, y, qrSize, qrSize)
        y += qrSize + 5

        setSans('normal')
        doc.setFontSize(8)
        doc.setTextColor(CINZA)
        doc.text('essa musica me faz lembrar de voce', CX, y, { align: 'center' })

      } catch { /* QR opcional */ }
    }

    // ─── Rodapé página 1 ─────────────────────────────────────────────────────
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.3)
    doc.line(ML, PG_H - 14, PG_W - MR, PG_H - 14)

    setSans('normal')
    doc.setFontSize(7.5)
    doc.setTextColor(CINZA_LEVE)
    doc.text('Lovefy  -  feito com carinho', CX, PG_H - 9, { align: 'center' })

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 2 — Anotações
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage()

    doc.setFillColor(BG)
    doc.rect(0, 0, PG_W, PG_H, 'F')

    let y2 = MT + 4

    // Ícone
    setSans('normal')
    doc.setFontSize(11)
    doc.setTextColor(200, 200, 200)
    doc.text('<3', CX, y2, { align: 'center' })
    y2 += 11

    // Título
    setSerif('normal')
    doc.setFontSize(13)
    doc.setTextColor(TEXTO)
    doc.text('anotacoes', CX, y2, { align: 'center' })
    y2 += 7

    // Subtexto
    setSerif('italic')
    doc.setFontSize(8.5)
    doc.setTextColor(CINZA)
    doc.text('um espaco para guardar mais momentos seus', CX, y2, { align: 'center' })
    y2 += 14

    // 8 linhas para escrita
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.35)
    for (let i = 0; i < 8; i++) {
      doc.line(ML, y2, PG_W - MR, y2)
      y2 += 14
    }

    // Rodapé página 2
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.3)
    doc.line(ML, PG_H - 14, PG_W - MR, PG_H - 14)

    setSans('normal')
    doc.setFontSize(7.5)
    doc.setTextColor(CINZA_LEVE)
    doc.text('2 / 2', CX, PG_H - 9, { align: 'center' })

    // ─── Upload Supabase ──────────────────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const storagePath = `pdfs/${carta_id}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert:      true,
      })

    if (uploadError) {
      console.error('[gerar-pdf] erro upload:', uploadError.message)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fotos')
      .getPublicUrl(storagePath)

    await supabaseAdmin
      .from('cartas_impressao')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', carta_id)

    return urlData.publicUrl

  } catch (err: any) {
    console.error('[gerar-pdf] erro:', err?.message ?? err)
    return null
  }
}