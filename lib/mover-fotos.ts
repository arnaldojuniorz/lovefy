import { supabaseAdmin } from './supabase'

export async function moverFotos(carta_id: string) {
  try {
    const { data: fotos, error } = await supabaseAdmin
      .from('fotos')
      .select('*')
      .eq('carta_id', carta_id)
      .eq('is_temp', true)

    if (error || !fotos || fotos.length === 0) {
      console.log('Nenhuma foto temporaria encontrada')
      return
    }

    for (const foto of fotos) {
      try {
        const { data: fileData, error: downloadError } = await supabaseAdmin.storage
          .from('fotos-temp')
          .download(foto.storage_path)

        if (downloadError || !fileData) continue

        await supabaseAdmin.storage
          .from('fotos')
          .upload(foto.storage_path, fileData, { upsert: true })

        await supabaseAdmin.storage
          .from('fotos-temp')
          .remove([foto.storage_path])

        await supabaseAdmin
          .from('fotos')
          .update({ is_temp: false })
          .eq('id', foto.id)

      } catch (err) {
        console.error('Erro ao processar foto:', err)
      }
    }
  } catch (err) {
    console.error('Erro ao mover fotos:', err)
  }
}
