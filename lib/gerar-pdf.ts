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

    // Configurar fundo
    const bgColor = corFundo === '#ff6b9d' ? '#fff5f8'
      : corFundo === '#1a1a1a' ? '#1a1a1a'
      : corFundo === '#f5e6d3' ? '#f5e6d3'
      : '#ffffff'

    const textColor = corFundo === '#1a1a1a' ? '#ffffff' : '#1a1a2e'
    const accentColor = corFundo === '#1a1a1a' ? '#ff6b9d' : '#7c3aed'

    // Fundo da página
    doc.setFillColor(bgColor)
    doc.rect(0, 0, 210, 297, 'F')

    // Margens
    const marginLeft = 24
    const marginRight = 24
    const pageWidth = 210 - marginLeft - marginRight
    let y = 35

    // Nome do destinatário
    doc.setTextColor(textColor)
    doc.setFontSize(estilo === 'classico' ? 36 : 32)
    doc.setFont('helvetica', 'bold')
    const nomeDestinatario = carta.destinatario || ''
    doc.text(nomeDestinatario, 105, y, { align: 'center' })
    y += 12

    // Subtítulo
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(corFundo === '#1a1a1a' ? '#aaaaaa' : '#888888')
    doc.text('Uma carta especial para voce', 105, y, { align: 'center' })
    y += 8

    // Linha divisória
    doc.setDrawColor(accentColor)
    doc.setLineWidth(0.5)
    doc.line(85, y, 125, y)
    y += 16

    // Mensagem principal
    doc.setTextColor(textColor)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    const mensagem = carta.mensagem || ''
    const linhas = doc.splitTextToSize(mensagem, pageWidth)

    for (const linha of linhas) {
      if (y > 260) {
        doc.addPage()
        doc.setFillColor(bgColor)
        doc.rect(0, 0, 210, 297, 'F')
        y = 30
      }
      doc.text(linha, marginLeft, y)
      y += 6
    }

    y += 8

    // Como se conheceram
    if (carta.como_se_conheceram) {
      if (y > 250) { doc.addPage(); y = 30 }
      doc.setFillColor(corFundo === '#1a1a1a' ? '#2a2a2a' : '#f0f0f0')
      doc.rect(marginLeft, y - 4, pageWidth, 20, 'F')
      doc.setDrawColor(accentColor)
      doc.setLineWidth(1)
      doc.line(marginLeft, y - 4, marginLeft, y + 16)
      doc.setFontSize(9)
      doc.setTextColor(corFundo === '#1a1a1a' ? '#aaaaaa' : '#888888')
      doc.text('COMO NOS CONHECEMOS', marginLeft + 4, y + 2)
      doc.setFontSize(10)
      doc.setTextColor(textColor)
      const linhasConheceram = doc.splitTextToSize(carta.como_se_conheceram, pageWidth - 8)
      doc.text(linhasConheceram[0] || '', marginLeft + 4, y + 8)
      y += 28
    }

    // Memória especial
    if (carta.memoria_especial) {
      if (y > 250) { doc.addPage(); y = 30 }
      doc.setFillColor(corFundo === '#1a1a1a' ? '#2a2a2a' : '#f0f0f0')
      doc.rect(marginLeft, y - 4, pageWidth, 20, 'F')
      doc.setDrawColor(accentColor)
      doc.setLineWidth(1)
      doc.line(marginLeft, y - 4, marginLeft, y + 16)
      doc.setFontSize(9)
      doc.setTextColor(corFundo === '#1a1a1a' ? '#aaaaaa' : '#888888')
      doc.text('UMA MEMORIA ESPECIAL', marginLeft + 4, y + 2)
      doc.setFontSize(10)
      doc.setTextColor(textColor)
      const linhasMemoria = doc.splitTextToSize(carta.memoria_especial, pageWidth - 8)
      doc.text(linhasMemoria[0] || '', marginLeft + 4, y + 8)
      y += 28
    }

    // Data importante
    if (carta.data_importante) {
      const dataFormatada = new Date(carta.data_importante).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'
      })
      doc.setFontSize(10)
      doc.setTextColor(accentColor)
      doc.text('Data especial: ' + dataFormatada, 105, y, { align: 'center' })
      y += 12
    }

    // Assinatura
    y = Math.max(y + 10, 240)
    doc.setFontSize(11)
    doc.setTextColor(corFundo === '#1a1a1a' ? '#aaaaaa' : '#888888')
    doc.setFont('helvetica', 'italic')
    doc.text('Com carinho,', 105, y, { align: 'center' })
    y += 8
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(textColor)
    doc.text(carta.remetente || '', 105, y, { align: 'center' })

    // Marca Lovefy
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(corFundo === '#1a1a1a' ? '#555555' : '#aaaaaa')
    doc.text('LOVEFY • LOVEFY.APP.BR', 105, 288, { align: 'center' })

    // Gerar buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Upload para Supabase
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