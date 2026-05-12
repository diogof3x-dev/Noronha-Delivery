# Noronha Delivery

> _Aqui você tem Tudo._

Super app de Fernando de Noronha — delivery, transporte, passeios, hospedagem, aluguel, ingressos, clima do mar e mais. Solicitado pela Administração distrital em 2026-05-12.

## Estrutura do repositório

```
.
├── docs/
│   ├── PROPOSTA.md          # Proposta completa de produto e negócio
│   ├── BUILD-PLAN.md        # Passo a passo de construção em 5 etapas
│   ├── UX-DECISIONS.md      # Padrões iFood-like + avaliação universal
│   └── DEMANDAS-ADMIN.md    # 24 categorias oficiais do administrador
│
├── web/                     # Next.js 16 + Tailwind 4 + shadcn/ui
│   ├── src/app/             # Landing pública + páginas de pré-cadastro
│   ├── src/components/      # UI + componentes de landing
│   └── src/lib/             # categorias, leads, supabase
│
└── supabase/
    └── migrations/          # Schema versionado
        ├── 0001_init_extensions.sql
        ├── 0002_leads.sql
        ├── 0003_profiles.sql
        ├── 0004_businesses.sql
        ├── 0005_services.sql
        ├── 0006_orders.sql
        ├── 0007_ratings.sql        # avaliação universal (média bayesiana)
        ├── 0008_wallet.sql
        ├── 0009_categories_seed.sql
        └── 0010_storage.sql
```

## Stack

- **Web** Next.js 16 + React 19 + Tailwind 4 + shadcn/ui (base-ui)
- **Mobile** Capacitor (planejado, reaproveita o web)
- **Backend** Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Pagamentos** ASAAS (PIX + cartão + split + saque)
- **Email** Resend
- **Mapas** Mapbox (com cache offline)
- **Clima** Open-Meteo + INMET (fontes públicas, sem custo)
- **Hosting** Vercel

## Rodar local

```bash
cd web
cp .env.example .env.local   # preencher SUPABASE_URL/KEYS e RESEND_API_KEY
pnpm install
pnpm dev
```

Sem credenciais Supabase, os formulários funcionam em modo dev (lead apenas logado no console).

## Aplicar migrations no Supabase

As migrations em `supabase/migrations/` são SQL puro e devem ser aplicadas em ordem. Em projeto novo basta rodar `psql < arquivo.sql` ou colar no SQL editor do Supabase Studio.

## Princípios

1. **Cartas e aceites institucionais ficam para o final.** Não bloqueiam desenvolvimento.
2. **UX de comida espelha o iFood** (familiaridade reduz curva de aprendizado).
3. **Avaliação obrigatória em toda transação** — alimenta o ranking público.
4. **Frota 100% elétrica** (alinhado à lei estadual de proibição de combustão em 2029).
5. **PIX é meio primário** (resiliente a queda de conectividade).
6. **Offline-first** com fallback WhatsApp.
