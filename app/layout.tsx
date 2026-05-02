import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CartaProvider } from "@/lib/carta-context";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lovefy — Cartas Digitais Personalizadas",
  description: "Transforme suas mensagens de afeto em experiências digitais interativas. Crie cartas digitais personalizadas com música, fotos e muito amor.",
  keywords: "carta digital, carta de amor, presente romântico, lovefy",
  openGraph: {
    title: "Lovefy — Cartas Digitais Personalizadas",
    description: "Crie uma carta digital única para quem você ama.",
    url: "https://www.lovefy.app.br",
    siteName: "Lovefy",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        {/* ✅ MP Script removido — sdk-react inicializa sozinho via initMercadoPago() */}

        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RP7YS3Z6FW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RP7YS3Z6FW');
          `}
        </Script>
      </head>

      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <CartaProvider>
          {children}
        </CartaProvider>
      </body>
    </html>
  );
}