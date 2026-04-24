import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    const { jsPDF } = await import('jspdf')

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    })

    // ─── Paleta ─────────────────────────────────────────
    const BG         = '#FEF9F0'
    const TEXTO      = '#2B2B2B'
    const CINZA      = '#6C757D'
    const CINZA_LEVE = '#AAAAAA'
    const ACENTO     = '#C44569'
    const DIVISOR    = '#EAEAEA'

    // ─── Layout base ────────────────────────────────────
    const ML = 18
    const MR = 18
    const PW = 210 - ML - MR
    const CX = 105
    const maxY = 260 // limite real de conteúdo

    function setSerif(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('times', style)
    }

    function setSans(style: 'normal' | 'italic' | 'bold' = 'normal') {
      doc.setFont('helvetica', style)
    }

    function divisor(y: number) {
      doc.setDrawColor(DIVISOR)
      doc.setLineWidth(0.4)
      doc.line(ML + 20, y, 210 - MR - 20, y)
    }

    // ─── Dados ──────────────────────────────────────────
    const dataImp = carta.data_importante
    let diasNum = 0
    let dataFormatada = ''

    if (dataImp) {
      const d = new Date(dataImp)
      diasNum = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
      dataFormatada = d.toLocaleDateString('pt-BR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      })
    }

    const destinatario = carta.nome_destinatario || carta.destinatario || ''
    const remetente    = carta.nome_remetente || carta.remetente || ''
    const mensagem     = carta.mensagem_principal || carta.mensagem || ''

    // ─── Fundo ──────────────────────────────────────────
    doc.setFillColor(BG)
    doc.rect(0, 0, 210, 297, 'F')

    let y = 30

    // ♡
    setSerif()
    doc.setFontSize(14)
    doc.setTextColor(180, 180, 180)
    doc.text('♡', CX, y, { align: 'center' })
    y += 14

    // "para você"
    setSans()
    doc.setFontSize(9)
    doc.setTextColor(CINZA)
    doc.text('para você', CX, y, { align: 'center' })
    y += 8

    // Nome
    setSerif()
    doc.setFontSize(26)
    doc.setTextColor(TEXTO)
    doc.text(destinatario, CX, y, { align: 'center' })
    y += 10

    // Tempo
    if (dataImp) {
      setSerif('italic')
      doc.setFontSize(10)
      doc.setTextColor(CINZA)
      doc.text(`Desde ${dataFormatada} — ${diasNum} dias`, CX, y, { align: 'center' })
      y += 10
    }

    divisor(y)
    y += 12

    // ─── Mensagem (layout corrigido) ────────────────────
    setSans()
    doc.setFontSize(12)
    doc.setTextColor(TEXTO)

    const linhas = doc.splitTextToSize(mensagem, PW)

    for (const linha of linhas) {
      if (y > maxY) break
      doc.text(linha, ML, y) // alinhamento à esquerda evita bug visual
      y += 7
    }

    y += 10

    // "te amo"
    if (y < maxY) {
      setSerif('italic')
      doc.setFontSize(20)
      doc.setTextColor(ACENTO)
      doc.text('te amo', CX, y, { align: 'center' })
      y += 12
    }

    divisor(y)
    y += 12

    // Assinatura
    setSans()
    doc.setFontSize(10)
    doc.setTextColor(CINZA)
    doc.text('com carinho,', CX, y, { align: 'center' })
    y += 8

    setSerif()
    doc.setFontSize(14)
    doc.setTextColor(TEXTO)
    doc.text(remetente, CX, y, { align: 'center' })
    y += 14

    // ─── QR Code (corrigido) ────────────────────────────
    if (carta.musica_link && y < maxY - 40) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(carta.musica_link)}`

      try {
        const res = await fetch(qrUrl)
        const ab = await res.arrayBuffer()
        const b64 = Buffer.from(ab).toString('base64')
        const dataUrl = `data:image/png;base64,${b64}`

        const size = 28 // menor que antes
        const x = CX - size / 2

        doc.addImage(dataUrl, 'PNG', x, y, size, size)

        y += size + 6

        setSans()
        doc.setFontSize(9)
        doc.setTextColor(CINZA)
        doc.text('essa música me faz lembrar de você', CX, y, { align: 'center' })
      } catch {}
    }

    // ─── Rodapé corrigido ───────────────────────────────
    doc.setDrawColor(DIVISOR)
    doc.setLineWidth(0.3)
    doc.line(ML, 280, 210 - MR, 280)

    setSans()
    doc.setFontSize(8)
    doc.setTextColor(CINZA_LEVE)
    doc.text('Lovefy · feito com carinho', CX, 285, { align: 'center' })

    // paginação correta
    doc.text('Página 1 de 1', CX, 290, { align: 'center' })

    // ─── Upload ─────────────────────────────────────────
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))
    const path = `pdfs/${carta_id}.pdf`

    const { error } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (error) {
      console.error(error)
      return null
    }

    const { data } = supabaseAdmin.storage
      .from('fotos')
      .getPublicUrl(path)

    await supabaseAdmin
      .from('cartas_impressao')
      .update({ pdf_url: data.publicUrl })
      .eq('id', carta_id)

    return data.publicUrl

  } catch (err) {
    console.error(err)
    return null
  }
}