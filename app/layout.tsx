import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { CartaProvider } from '@/lib/carta-context'
import Script from 'next/script'

const inter = Inter({
  subsets:  ['latin'],
  display:  'swap',
})

export const metadata: Metadata = {
  title:       'Lovefy — Cartas Digitais Personalizadas',
  description: 'Transforme suas mensagens de afeto em experiências digitais interativas. Crie cartas digitais personalizadas com música, fotos e muito amor.',
  keywords:    'carta digital, carta de amor, presente romântico, lovefy',
  openGraph: {
    title:       'Lovefy — Cartas Digitais Personalizadas',
    description: 'Crie uma carta digital única para quem você ama.',
    url:         'https://www.lovefy.app.br',
    siteName:    'Lovefy',
    locale:      'pt_BR',
    type:        'website',
  },
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
      </head>

      <body className={`${inter.className} antialiased`}>
        <CartaProvider>
          {children}
        </CartaProvider>
      </body>
    </html>
  )
}