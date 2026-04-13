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
        {/* ✅ MercadoPago.JS V2 — Device ID obrigatório */}
        <Script
          src="https://sdk.mercadopago.com/js/v2"
          strategy="afterInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <CartaProvider>
          {children}
        </CartaProvider>
      </body>
    </html>
  );
}