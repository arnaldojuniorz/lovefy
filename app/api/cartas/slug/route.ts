import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')

  if (!slug || slug.length < 3) {
    return NextResponse.json({ disponivel: false, error: 'Slug inválido' })
  }

  const slugLimpo = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')

  const { data } = await supabaseAdmin
    .from('cartas')
    .select('id')
    .eq('slug', slugLimpo)
    .single()

  return NextResponse.json({ disponivel: !data })
}