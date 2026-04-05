import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    const corFundo = carta.cor || '#ff6b9d'
    const estilo = carta.estilo || 'classico'

    // Cores baseadas na escolha do usuário
    const bgColor = corFundo === '#1a1a1a' ? '#1a1a1a'
      : corFundo === '#f5e6d3' ? '#f5e6d3'
      : corFundo === '#ffffff' ? '#ffffff'
      : '#fff5f8'

    const textColor = corFundo === '#1a1a1a' ? '#ffffff' : '#1a1a2e'
    const mutedColor = corFundo === '#1a1a1a' ? '#888888' : '#888888'
    const accentColor = corFundo === '#1a1a1a' ? '#ff6b9d'
      : corFundo === '#f5e6d3' ? '#c44569'
      : corFundo === '#ffffff' ? '#7c3aed'
      : '#c44569'

    // Fundo
    doc.setFillColor(bgColor)
    doc.rect(0, 0, 210, 297, 'F')

    const marginLeft = 28
    const marginRight = 28
    const pageWidth = 210 - marginLeft - marginRight
    let y = 48

    // Para quem
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor)
    doc.text('Para', 105, y, { align: 'center' })
    y += 10

    // Nome do destinatário
    doc.setFontSize(estilo === 'classico' ? 40 : 34)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor)
    doc.text(carta.destinatario || '', 105, y, { align: 'center' })
    y += 14

    // Linha decorativa
    doc.setDrawColor(accentColor)
    doc.setLineWidth(0.8)
    doc.line(80, y, 130, y)
    y += 20

    // Mensagem principal
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(textColor)

    const mensagem = carta.mensagem || ''
    const linhas = doc.splitTextToSize(mensagem, pageWidth)

    // Aspas abertas
    doc.setFontSize(48)
    doc.setTextColor(accentColor)
    doc.setFont('helvetica', 'bold')
    doc.text('\u201C', marginLeft - 4, y + 6)
    doc.setFontSize(11.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(textColor)
    y += 8

    for (const linha of linhas) {
      if (y > 248) {
        doc.addPage()
        doc.setFillColor(bgColor)
        doc.rect(0, 0, 210, 297, 'F')
        y = 30
      }
      doc.text(linha, marginLeft, y)
      y += 7
    }

    // Aspas fechadas
    doc.setFontSize(48)
    doc.setTextColor(accentColor)
    doc.setFont('helvetica', 'bold')
    doc.text('\u201D', marginLeft + pageWidth - 8, y + 2)
    y += 16

    // Data importante
    if (carta.data_importante) {
      if (y > 255) { doc.addPage(); doc.setFillColor(bgColor); doc.rect(0, 0, 210, 297, 'F'); y = 30 }
      const dataFormatada = new Date(carta.data_importante).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      })
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(accentColor)
      doc.text(dataFormatada, 105, y, { align: 'center' })
      y += 14
    }

    // Linha antes da assinatura
    y = Math.max(y + 8, 238)
    doc.setDrawColor(corFundo === '#1a1a1a' ? '#333333' : '#dddddd')
    doc.setLineWidth(0.3)
    doc.line(marginLeft, y, 210 - marginRight, y)
    y += 14

    // Com carinho
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(mutedColor)
    doc.text('Com carinho,', 105, y, { align: 'center' })
    y += 10

    // Nome do remetente
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor)
    doc.text(carta.remetente || '', 105, y, { align: 'center' })

    // Marca Lovefy
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(mutedColor)
    doc.text('LOVEFY  ·  LOVEFY.APP.BR', 105, 290, { align: 'center' })

    // Upload para Supabase
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