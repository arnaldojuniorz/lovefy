import { NextRequest } from 'next/server'

/**
 * Extrai o IP real do cliente, priorizando o header do Cloudflare
 * (cf-connecting-ip), que é definido pelo próprio Cloudflare e não pode ser
 * falsificado pelo cliente — o Lovefy usa Cloudflare como proxy/CDN na
 * frente de toda a aplicação. x-forwarded-for e x-real-ip continuam como
 * fallback para cenários em que a requisição não passa pelo Cloudflare.
 *
 * Usado por qualquer rota que precise identificar o cliente para rate
 * limiting (ex: api/cartao, api/cartas/slug).
 */
export function getClientIp(request: NextRequest): string {
  const cfIp = request.headers.get('cf-connecting-ip')
  if (cfIp) return cfIp.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}