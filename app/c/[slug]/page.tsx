import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CartaViewer from '@/components/carta/CartaViewer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Params = { slug: string }
type Props = {
  params: Params | Promise<Params>
}

export default async function CartaPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params)
  const slug = decodeURIComponent((resolvedParams.slug ?? '').trim())

  if (!slug) notFound()

  let { data: carta, error } = await supabaseAdmin
    .from('cartas')
    .select('*, fotos(*)')
    .eq('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (!carta && !error) {
    const fallback = await supabaseAdmin
      .from('cartas')
      .select('*, fotos(*)')
      .ilike('slug', slug)
      .eq('status', 'ativo')
      .maybeSingle()

    carta = fallback.data
    error = fallback.error
  }

  if (error || !carta) notFound()

  return <CartaViewer carta={carta} />
}