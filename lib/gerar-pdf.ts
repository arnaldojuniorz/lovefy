import { supabaseAdmin } from './supabase'

type CartaImpressao = {
  nome_destinatario?: string
  destinatario?:      string
  nome_remetente?:    string
  remetente?:         string
  mensagem_principal?: string
  mensagem?:          string
  data_importante?:   string
  musica_link?:       string
  [key: string]:      unknown
}

export async function gerarPDF(carta_id: string, carta: CartaImpressao): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    })

    // ── Dimensões ─────────────────────────────────────────────────────────────
    const PG_W  = 210
    const PG_H  = 297
    const ML    = 25
    const MR    = 25
    const MT    = 25
    const PW    = PG_W - ML - MR   // 160mm
    const CX    = PG_W / 2         // 105mm

    // ── Paleta ────────────────────────────────────────────────────────────────
    const BRANCO      = '#FFFFFF'
    const TEXTO       = '#1A1A1A'
    const CINZA       = '#666666'
    const CINZA_LEVE  = '#999999'
    const ACENTO      = '#C44569'

    // ── Helpers ───────────────────────────────────────────────────────────────
    function setCormorant(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('times', style)
    }
    function setInter(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('helvetica', style)
    }

    function limparTexto(raw: unknown): string {
      if (!raw) return ''
      return String(raw)
        .replace(/&amp;/gi,  '&')
        .replace(/&lt;/gi,   '<')
        .replace(/&gt;/gi,   '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi,  "'")
        .replace(/&[a-zA-Z0-9#]+;/g, '')
        .replace(/[^\x20-\x7E\u00C0-\u024F\u0080-\u00FF]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    // ── Dados ─────────────────────────────────────────────────────────────────
    const destinatario = limparTexto(carta.nome_destinatario || carta.destinatario) || 'Voce'
    const remetente    = limparTexto(carta.nome_remetente    || carta.remetente)    || 'Remetente'
    const mensagem     = limparTexto(carta.mensagem_principal || carta.mensagem)    || ''
    const dataImp      = carta.data_importante

    let diasNum       = 0
    let dataFormatada = ''

    if (dataImp) {
      const d = new Date(dataImp)
      diasNum = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      dataFormatada = d.toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FUNDO BRANCO
    // ══════════════════════════════════════════════════════════════════════════
    doc.setFillColor(BRANCO)
    doc.rect(0, 0, PG_W, PG_H, 'F')

    // ── Cursor vertical ───────────────────────────────────────────────────────
    let y = MT

    // ── Coração minimalista ───────────────────────────────────────────────────
    // Desenhado com linhas finas em vez de emoji ou "<3"
    setInter('normal')
    doc.setFontSize(22)
    doc.setTextColor(ACENTO)
    doc.text('\u2665', CX, y, { align: 'center' })
    y += 14

    // ── "Para você" ───────────────────────────────────────────────────────────
    setCormorant('normal')
    doc.setFontSize(22)
    doc.setTextColor(TEXTO)
    doc.text('Para voc\u00EA', CX, y, { align: 'center' })
    y += 12

    // ── Contador de dias ──────────────────────────────────────────────────────
    if (dataImp && dataFormatada) {
      setInter('normal')
      doc.setFontSize(10)
      doc.setTextColor(CINZA)
      doc.text('Desde ' + dataFormatada, CX, y, { align: 'center' })
      y += 5.5
      doc.text(String(diasNum) + ' dias', CX, y, { align: 'center' })
      y += 5.5
    }

    // ── Linha divisória sutil ─────────────────────────────────────────────────
    y += 6
    const DIV_W = 24
    doc.setDrawColor('#DDDDDD')
    doc.setLineWidth(0.25)
    doc.line(CX - DIV_W / 2, y, CX + DIV_W / 2, y)
    y += 10

    // ── Mensagem principal ────────────────────────────────────────────────────
    // Largura controlada: máx 110mm, centralizada na página
    const MSG_W    = 110
    const MSG_X    = CX - MSG_W / 2

    setInter('normal')
    doc.setFontSize(11.5)
    doc.setTextColor(TEXTO)

    const linhas = doc.splitTextToSize(mensagem, MSG_W)
    const LINHA_H = 6.8

    // Limite de linhas para não ultrapassar a página
    const MAX_LINHAS = 18
    const linhasUsadas = linhas.slice(0, MAX_LINHAS)

    for (const linha of linhasUsadas) {
      doc.text(linha, MSG_X, y)
      y += LINHA_H
    }

    // ── Respiro grande antes de "TE AMO" ──────────────────────────────────────
    y += 18

    // ── "TE AMO" — elemento focal ────────────────────────────────────────────
    setCormorant('normal')
    doc.setFontSize(52)
    doc.setTextColor(ACENTO)
    doc.text('TE AMO', CX, y, { align: 'center' })
    y += 6

    // Linha decorativa abaixo
    doc.setDrawColor(ACENTO)
    doc.setLineWidth(0.3)
    const DEC_W = 40
    doc.line(CX - DEC_W / 2, y, CX + DEC_W / 2, y)
    y += 16

    // ── Assinatura ────────────────────────────────────────────────────────────
    setInter('italic')
    doc.setFontSize(11)
    doc.setTextColor(CINZA)
    doc.text('Com carinho,', CX, y, { align: 'center' })
    y += 6.5

    setInter('normal')
    doc.setFontSize(12.5)
    doc.setTextColor(TEXTO)
    doc.text(remetente, CX, y, { align: 'center' })
    y += 14

    // ── QR Code (música) ──────────────────────────────────────────────────────
    if (carta.musica_link && y < 265) {
      try {
        const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(carta.musica_link)}&color=1A1A1A&bgcolor=FFFFFF`
        const res    = await fetch(qrUrl)
        const ab     = await res.arrayBuffer()
        const b64    = Buffer.from(ab).toString('base64')
        const imgUrl = `data:image/png;base64,${b64}`

        const QR_SIZE = 22
        const QR_X    = CX - QR_SIZE / 2

        // Container limpo ao redor do QR
        doc.setFillColor('#F8F8F8')
        doc.setDrawColor('#EEEEEE')
        doc.setLineWidth(0.2)
        doc.roundedRect(QR_X - 4, y - 4, QR_SIZE + 8, QR_SIZE + 8, 2, 2, 'FD')

        doc.addImage(imgUrl, 'PNG', QR_X, y, QR_SIZE, QR_SIZE)
        y += QR_SIZE + 8

        // Legenda abaixo do QR
        setInter('italic')
        doc.setFontSize(10)
        doc.setTextColor(CINZA_LEVE)
        doc.text('Essa m\u00FAsica me faz lembrar de voc\u00EA', CX, y, { align: 'center' })

      } catch { /* QR Code é opcional */ }
    }

    // ── Rodapé discreto ───────────────────────────────────────────────────────
    setInter('normal')
    doc.setFontSize(7)
    doc.setTextColor('#CCCCCC')
    doc.text('Lovefy', CX, PG_H - 10, { align: 'center' })

    // ── Upload Supabase ───────────────────────────────────────────────────────
    const pdfBuffer   = Buffer.from(doc.output('arraybuffer'))
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

  } catch (err) {
    console.error('[gerar-pdf] erro:', err instanceof Error ? err.message : err)
    return null
  }
}