import { supabaseAdmin } from './supabase'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function moverFotos(carta_id: string): Promise<void> {
  if (!carta_id || !UUID_REGEX.test(carta_id)) {
    console.error('[mover-fotos] carta_id inválido:', carta_id)
    return
  }

  try {
    const { data: fotos, error } = await supabaseAdmin
      .from('fotos')
      .select('id, storage_path')
      .eq('carta_id', carta_id)
      .eq('is_temp', true)

    if (error) {
      console.error('[mover-fotos] erro ao buscar fotos:', error.message)
      return
    }

    if (!fotos || fotos.length === 0) {
      console.log('[mover-fotos] nenhuma foto temporária para:', carta_id)
      return
    }

    // Processa todas as fotos em paralelo — mais rápido que sequencial
    await Promise.allSettled(
      fotos.map(async (foto) => {
        try {
          const { data: fileData, error: downloadError } = await supabaseAdmin.storage
            .from('fotos-temp')
            .download(foto.storage_path)

          if (downloadError || !fileData) {
            console.error('[mover-fotos] erro ao baixar foto:', foto.storage_path, downloadError?.message)
            return
          }

          const { error: uploadError } = await supabaseAdmin.storage
            .from('fotos')
            .upload(foto.storage_path, fileData, { upsert: true })

          if (uploadError) {
            console.error('[mover-fotos] erro ao fazer upload da foto:', foto.storage_path, uploadError.message)
            return
          }

          // Remove do temp e marca como definitiva em paralelo
          await Promise.allSettled([
            supabaseAdmin.storage.from('fotos-temp').remove([foto.storage_path]),
            supabaseAdmin.from('fotos').update({ is_temp: false }).eq('id', foto.id),
          ])

        } catch (err) {
          console.error('[mover-fotos] erro ao processar foto:', foto.storage_path, err instanceof Error ? err.message : err)
        }
      })
    )

  } catch (err) {
    console.error('[mover-fotos] erro geral:', err instanceof Error ? err.message : err)
  }
}