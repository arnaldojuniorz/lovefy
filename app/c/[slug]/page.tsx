import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import CartaViewer from '@/components/carta/CartaViewer'
import type { Carta } from '@/components/carta/CartaTypes'

export const dynamic    = 'force-dynamic'
export const revalidate = 0

type Params = { slug: string }
type Props  = { params: Params | Promise<Params> }

const SLUG_REGEX = /^[a-z0-9-]{3,80}$/

export default async function CartaPage({ params }: Props) {
  const resolvedParams = await Promise.resolve(params)
  const slug = decodeURIComponent((resolvedParams.slug ?? '').trim().toLowerCase())

  if (!slug || !SLUG_REGEX.test(slug)) notFound()

  const { data, error } = await supabaseAdmin
    .from('cartas')
    .select(`
      id,
      slug,
      nome_destinatario,
      nome_remetente,
      como_se_conheceram,
      memoria_especial,
      momento_marcante,
      localizacao,
      data_importante,
      mensagem_principal,
      estilo_fundo,
      estilo_animacao,
      recursos,
      musica_link,
      foto_destaque,
      qr_code_url,
      mapa_estrelas_url,
      jogo_palavra1,
      jogo_palavra2,
      jogo_palavra3,
      fotos (
        id,
        storage_path,
        ordem,
        is_temp
      )
    `)
    .eq('slug', slug)
    .eq('status', 'ativo')
    .maybeSingle()

  if (error) {
    console.error('[c/slug] erro ao buscar carta:', error)
    notFound()
  }

  if (!data) notFound()

  return <CartaViewer carta={data as unknown as Carta} />
}