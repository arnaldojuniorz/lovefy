import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>💌</div>
        <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Página não encontrada</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
          Essa carta pode ter expirado ou o link está incorreto.
        </p>
        <Link href="/"
          style={{ display: 'inline-block', padding: '14px 32px', borderRadius: 100, background: 'linear-gradient(135deg,#ff6b9d,#c44569)', color: '#fff', fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
          Criar minha carta
        </Link>
      </div>
    </main>
  )
}