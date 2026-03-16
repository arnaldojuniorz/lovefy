import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CartaViewer from '@/components/carta/CartaViewer'

type Props = {
  params: Promise<{ slug: string }>
}

export default async function CartaPage({ params }: Props) {
  const { slug } = await params

  const { data: carta, error } = await supabaseAdmin
    .from('cartas')
    .select('*, fotos(*)')
    .eq('slug', slug)
    .eq('status', 'ativo')
    .single()

  if (error || !carta) {
    notFound()
  }

  return <CartaViewer carta={carta} />
}