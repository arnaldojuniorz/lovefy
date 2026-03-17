import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-[#1a1a2e] flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">Lovefy</h1>
        <p className="text-white/50 text-lg mb-8">Transformando palavras em momentos inesqueciveis</p>
        <Link href="/criar" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold py-4 px-8 rounded-xl">
          Criar minha carta
        </Link>
      </div>
    </main>
  )
}
