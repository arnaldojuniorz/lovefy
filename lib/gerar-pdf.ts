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
    const PRETO       = '#1A1A1A'
    const CINZA_TEXTO = '#2C2C2C'
    const CINZA_LEVE  = '#808080'
    const COBRE       = '#B87333'
    const BRANCO      = '#FFFFFF'

    // ─── Margens e dimensões ──────────────────────────────────────────────────
    const ML = 20   // margem esquerda
    const MR = 20   // margem direita
    const MT = 25   // margem superior
    const PW = 210 - ML - MR  // largura útil
    let y = MT

    // ─── Fundo branco ─────────────────────────────────────────────────────────
    doc.setFillColor(BRANCO)
    doc.rect(0, 0, 210, 297, 'F')

    // ─── Dupla linha editorial no topo ────────────────────────────────────────
    doc.setDrawColor(PRETO)
    doc.setLineWidth(0.8)
    doc.line(ML, y, 210 - MR, y)
    doc.setLineWidth(0.2)
    doc.line(ML, y + 2, 210 - MR, y + 2)
    y += 12

    // ─── Cabeçalho: título ────────────────────────────────────────────────────
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CINZA_LEVE)
    doc.text('CARTA ESPECIAL PARA', 105, y, { align: 'center' })
    y += 8

    // Nome do destinatário
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(PRETO)
    doc.text(carta.destinatario || carta.nome_destinatario || '', 105, y, { align: 'center' })
    y += 6

    // Linha fina sob o nome
    doc.setDrawColor(CINZA_LEVE)
    doc.setLineWidth(0.3)
    doc.line(ML + 20, y, 210 - MR - 20, y)
    y += 10

    // ─── Contador de dias ─────────────────────────────────────────────────────
    if (carta.data_importante) {
      const diff = Date.now() - new Date(carta.data_importante).getTime()
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

      // Linha vertical de destaque marginal
      doc.setDrawColor(COBRE)
      doc.setLineWidth(0.8)
      doc.line(ML, y - 1, ML, y + 12)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(COBRE)
      doc.text(`Há ${dias} dias você faz parte da minha história.`, ML + 4, y + 7)
      y += 18
    }

    // Linha separadora
    doc.setDrawColor(CINZA_LEVE)
    doc.setLineWidth(0.3)
    doc.line(ML, y, 210 - MR, y)
    y += 14

    // ─── Mensagem principal ───────────────────────────────────────────────────
    // Aspas abertas decorativas
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COBRE)
    doc.text('\u201C', ML, y + 2)
    y += 8

    // Texto da mensagem com recuo
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CINZA_TEXTO)

    const recuo = ML + 6
    const larguraMensagem = PW - 6
    const mensagem = carta.mensagem || carta.mensagem_principal || ''
    const linhas = doc.splitTextToSize(mensagem, larguraMensagem)

    for (const linha of linhas) {
      if (y > 240) {
        doc.addPage()
        doc.setFillColor(BRANCO)
        doc.rect(0, 0, 210, 297, 'F')
        y = 30
      }
      doc.text(linha, recuo, y)
      y += 7.5
    }

    // Aspas fechadas
    doc.setFontSize(36)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(COBRE)
    doc.text('\u201D', 210 - MR - 10, y)
    y += 14

    // Linha separadora
    doc.setDrawColor(CINZA_LEVE)
    doc.setLineWidth(0.3)
    doc.line(ML, y, 210 - MR, y)
    y += 12

    // ─── Assinatura ───────────────────────────────────────────────────────────
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(CINZA_LEVE)
    doc.text('Com carinho,', ML, y)
    y += 8

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(PRETO)
    doc.text(carta.remetente || carta.nome_remetente || '', ML, y)
    y += 16

    // ─── QR Code da música ────────────────────────────────────────────────────
    if (carta.musica_link) {
      // Gera QR Code via API pública
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(carta.musica_link)}&color=000000&bgcolor=ffffff`

      try {
        const res = await fetch(qrUrl)
        const arrayBuffer = await res.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        const dataUrl = `data:image/png;base64,${base64}`

        // Moldura pontilhada ao redor do QR Code
        const qrX = 105 - 22
        const qrY = y
        const qrSize = 44

        doc.setDrawColor(CINZA_LEVE)
        doc.setLineWidth(0.3)
        doc.setLineDashPattern([1, 1], 0)
        doc.rect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4)
        doc.setLineDashPattern([], 0)

        doc.addImage(dataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

        // ♪ Ícone de nota musical
        doc.setFontSize(14)
        doc.setTextColor(COBRE)
        doc.text('♪', 105, y + qrSize + 8, { align: 'center' })

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(CINZA_LEVE)
        doc.text('Escaneie e ouça a música que acompanha esta carta.', 105, y + qrSize + 14, { align: 'center' })
        doc.text('Aponte a câmera do celular para o código.', 105, y + qrSize + 20, { align: 'center' })

        y += qrSize + 28
      } catch {
        // Se falhar o QR Code, continua sem ele
      }
    }

    // ─── Rodapé ───────────────────────────────────────────────────────────────
    // Dupla linha editorial no rodapé
    doc.setDrawColor(PRETO)
    doc.setLineWidth(0.8)
    doc.line(ML, 280, 210 - MR, 280)
    doc.setLineWidth(0.2)
    doc.line(ML, 282, 210 - MR, 282)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CINZA_LEVE)
    doc.text('LOVEFY  ·  LOVEFY.APP.BR', 105, 288, { align: 'center' })

    // ─── VERSO (página 2) ─────────────────────────────────────────────────────
    doc.addPage()
    doc.setFillColor(BRANCO)
    doc.rect(0, 0, 210, 297, 'F')

    // Dupla linha editorial no topo do verso
    doc.setDrawColor(PRETO)
    doc.setLineWidth(0.8)
    doc.line(ML, 25, 210 - MR, 25)
    doc.setLineWidth(0.2)
    doc.line(ML, 27, 210 - MR, 27)

    // Título do verso
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CINZA_LEVE)
    doc.text('ANOTAÇÕES', 105, 38, { align: 'center' })

    // Linhas para escrita à mão
    doc.setDrawColor('#DDDDDD')
    doc.setLineWidth(0.3)
    let linhaY = 52
    for (let i = 0; i < 18; i++) {
      doc.line(ML, linhaY, 210 - MR, linhaY)
      linhaY += 12
    }

    // Ornamento de folha no canto inferior esquerdo (SVG vetorial simplificado)
    doc.setDrawColor(CINZA_LEVE)
    doc.setLineWidth(0.4)

    // Ramo simples: linha curva simulada com segmentos
    doc.line(ML, 275, ML + 8, 268)
    doc.line(ML + 8, 268, ML + 14, 272)
    doc.line(ML + 8, 268, ML + 16, 262)
    doc.line(ML + 16, 262, ML + 22, 266)
    doc.line(ML + 16, 262, ML + 24, 256)

    // Rodapé do verso
    doc.setDrawColor(PRETO)
    doc.setLineWidth(0.8)
    doc.line(ML, 280, 210 - MR, 280)
    doc.setLineWidth(0.2)
    doc.line(ML, 282, 210 - MR, 282)

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(CINZA_LEVE)
    doc.text('LOVEFY  ·  LOVEFY.APP.BR', 105, 288, { align: 'center' })

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