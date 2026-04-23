import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // ─── Paleta ───────────────────────────────────────────────────────────────
    const BG         = '#FEF9F0'  // off-white quente
    const TEXTO      = '#2B2B2B'  // quase preto
    const CINZA      = '#6C757D'  // cinza médio
    const CINZA_LEVE = '#AAAAAA'  // cinza claro
    const ACENTO     = '#C44569'  // rosa escuro
    const DIVISOR    = '#EAEAEA'  // linha leve

    // ─── Margens e dimensões ──────────────────────────────────────────────────
    const ML  = 14   // margem esquerda (≈48px)
    const MR  = 14   // margem direita
    const PW  = 210 - ML - MR
    const CX  = 105  // centro horizontal

    // ─── Helpers ──────────────────────────────────────────────────────────────
    function setSerif(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('times', style)
    }
    function setSans(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('helvetica', style)
    }
    function divisor(y: number, pct = 0.3) {
      const w = PW * pct
      const x = CX - w / 2
      doc.setDrawColor(DIVISOR)
      doc.setLineWidth(0.4)
      doc.line(x, y, x + w, y)
    }

    // ─── Contador de dias ─────────────────────────────────────────────────────
    const dataImp = carta.data_importante
    let diasNum = 0
    let dataFormatada = ''
    if (dataImp) {
      const d = new Date(dataImp)
      diasNum = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      dataFormatada = d.toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      })
    }

    const destinatario = carta.nome_destinatario || carta.destinatario || ''
    const remetente    = carta.nome_remetente    || carta.remetente    || ''
    const mensagem     = carta.mensagem_principal || carta.mensagem    || ''

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 1
    // ══════════════════════════════════════════════════════════════════════════

    // Fundo off-white quente
    doc.setFillColor(BG)
    doc.rect(0, 0, 210, 297, 'F')

    let y = 26  // espaço superior ≈ 80–100px

    // ─── Ícone ♡ ──────────────────────────────────────────────────────────────
    setSerif('normal')
    doc.setFontSize(14)
    doc.setTextColor(CINZA)
    // opacity simulada com cor mais clara
    doc.setTextColor(180, 180, 180)
    doc.text('♡', CX, y, { align: 'center' })
    y += 14

    // ─── "para você" ──────────────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(9)
    doc.setTextColor(CINZA)
    doc.text('para você', CX, y, { align: 'center' })
    y += 7

    // ─── Nome do destinatário ─────────────────────────────────────────────────
    setSerif('normal')
    doc.setFontSize(30)
    doc.setTextColor(TEXTO)
    doc.text(destinatario, CX, y, { align: 'center' })
    y += 5

    // ─── Tempo (prova emocional) ──────────────────────────────────────────────
    if (dataImp) {
      setSerif('italic')
      doc.setFontSize(10.5)
      doc.setTextColor(CINZA)
      doc.text(`Desde ${dataFormatada} — ${diasNum} dias`, CX, y, { align: 'center' })
    }
    y += 10

    // ─── Divisor ─────────────────────────────────────────────────────────────
    divisor(y)
    y += 10

    // ─── Mensagem principal ───────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(13)
    doc.setTextColor(TEXTO)

    const linhasMensagem = doc.splitTextToSize(mensagem, PW - 8)
    for (const linha of linhasMensagem) {
      if (y > 220) break  // evita overflow na página 1
      doc.text(linha, CX, y, { align: 'center' })
      y += 8
    }
    y += 8

    // ─── Clímax emocional "te amo" ────────────────────────────────────────────
    setSerif('italic')
    doc.setFontSize(22)
    doc.setTextColor(ACENTO)
    doc.text('te amo', CX, y, { align: 'center' })
    y += 12

    // ─── Divisor ─────────────────────────────────────────────────────────────
    divisor(y)
    y += 12

    // ─── Assinatura ───────────────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(10.5)
    doc.setTextColor(CINZA)
    doc.text('com carinho,', CX, y, { align: 'center' })
    y += 8

    setSerif('normal')
    doc.setFontSize(14)
    doc.setTextColor(TEXTO)
    doc.text(remetente, CX, y, { align: 'center' })
    y += 16

    // ─── Bloco de Música (QR Code) ────────────────────────────────────────────
    if (carta.musica_link) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(carta.musica_link)}&color=2B2B2B&bgcolor=FEF9F0`
      try {
        const res = await fetch(qrUrl)
        const ab  = await res.arrayBuffer()
        const b64 = Buffer.from(ab).toString('base64')
        const dataUrl = `data:image/png;base64,${b64}`

        const qrSize = 36  // ≈ 136px
        const qrX    = CX - qrSize / 2
        const qrY    = y

        // Container arredondado
        doc.setFillColor('#FFFFFF')
        doc.setDrawColor('#EEEEEE')
        doc.setLineWidth(0.4)
        doc.roundedRect(qrX - 6, qrY - 4, qrSize + 12, qrSize + 22, 4, 4, 'FD')

        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        setSans('normal')
        doc.setFontSize(9.5)
        doc.setTextColor(CINZA)
        doc.text('essa música me faz lembrar de você', CX, qrY + qrSize + 8, { align: 'center' })

        y += qrSize + 26
      } catch {
        // continua sem QR
      }
    }

    // ─── Rodapé página 1 ─────────────────────────────────────────────────────
    setSans('normal')
    doc.setFontSize(8)
    doc.setTextColor(CINZA_LEVE)
    doc.text('Lovefy · feito com carinho', CX, 288, { align: 'center' })

    // Linha fina de rodapé
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.3)
    doc.line(ML, 283, 210 - MR, 283)

    // ══════════════════════════════════════════════════════════════════════════
    // PÁGINA 2 — Anotações
    // ══════════════════════════════════════════════════════════════════════════
    doc.addPage()

    doc.setFillColor(BG)
    doc.rect(0, 0, 210, 297, 'F')

    let y2 = 28

    // Ícone ♡
    doc.setFontSize(12)
    doc.setTextColor(180, 180, 180)
    doc.text('♡', CX, y2, { align: 'center' })
    y2 += 12

    // Título
    setSerif('normal')
    doc.setFontSize(14)
    doc.setTextColor(TEXTO)
    doc.text('anotações', CX, y2, { align: 'center' })
    y2 += 7

    // Subtexto
    setSerif('italic')
    doc.setFontSize(9)
    doc.setTextColor(CINZA)
    doc.text('um espaço para guardar mais momentos seus', CX, y2, { align: 'center' })
    y2 += 14

    // 5 linhas para escrita manual
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.4)
    for (let i = 0; i < 5; i++) {
      doc.line(ML, y2, 210 - MR, y2)
      y2 += 16
    }

    // Rodapé página 2
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.3)
    doc.line(ML, 283, 210 - MR, 283)

    setSans('normal')
    doc.setFontSize(7.5)
    doc.setTextColor(CINZA_LEVE)
    doc.text('2 · 2', CX, 288, { align: 'center' })

    // ─── Upload para Supabase ─────────────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const path = `pdfs/${carta_id}.pdf`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, pdfBuffer, { contentType: 'application/pdf', upsert: true })

    if (uploadError) {
      console.error('[gerar-pdf] erro upload:', uploadError)
      return null
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('fotos')
      .getPublicUrl(path)

    await supabaseAdmin
      .from('cartas_impressao')
      .update({ pdf_url: urlData.publicUrl })
      .eq('id', carta_id)

    console.log('[gerar-pdf] gerado:', urlData.publicUrl)
    return urlData.publicUrl

  } catch (err) {
    console.error('[gerar-pdf] erro:', err)
    return null
  }
}