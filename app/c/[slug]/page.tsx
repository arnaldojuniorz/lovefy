import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CartaViewer from '@/components/carta/CartaViewer'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: { slug: string }
}

export default async function CartaPage({ params }: Props) {
  const slug = decodeURIComponent((params.slug ?? '').trim())

  if (!slug) {
    notFound()
  }

  const { data: carta, error } = await supabaseAdmin
    .from('cartas')
    .select('*, fotos(*)')
    .eq('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error || !carta) {
    notFound()
  }

  return <CartaViewer carta={carta} />
}