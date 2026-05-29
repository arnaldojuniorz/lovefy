import { supabaseAdmin } from './supabase'

type CartaImpressao = {
  nome_destinatario?:  string
  destinatario?:       string
  nome_remetente?:     string
  remetente?:          string
  mensagem_principal?: string
  mensagem?:           string
  data_importante?:    string
  musica_link?:        string
  [key: string]:       unknown
}

export async function gerarPDF(
  carta_id: string,
  carta: CartaImpressao,
): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit:        'mm',
      format:      'a4',
    })

    // ════════════════════════════════════════════════════════════════════════
    // BASE
    // ════════════════════════════════════════════════════════════════════════
    const PG_W  = 210
    const PG_H  = 297

    const MOLDURA = 16
    const ML      = 34
    const MT      = 32
    const MB      = 28

    const CX      = PG_W / 2
    const MAX_Y   = PG_H - MB

    // ════════════════════════════════════════════════════════════════════════
    // PALETA
    // ════════════════════════════════════════════════════════════════════════
    const FUNDO      = '#F6F2EC'
    const ESCURO     = '#2B2724'
    const MEDIO      = '#675F59'
    const LEVE       = '#9D948C'
    const LINHA      = '#D9D0C7'
    const ACENTO     = '#A06A6E'
    const CAIXA_QR   = '#EEE7DE'
    const RODAPE     = '#C1B8AF'

    // ════════════════════════════════════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════════════════════════════════════
    function rgb(hex: string): [number, number, number] {
      return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ]
    }

    function tc(hex: string) {
      doc.setTextColor(...rgb(hex))
    }

    function dc(hex: string) {
      doc.setDrawColor(...rgb(hex))
    }

    function fc(hex: string) {
      doc.setFillColor(...rgb(hex))
    }

    function serif(
      s: 'normal' | 'italic' | 'bold' = 'normal',
    ) {
      doc.setFont('times', s)
    }

    function sans(
      s: 'normal' | 'italic' | 'bold' = 'normal',
    ) {
      doc.setFont('helvetica', s)
    }

    function limpar(raw: unknown): string {
      if (!raw) return ''

      return String(raw)
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&[a-zA-Z0-9#]+;/g, '')
        .replace(/[^\x20-\x7E\u00C0-\u024F\u0080-\u00FF]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    function linha(
      y: number,
      w = 26,
      cor = LINHA,
      espessura = 0.16,
    ) {
      dc(cor)
      doc.setLineWidth(espessura)

      doc.line(
        CX - w / 2,
        y,
        CX + w / 2,
        y,
      )
    }

    function losango(y: number, cor = ACENTO) {
      dc(cor)
      doc.setLineWidth(0.28)

      doc.line(CX, y - 1.8, CX + 1.8, y)
      doc.line(CX + 1.8, y, CX, y + 1.8)
      doc.line(CX, y + 1.8, CX - 1.8, y)
      doc.line(CX - 1.8, y, CX, y - 1.8)
    }

    // ════════════════════════════════════════════════════════════════════════
    // DADOS
    // ════════════════════════════════════════════════════════════════════════
    const destinatario =
      limpar(carta.nome_destinatario || carta.destinatario)

    const remetente =
      limpar(carta.nome_remetente || carta.remetente)

    const mensagem =
      limpar(carta.mensagem_principal || carta.mensagem)

    const dataImportante = carta.data_importante

    let diasJuntos = 0
    let dataFormatada = ''

    if (dataImportante) {
      const d = new Date(dataImportante)

      diasJuntos = Math.floor(
        (Date.now() - d.getTime()) / 86400000,
      )

      dataFormatada = d.toLocaleDateString(
        'pt-BR',
        {
          day:      'numeric',
          month:    'long',
          year:     'numeric',
          timeZone: 'UTC',
        },
      )
    }

    // ════════════════════════════════════════════════════════════════════════
    // MENSAGEM
    // ════════════════════════════════════════════════════════════════════════
    sans('normal')
    doc.setFontSize(10)

    const MSG_W = 122

    const linhasMensagem = (
      doc.splitTextToSize(mensagem, MSG_W)
        .slice(0, 12)
    ) as string[]

    const ALTURA_MENSAGEM =
      linhasMensagem.length * 6

    const hasMensagem = linhasMensagem.length > 0
    const hasData     = Boolean(dataFormatada)
    const hasMusica   = Boolean(carta.musica_link)

    // ════════════════════════════════════════════════════════════════════════
    // ALTURA DINÂMICA
    // ════════════════════════════════════════════════════════════════════════
    const BLOCO_TOPO      = 26
    const BLOCO_DATA      = hasData ? 22 : 0
    const BLOCO_MENSAGEM  = hasMensagem
      ? ALTURA_MENSAGEM + 18
      : 0

    const BLOCO_TITULO    = 24
    const BLOCO_ASSINATURA = 22
    const BLOCO_QR        = hasMusica ? 48 : 0

    const TOTAL =
      BLOCO_TOPO +
      BLOCO_DATA +
      BLOCO_MENSAGEM +
      BLOCO_TITULO +
      BLOCO_ASSINATURA +
      BLOCO_QR

    const ESPACO_UTIL =
      PG_H - MT - MB

    const START_Y =
      MT +
      Math.max(
        0,
        (ESPACO_UTIL - TOTAL) / 2 - 6,
      )

    // ════════════════════════════════════════════════════════════════════════
    // FUNDO
    // ════════════════════════════════════════════════════════════════════════
    fc(FUNDO)
    doc.rect(0, 0, PG_W, PG_H, 'F')

    // ════════════════════════════════════════════════════════════════════════
    // MOLDURA
    // ════════════════════════════════════════════════════════════════════════
    dc(LINHA)
    doc.setLineWidth(0.22)

    doc.rect(
      MOLDURA,
      MOLDURA,
      PG_W - MOLDURA * 2,
      PG_H - MOLDURA * 2,
    )

    // ════════════════════════════════════════════════════════════════════════
    // RENDER
    // ════════════════════════════════════════════════════════════════════════
    let y = START_Y

    // ─────────────────────────────────────────────────────────────────────
    // TOPO
    // ─────────────────────────────────────────────────────────────────────
    linha(y, 22)
    losango(y)
    y += 10

    serif('italic')
    doc.setFontSize(16)

    tc(ESCURO)

    doc.text(
      'Para voc\u00EA',
      CX,
      y,
      { align: 'center' },
    )

    y += 5

    linha(y, 14, LINHA, 0.14)

    y += hasData ? 9 : 7

    // ─────────────────────────────────────────────────────────────────────
    // DATA
    // ─────────────────────────────────────────────────────────────────────
    if (hasData) {
      sans('normal')
      doc.setFontSize(8)

      tc(LEVE)

      doc.text(
        `Desde ${dataFormatada}`,
        CX,
        y,
        { align: 'center' },
      )

      y += 5.5

      sans('bold')
      doc.setFontSize(9)

      tc(MEDIO)

      doc.text(
        `${diasJuntos} dias juntos`,
        CX,
        y,
        { align: 'center' },
      )

      y += 12
    }

    // ─────────────────────────────────────────────────────────────────────
    // MENSAGEM
    // ─────────────────────────────────────────────────────────────────────
    if (hasMensagem) {
      sans('normal')
      doc.setFontSize(10)

      tc(MEDIO)

      const LH = 6
      const MSG_X = CX - MSG_W / 2

      linhasMensagem.forEach((linhaTexto) => {
        if (y + LH > MAX_Y - 65) return

        doc.text(
          linhaTexto,
          MSG_X,
          y,
        )

        y += LH
      })

      y += 12
    }

    // ─────────────────────────────────────────────────────────────────────
    // TE AMO
    // ─────────────────────────────────────────────────────────────────────
    serif('italic')
    doc.setFontSize(24)

    tc(ACENTO)

    doc.text(
      'te amo',
      CX,
      y,
      { align: 'center' },
    )

    y += 6

    linha(y, 18, ACENTO, 0.18)

    y += 14

    // ─────────────────────────────────────────────────────────────────────
    // ASSINATURA
    // ─────────────────────────────────────────────────────────────────────
    sans('italic')
    doc.setFontSize(8.5)

    tc(LEVE)

    doc.text(
      'Com carinho,',
      CX,
      y,
      { align: 'center' },
    )

    y += 5.5

    serif('normal')
    doc.setFontSize(12)

    tc(ESCURO)

    doc.text(
      remetente || destinatario,
      CX,
      y,
      { align: 'center' },
    )

    y += 18

    // ─────────────────────────────────────────────────────────────────────
    // QR CODE
    // ─────────────────────────────────────────────────────────────────────
    if (hasMusica && y + 40 < MAX_Y) {
      try {
        const qrUrl =
          `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${
            encodeURIComponent(carta.musica_link as string)
          }&color=2B2724&bgcolor=F6F2EC`

        const res = await fetch(qrUrl)

        const ab = await res.arrayBuffer()

        const b64 = Buffer
          .from(ab)
          .toString('base64')

        const imgUrl =
          `data:image/png;base64,${b64}`

        const QR = 24
        const QX = CX - QR / 2

        fc(CAIXA_QR)
        dc(LINHA)

        doc.setLineWidth(0.14)

        doc.roundedRect(
          QX - 4,
          y - 3,
          QR + 8,
          QR + 8,
          1.8,
          1.8,
          'FD',
        )

        doc.addImage(
          imgUrl,
          'PNG',
          QX,
          y,
          QR,
          QR,
        )

        y += QR + 8

        sans('italic')
        doc.setFontSize(7.5)

        tc(LEVE)

        doc.text(
          'Essa m\u00FAsica me faz lembrar de voc\u00EA',
          CX,
          y,
          { align: 'center' },
        )
      } catch {
        // QR opcional
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // ORNAMENTO BASE
    // ─────────────────────────────────────────────────────────────────────
    const BASE_Y = PG_H - 18

    linha(BASE_Y, 22)
    losango(BASE_Y)

    // ─────────────────────────────────────────────────────────────────────
    // RODAPÉ
    // ─────────────────────────────────────────────────────────────────────
    sans('normal')
    doc.setFontSize(7)

    tc(RODAPE)

    doc.text(
      'Lovefy',
      CX,
      PG_H - 10,
      { align: 'center' },
    )

    // ════════════════════════════════════════════════════════════════════════
    // PDF BUFFER
    // ════════════════════════════════════════════════════════════════════════
    const pdfBuffer = Buffer.from(
      doc.output('arraybuffer'),
    )

    const storagePath =
      `pdfs/${carta_id}.pdf`

    // ════════════════════════════════════════════════════════════════════════
    // UPLOAD
    // ════════════════════════════════════════════════════════════════════════
    const { error: uploadError } =
      await supabaseAdmin.storage
        .from('fotos')
        .upload(
          storagePath,
          pdfBuffer,
          {
            contentType: 'application/pdf',
            upsert:      true,
          },
        )

    if (uploadError) {
      console.error(
        '[gerar-pdf] erro upload:',
        uploadError.message,
      )

      return null
    }

    // ════════════════════════════════════════════════════════════════════════
    // URL
    // ════════════════════════════════════════════════════════════════════════
    const { data: urlData } =
      supabaseAdmin.storage
        .from('fotos')
        .getPublicUrl(storagePath)

    // ════════════════════════════════════════════════════════════════════════
    // UPDATE DB
    // ════════════════════════════════════════════════════════════════════════
    await supabaseAdmin
      .from('cartas_impressao')
      .update({
        pdf_url: urlData.publicUrl,
      })
      .eq('id', carta_id)

    return urlData.publicUrl

  } catch (err) {
    console.error(
      '[gerar-pdf] erro:',
      err instanceof Error
        ? err.message
        : err,
    )

    return null
  }
}