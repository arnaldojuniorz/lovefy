import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import CartaViewer from '@/components/carta/CartaViewer'

type Params = { slug: string }
type Props = {
  params: Params | Promise<Params>
}

const SLUG_REGEX = /^[a-z0-9-]{3,60}$/i

const CAMPOS_PUBLICOS = [
  'id',
  'slug',
  'status',
  'nome_destinatario',
  'nome_remetente',
  'data_importante',
  'mensagem_principal',
  'estilo_fundo',
  'estilo_animacao',
  'recursos',
  'musica_link',
  'foto_destaque',
  'jogo_palavra1',
  'jogo_palavra2',
  'jogo_palavra3',
  'qr_code_url',
  'created_at',
] as const

type FotoPublica = {
  id: string | undefined
  url: string
  ordem: number | null
  created_at: string | null
}

function sanitizeFotos(value: unknown): FotoPublica[] {
  if (!Array.isArray(value)) return []

  const mapped: Array<FotoPublica | null> = value.map((item): FotoPublica | null => {
    if (!item || typeof item !== 'object') return null

    const foto = item as Record<string, unknown>
    const url = typeof foto.url === 'string' ? foto.url.trim() : ''
    if (!url) return null

    return {
      id: typeof foto.id === 'string' ? foto.id : undefined,
      url,
      ordem: typeof foto.ordem === 'number' ? foto.ordem : null,
      created_at: typeof foto.created_at === 'string' ? foto.created_at : null,
    }
  })

  const fotos: FotoPublica[] = mapped.filter((f): f is FotoPublica => f !== null)

  fotos.sort((a, b) => {
    const ao = a.ordem ?? 9999
    const bo = b.ordem ?? 9999
    if (ao !== bo) return ao - bo

    const ad = a.created_at ?? ''
    const bd = b.created_at ?? ''
    return ad.localeCompare(bd)
  })

  return fotos
}

function sanitizeCarta(carta: Record<string, unknown>) {
  const out: Record<string, unknown> = {}

  for (const key of CAMPOS_PUBLICOS) {
    if (Object.prototype.hasOwnProperty.call(carta, key)) {
      out[key] = carta[key]
    }
  }

  out.recursos = Array.isArray(carta.recursos) ? carta.recursos : []
  out.fotos = sanitizeFotos(carta.fotos)

  return out
}

export default async function CartaPage({ params }: Props) {
  noStore()

  const resolved = await Promise.resolve(params)
  const slug = decodeURIComponent((resolved.slug ?? '').trim()).toLowerCase()

  if (!SLUG_REGEX.test(slug)) {
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

  const cartaPublica = sanitizeCarta(carta as Record<string, unknown>)
  return <CartaViewer carta={cartaPublica as any} />
}