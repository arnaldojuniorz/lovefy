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

    // ── Dimensões A4 ──────────────────────────────────────────────────────────
    const PG_W = 210
    const PG_H = 297
    const ML   = 28
    const MR   = 28
    const CX   = PG_W / 2
    const PW   = PG_W - ML - MR   // 154mm

    // ── Paleta creme premium ──────────────────────────────────────────────────
    const FUNDO      = '#F3EFE8'
    const TEXTO_ESC  = '#2E2A27'
    const TEXTO_MED  = '#5C5248'
    const TEXTO_LEVE = '#9C9189'
    const ACENTO     = '#B07070'   // rosé suave — não vermelho puro

    // ── Helpers tipográficos ──────────────────────────────────────────────────
    // Cormorant Garamond simulado via times (melhor serif disponível no jsPDF)
    function setCormorant(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('times', style)
    }
    // Inter simulado via helvetica
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

    function hexToRgb(hex: string): [number, number, number] {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return [r, g, b]
    }

    function setTextColor(hex: string) {
      const [r, g, b] = hexToRgb(hex)
      doc.setTextColor(r, g, b)
    }

    function setDrawColorHex(hex: string) {
      const [r, g, b] = hexToRgb(hex)
      doc.setDrawColor(r, g, b)
    }

    function setFillColorHex(hex: string) {
      const [r, g, b] = hexToRgb(hex)
      doc.setFillColor(r, g, b)
    }

    // ── Dados ─────────────────────────────────────────────────────────────────
    const destinatario = limparTexto(carta.nome_destinatario || carta.destinatario) || ''
    const remetente    = limparTexto(carta.nome_remetente    || carta.remetente)    || ''
    const mensagem     = limparTexto(carta.mensagem_principal || carta.mensagem)    || ''
    const dataImp      = carta.data_importante

    let diasNum       = 0
    let dataFormatada = ''

    if (dataImp) {
      const d = new Date(dataImp)
      diasNum       = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      dataFormatada = d.toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      })
    }

    // ══════════════════════════════════════════════════════════════════════════
    // FUNDO CREME QUENTE
    // ══════════════════════════════════════════════════════════════════════════
    setFillColorHex(FUNDO)
    doc.rect(0, 0, PG_W, PG_H, 'F')

    // Borda refinada interna — 4mm da margem
    const BORDA_M = 8
    setDrawColorHex('#DDD5C8')
    doc.setLineWidth(0.2)
    doc.rect(BORDA_M, BORDA_M, PG_W - BORDA_M * 2, PG_H - BORDA_M * 2)

    // ── Cursor vertical ───────────────────────────────────────────────────────
    let y = 38

    // ── Ornamento topo: linha + diamante ──────────────────────────────────────
    setDrawColorHex('#C8BDB0')
    doc.setLineWidth(0.25)
    const ORN_W = 32
    doc.line(CX - ORN_W - 3, y, CX - 4, y)
    doc.line(CX + 4, y, CX + ORN_W + 3, y)
    // losango central
    doc.setLineWidth(0.3)
    setDrawColorHex(ACENTO)
    doc.line(CX, y - 2, CX + 2.5, y)
    doc.line(CX + 2.5, y, CX, y + 2)
    doc.line(CX, y + 2, CX - 2.5, y)
    doc.line(CX - 2.5, y, CX, y - 2)
    y += 14

    // ── "Para você" ───────────────────────────────────────────────────────────
    setCormorant('italic')
    doc.setFontSize(15)
    setTextColor(TEXTO_MED)
    doc.text('Para voc\u00EA', CX, y, { align: 'center' })
    y += 5

    // ── Linha separadora fina ─────────────────────────────────────────────────
    setDrawColorHex('#D8CFC4')
    doc.setLineWidth(0.15)
    doc.line(CX - 18, y, CX + 18, y)
    y += 10

    // ── Contador ──────────────────────────────────────────────────────────────
    if (dataImp && dataFormatada) {
      setInter('normal')
      doc.setFontSize(8.5)
      setTextColor(TEXTO_LEVE)
      doc.text('Desde ' + dataFormatada, CX, y, { align: 'center' })
      y += 5
      setInter('bold')
      doc.setFontSize(9)
      setTextColor(TEXTO_MED)
      doc.text(String(diasNum) + ' dias juntos', CX, y, { align: 'center' })
      y += 5
    }

    // ── Linha separadora ──────────────────────────────────────────────────────
    y += 6
    setDrawColorHex('#D8CFC4')
    doc.setLineWidth(0.15)
    doc.line(CX - 22, y, CX + 22, y)
    y += 12

    // ── Mensagem ──────────────────────────────────────────────────────────────
    if (mensagem) {
      const MSG_W = 120
      const MSG_X = CX - MSG_W / 2

      setInter('normal')
      doc.setFontSize(10.5)
      setTextColor(TEXTO_MED)

      const linhas    = doc.splitTextToSize(mensagem, MSG_W)
      const MAX_LINHAS = 16
      const LINHA_H   = 6.2

      linhas.slice(0, MAX_LINHAS).forEach((linha: string) => {
        doc.text(linha, MSG_X, y)
        y += LINHA_H
      })

      y += 10
    } else {
      y += 6
    }

    // ── "te amo" — foco emocional sofisticado ─────────────────────────────────
    // Ornamento antes
    setDrawColorHex('#C8BDB0')
    doc.setLineWidth(0.2)
    doc.line(CX - 28, y, CX + 28, y)
    y += 10

    setCormorant('italic')
    doc.setFontSize(36)
    setTextColor(ACENTO)
    doc.text('te amo', CX, y, { align: 'center' })
    y += 5

    // Ornamento depois
    setDrawColorHex('#C8BDB0')
    doc.setLineWidth(0.2)
    doc.line(CX - 28, y, CX + 28, y)
    y += 16

    // ── Assinatura ────────────────────────────────────────────────────────────
    setInter('italic')
    doc.setFontSize(9.5)
    setTextColor(TEXTO_LEVE)
    doc.text('Com carinho,', CX, y, { align: 'center' })
    y += 6

    setCormorant('normal')
    doc.setFontSize(13)
    setTextColor(TEXTO_ESC)
    doc.text(remetente || destinatario, CX, y, { align: 'center' })
    y += 16

    // ── QR Code ───────────────────────────────────────────────────────────────
    if (carta.musica_link && y < 250) {
      try {
        const qrUrl  = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(carta.musica_link)}&color=2E2A27&bgcolor=F3EFE8`
        const res    = await fetch(qrUrl)
        const ab     = await res.arrayBuffer()
        const b64    = Buffer.from(ab).toString('base64')
        const imgUrl = `data:image/png;base64,${b64}`

        const QR_SIZE = 20
        const QR_X    = CX - QR_SIZE / 2

        // Container creme com borda suave
        setFillColorHex('#EDE8DF')
        setDrawColorHex('#D8CFC4')
        doc.setLineWidth(0.2)
        doc.roundedRect(QR_X - 5, y - 4, QR_SIZE + 10, QR_SIZE + 10, 2, 2, 'FD')

        doc.addImage(imgUrl, 'PNG', QR_X, y, QR_SIZE, QR_SIZE)
        y += QR_SIZE + 8

        setInter('italic')
        doc.setFontSize(8)
        setTextColor(TEXTO_LEVE)
        doc.text('Essa m\u00FAsica me faz lembrar de voc\u00EA', CX, y, { align: 'center' })

      } catch { /* QR opcional */ }
    }

    // ── Ornamento base ────────────────────────────────────────────────────────
    const BASE_Y = PG_H - 18
    setDrawColorHex('#C8BDB0')
    doc.setLineWidth(0.2)
    const BASE_W = 30
    doc.line(CX - BASE_W - 3, BASE_Y, CX - 4, BASE_Y)
    doc.line(CX + 4, BASE_Y, CX + BASE_W + 3, BASE_Y)
    setDrawColorHex(ACENTO)
    doc.setLineWidth(0.3)
    doc.line(CX, BASE_Y - 2, CX + 2, BASE_Y)
    doc.line(CX + 2, BASE_Y, CX, BASE_Y + 2)
    doc.line(CX, BASE_Y + 2, CX - 2, BASE_Y)
    doc.line(CX - 2, BASE_Y, CX, BASE_Y - 2)

    // ── Rodapé ────────────────────────────────────────────────────────────────
    setInter('normal')
    doc.setFontSize(6.5)
    setTextColor('#B8AFA6')
    doc.text('Lovefy', CX, PG_H - 10, { align: 'center' })

    // ══════════════════════════════════════════════════════════════════════════
    // UPLOAD SUPABASE
    // ══════════════════════════════════════════════════════════════════════════
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