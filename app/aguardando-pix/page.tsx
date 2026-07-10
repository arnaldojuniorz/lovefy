'use client'

import { useEffect, useState, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'

const MAX_TENTATIVAS     = 75 // 75 x 4s ≈ 5 minutos aguardando confirmação do PIX
const MAX_TENTATIVAS_PDF = 20 // 20 x 4s ≈ 80 segundos extras esperando o PDF após carta ativa

type StatusPagamento = 'pending' | 'approved' | 'rejected' | 'timeout' | 'invalido'

// Contrato do retorno de /api/pix/status.
// TODO: ao revisar api/pix/status/route.ts, mover para um arquivo de tipos
// compartilhado (ex: lib/types.ts) para eliminar duplicação entre front e back.
interface PixStatusResponse {
  carta_status?: 'ativo' | 'pendente' | string
  status?: 'pending' | 'approved' | 'rejected' | 'cancelled' | string
  slug?: string
  pdf_url?: string
}

function BarraProgresso({
  atual,
  maximo,
  corDe,
  corPara,
  capPercent = 100,
  ariaLabel,
}: {
  atual: number
  maximo: number
  corDe: string
  corPara: string
  capPercent?: number
  ariaLabel: string
}) {
  const progresso = Math.min((atual / maximo) * 100, capPercent)
  return (
    <div
      role="progressbar"
      aria-valuenow={progresso}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
      style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '99px', overflow: 'hidden' }}
    >
      <div
        style={{
          height: '100%',
          width: `${progresso}%`,
          background: `linear-gradient(90deg, ${corDe}, ${corPara})`,
          transition: 'width 0.4s ease',
        }}
      />
    </div>
  )
}

function AguardandoPixContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()

  const payment_id = searchParams.get('payment_id') ?? ''
  const carta_id   = searchParams.get('carta_id')   ?? ''
  const plano      = searchParams.get('plano')       ?? 'forever'
  const qr         = searchParams.get('qr')          ?? ''
  const qr64       = searchParams.get('qr64')        ?? ''

  // Normaliza `tipo` para um union type restrito. Qualquer valor fora de
  // 'impressao' vira 'digital' — mesmo comportamento implícito do código
  // original, agora explícito e com segurança de tipos.
  const tipoParam = searchParams.get('tipo') ?? 'digital'
  const tipo: 'digital' | 'impressao' = tipoParam === 'impressao' ? 'impressao' : 'digital'

  const [copiado, setCopiado]             = useState(false)
  const [status, setStatus]               = useState<StatusPagamento>('pending')
  const [tentativas, setTentativas]       = useState(0)
  const [cartaAtiva, setCartaAtiva]       = useState(false)
  const [tentativasPdf, setTentativasPdf] = useState(0)

  // Refs para ler o valor mais atual dentro do closure do setInterval sem
  // precisar recriar o efeito (evita reset do timer a cada mudança de estado)
  // e para evitar redirecionamento duplicado em caso de respostas concorrentes.
  const cartaAtivaRef    = useRef(false)
  const hasRedirectedRef = useRef(false)

  useEffect(() => {
    if (!payment_id || !carta_id) {
      // Link incompleto (parâmetros ausentes na URL). Antes disso o usuário
      // ficava preso indefinidamente na tela de "aguardando", sem mensagem
      // nem saída possível.
      setStatus('invalido')
      return
    }

    let isFetching = false
    let abortController: AbortController | null = null

    function contarTentativaFalha() {
      // Trata falhas de rede/API (res não-ok ou exceção) com o mesmo
      // orçamento de tentativas da fase em que o usuário está. Antes, uma
      // falha aqui não incrementava nenhum contador e o polling continuava
      // para sempre, sem nunca acionar o timeout.
      if (cartaAtivaRef.current) {
        setTentativasPdf(t => {
          const nova = t + 1
          if (nova >= MAX_TENTATIVAS_PDF && !hasRedirectedRef.current) {
            hasRedirectedRef.current = true
            clearInterval(interval)
            setStatus('approved')
            router.push(`/obrigado?carta_id=${encodeURIComponent(carta_id)}&tipo=impressao&plano=${encodeURIComponent(plano)}`)
          }
          return nova
        })
      } else {
        setTentativas(t => {
          const nova = t + 1
          if (nova >= MAX_TENTATIVAS) {
            clearInterval(interval)
            setStatus('timeout')
          }
          return nova
        })
      }
    }

    const interval = setInterval(async () => {
      // Evita sobreposição de requisições: se a tentativa anterior ainda não
      // respondeu, pula este tick em vez de empilhar fetches concorrentes
      // (o que poderia causar respostas fora de ordem e navegação duplicada).
      if (isFetching) return
      isFetching = true
      abortController = new AbortController()

      try {
        const res = await fetch(
          `/api/pix/status?payment_id=${encodeURIComponent(payment_id)}&carta_id=${encodeURIComponent(carta_id)}&tipo=${encodeURIComponent(tipo)}`,
          { signal: abortController.signal }
        )

        if (!res.ok) {
          contarTentativaFalha()
          return
        }

        const data: PixStatusResponse = await res.json()

        if (data.carta_status === 'ativo') {
          // Carta digital — redireciona imediatamente
          if (tipo !== 'impressao') {
            clearInterval(interval)
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true
              setStatus('approved')
              router.push(`/obrigado?carta_id=${encodeURIComponent(carta_id)}&tipo=${encodeURIComponent(tipo)}&slug=${encodeURIComponent(data.slug ?? '')}&plano=${encodeURIComponent(plano)}`)
            }
            return
          }

          // Carta impressão com PDF pronto — redireciona com link
          if (tipo === 'impressao' && data.pdf_url) {
            clearInterval(interval)
            if (!hasRedirectedRef.current) {
              hasRedirectedRef.current = true
              setStatus('approved')
              router.push(`/obrigado?carta_id=${encodeURIComponent(carta_id)}&tipo=impressao&pdf_url=${encodeURIComponent(data.pdf_url)}`)
            }
            return
          }

          // Carta impressão sem PDF ainda — aguarda mais tentativas
          if (tipo === 'impressao' && !data.pdf_url) {
            cartaAtivaRef.current = true
            setCartaAtiva(true)
            setTentativasPdf(t => {
              const nova = t + 1
              if (nova >= MAX_TENTATIVAS_PDF) {
                // PDF demorou muito — redireciona sem ele, usuário receberá por email
                clearInterval(interval)
                if (!hasRedirectedRef.current) {
                  hasRedirectedRef.current = true
                  setStatus('approved')
                  router.push(`/obrigado?carta_id=${encodeURIComponent(carta_id)}&tipo=impressao&plano=${encodeURIComponent(plano)}`)
                }
              }
              return nova
            })
            return
          }
        }

        if (data.status === 'rejected' || data.status === 'cancelled') {
          clearInterval(interval)
          setStatus('rejected')
          return
        }

        if (!cartaAtivaRef.current) {
          setTentativas(t => {
            const nova = t + 1
            if (nova >= MAX_TENTATIVAS) {
              clearInterval(interval)
              setStatus('timeout')
            }
            return nova
          })
        }

      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        console.error('[aguardando-pix] erro ao verificar status:', err)
        contarTentativaFalha()
      } finally {
        isFetching = false
      }
    }, 4000)

    return () => {
      clearInterval(interval)
      abortController?.abort()
    }
  }, [payment_id, carta_id, tipo, plano, router])

  function copiar() {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(qr).then(() => {
        setCopiado(true)
        setTimeout(() => setCopiado(false), 2500)
      }).catch(() => copiarFallback())
    } else {
      copiarFallback()
    }
  }

  function copiarFallback() {
    const el = document.createElement('textarea')
    el.value = qr
    el.style.position = 'fixed'
    el.style.opacity  = '0'
    document.body.appendChild(el)
    el.focus()
    el.select()

    const sucesso = document.execCommand('copy')
    document.body.removeChild(el)

    // Só sinaliza sucesso se o navegador confirmar que o comando funcionou —
    // antes disso, o usuário via "Copiado!" mesmo quando o comando falhava.
    if (sucesso) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', padding: '40px 16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>

        <h1 style={{ color: '#fff', fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
          Pague com PIX
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', marginBottom: '32px' }}>
          Escaneie o QR Code ou copie o código abaixo
        </p>

        {qr64 && (
          <div style={{ marginBottom: '24px' }}>
            <Image
              src={`data:image/png;base64,${qr64}`}
              alt="QR Code PIX"
              width={220}
              height={220}
              style={{ borderRadius: '16px', border: '3px solid rgba(255,107,157,0.3)', display: 'block', margin: '0 auto' }}
              unoptimized
            />
          </div>
        )}

        <div style={{ background: '#16213e', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.08)', marginBottom: '12px', wordBreak: 'break-all', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace', textAlign: 'left' }}>
          {qr}
        </div>

        <button
          onClick={copiar}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff6b9d, #c44569)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '15px', marginBottom: '24px' }}
        >
          {copiado ? '✅ Copiado!' : '📋 Copiar código PIX'}
        </button>

        {status === 'pending' && !cartaAtiva && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px' }}>
              ⏳ Aguardando confirmação do pagamento...
            </p>
            <BarraProgresso
              atual={tentativas}
              maximo={MAX_TENTATIVAS}
              corDe="#ff6b9d"
              corPara="#c44569"
              ariaLabel="Tempo restante para pagamento"
            />
          </div>
        )}

        {status === 'pending' && cartaAtiva && tipo === 'impressao' && (
          <div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '8px' }}>
              ✅ Pagamento confirmado! Gerando seu PDF...
            </p>
            <BarraProgresso
              atual={tentativasPdf}
              maximo={MAX_TENTATIVAS_PDF}
              corDe="#1DB954"
              corPara="#17a84a"
              capPercent={95}
              ariaLabel="Progresso da geração do PDF"
            />
          </div>
        )}

        {status === 'rejected' && (
          <div>
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>
              ❌ Pagamento recusado ou cancelado.
            </p>
            <a href="/criar" style={{ color: '#ff6b9d', fontSize: '14px' }}>← Tentar novamente</a>
          </div>
        )}

        {status === 'timeout' && (
          <div>
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>
              ⏱️ Tempo esgotado. Se você já pagou, aguarde alguns minutos e verifique seu e-mail.
            </p>
            <a href="/criar" style={{ color: '#ff6b9d', fontSize: '14px' }}>← Tentar novamente</a>
          </div>
        )}

        {status === 'invalido' && (
          <div>
            <p style={{ color: '#ff6b6b', fontSize: '14px', marginBottom: '12px' }}>
              ⚠️ Link de pagamento inválido ou incompleto.
            </p>
            <a href="/criar" style={{ color: '#ff6b9d', fontSize: '14px' }}>← Voltar e tentar novamente</a>
          </div>
        )}

        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '24px' }}>
          Após o pagamento, você será redirecionado automaticamente.
        </p>
      </div>
    </main>
  )
}

export default function AguardandoPixPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: '100vh', background: '#1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Carregando...</div>
      </main>
    }>
      <AguardandoPixContent />
    </Suspense>
  )
}