# Lovefy

Plataforma de cartas digitais e PDF personalizadas para ocasiões especiais.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Banco de dados:** Supabase (PostgreSQL + Storage)
- **Pagamentos:** Mercado Pago (PIX + Cartão)
- **E-mail:** Resend
- **Deploy:** Vercel
- **Rate limiting:** Upstash Redis
- **Mapas estelares:** Astronomy API

## Produtos

| Produto | Preço | Entrega |
|---|---|---|
| Carta Digital (Para Sempre) | R$ 9,90 | Link exclusivo após pagamento |
| Carta para Impressão (PDF) | R$ 6,90 | PDF por e-mail após pagamento |

## Configuração local

### 1. Instalar dependências

```bash
npm install
```

### 2. Variáveis de ambiente

Crie `.env.local` na raiz com:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
NEXT_PUBLIC_MP_PUBLIC_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=Lovefy <contato@lovefy.app.br>

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Astronomy API
ASTRONOMY_API_ID=
ASTRONOMY_API_SECRET=

# Cron
CRON_SECRET=

# Google Analytics (opcional)
NEXT_PUBLIC_GA_ID=
```

### 3. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

### 4. Webhook local (Mercado Pago)

Para testar pagamentos localmente, exponha o servidor via ngrok:

```bash
ngrok http 3000
```

Configure a URL `https://SEU-NGROK.ngrok.io/api/webhook` no painel do Mercado Pago.

> ⚠️ Nunca use URL do ngrok em produção. Em produção o webhook deve apontar para `https://www.lovefy.app.br/api/webhook`.

## Estrutura principal
app/
├── api/              # API Routes (pagamento, upload, webhook, etc.)
├── c/[slug]/         # Página pública da carta digital
├── criar/            # Formulário multi-etapa (carta digital)
├── imprimir/         # Formulário (carta PDF)
├── checkout/         # Página de pagamento (Mercado Pago Brick)
├── aguardando-pix/   # Polling de status PIX
└── obrigado/         # Confirmação pós-pagamento
components/
├── carta/            # CartaViewer, CartaPaginas, CartaTypes
└── etapas/           # Etapa1–5, GaleriaUpload
lib/
├── carta-context.tsx # Estado global do formulário
├── supabase.ts       # Clientes Supabase (público e admin)
├── planos.ts         # Fonte de verdade de preços
├── enviar-email.ts   # Envio via Resend
├── gerar-pdf.ts      # Geração de PDF com jsPDF
├── gerar-qrcode.ts   # Geração de QR Code
└── mover-fotos.ts    # Move fotos de temp para definitivo
## Deploy

O deploy é automático via Vercel ao fazer push para `develop`.

Variáveis de ambiente de produção devem ser configuradas no painel da Vercel em **Settings → Environment Variables**.

O cron job de limpeza de fotos órfãs roda diariamente (`0 0 * * *` UTC).