import { CartaProvider } from '@/lib/carta-context'

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartaProvider>
      {children}
    </CartaProvider>
  )
}
