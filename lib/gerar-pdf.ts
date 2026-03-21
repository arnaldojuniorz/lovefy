import { supabaseAdmin } from './supabase'

export async function gerarPDF(carta_id: string, carta: any): Promise<string | null> {
  try {
    // Por enquanto vamos salvar os dados e retornar null
    // O PDF será implementado com puppeteer após o deploy
    console.log('Gerando PDF para carta:', carta_id)
    
    await supabaseAdmin
      .from('cartas_impressao')
      .update({ status: 'ativo' })
      .eq('id', carta_id)

    return null
  } catch (err) {
    console.error('Erro ao gerar PDF:', err)
    return null
  }
}