import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const carta_id = formData.get('carta_id') as string

    if (!file || !carta_id) {
      return NextResponse.json({ error: 'Arquivo e carta_id são obrigatórios' }, { status: 400 })
    }

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp']
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json({ error: 'Use JPG, PNG ou WEBP' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Máximo 5MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const extensao = file.name.split('.').pop()
    const path = `destaque/${carta_id}.${extensao}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('fotos')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[upload-destaque] erro:', uploadError)
      return NextResponse.json({ error: 'Erro ao fazer upload' }, { status: 500 })
    }

    await supabaseAdmin
      .from('cartas')
      .update({ foto_destaque: path })
      .eq('id', carta_id)

    const { data: urlData } = supabaseAdmin.storage
      .from('fotos')
      .getPublicUrl(path)

    return NextResponse.json({ url: urlData.publicUrl, path })

  } catch (error) {
    console.error('[upload-destaque] erro interno:', error)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}