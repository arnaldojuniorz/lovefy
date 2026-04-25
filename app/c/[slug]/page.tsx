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
    .ilike('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error || !carta) {
    notFound()
  }

  const cartaSafe = { ...(carta as Record<string, unknown>) }
  delete (cartaSafe as any).email_pagador
  delete (cartaSafe as any).mercadopago_payment_id
  delete (cartaSafe as any).mercadopago_preference_id

  return <CartaViewer carta={cartaSafe as any} />
}