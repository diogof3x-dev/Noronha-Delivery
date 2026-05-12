# Noronha Delivery — Passo a Passo da Construção

**Documento vivo · iniciado em 2026-05-12**

Princípios:
- **Cartas e aceites institucionais ficam pro final.** Não bloqueiam desenvolvimento.
- **UX da seção de comida espelha o iFood** (familiaridade reduz curva de aprendizado).
- **Avaliação obrigatória em toda transação** (comida, passeio, transporte, hospedagem, aluguel, compra) → alimenta o ranking público.
- **Autonomia total:** execução contínua sem confirmação a cada passo.

---

## ETAPA 1 — Fundação Técnica (sem dependência institucional)

### Bloco A — Setup do Repositório (hoje)
1. Criar `~/Noronha-Delivery/web/` com Next.js 16 + TypeScript + Tailwind + App Router
2. Instalar shadcn/ui base + componentes (button, card, input, form, dialog, dropdown, sheet, toast, etc.)
3. Configurar paleta Noronha + tipografia + dark mode opcional
4. Configurar ESLint + Prettier + lint-staged
5. Criar pasta `supabase/migrations/` para versionar SQL
6. Git init, primeiro commit, push para `agf3xdev/Noronha-Delivery` no GitHub

### Bloco B — Landing Page Pública (próximos 3 dias)
1. Layout base (header + footer + theme provider)
2. Home: hero com slogan, módulos prometidos, prova social ("apoiado por X"), CTA download
3. `/turista` — promessa, módulos detalhados, prints/mockups
4. `/sou-comercio` — formulário pré-cadastro restaurante/mercado
5. `/sou-operador` — formulário passeio/aluguel
6. `/sou-motorista` — formulário Nortax/buggy
7. `/sou-pousada` — formulário hospedagem
8. `/blog` — estrutura MDX + 5 artigos seed
9. SEO: metadata, schema.org LocalBusiness, sitemap, OG tags
10. Captação WhatsApp + email para fila de lançamento

### Bloco C — Supabase (paralelo a B)
1. Criar project Supabase região São Paulo
2. Schema inicial (ver `SCHEMA.md`):
   - `leads` (segmentado por tipo)
   - `profiles` (extensão de auth.users)
   - `businesses` (restaurante, operador, pousada, locadora)
   - `services` (item polimórfico: prato, passeio, veículo, quarto)
   - `orders` (transação polimórfica)
   - `ratings` (universal: rating em qualquer entidade)
   - `wallet_balances` + `wallet_transactions`
   - `withdrawal_requests`
3. RLS por papel (anon, authenticated, business_owner, admin)
4. Edge Functions: enviar email lead, calcular score agregado
5. Storage buckets: `business-logos`, `business-banners`, `service-photos`, `kyc-docs`, `rating-photos`
6. Integração com Resend (templates: lead recebido, KYC aprovado, pedido confirmado, lembrete de avaliação)

### Bloco D — Deploy (ao final do Bloco B)
1. Conectar repo na Vercel
2. Env vars: Supabase URL+anon+service_role, Resend API key
3. Preview deploy a cada PR
4. Domínio definitivo quando reservado (noronhadelivery.com.br)
5. Analytics: PostHog + Vercel Analytics

---

## ETAPA 2 — MVP App (após Etapa 1 estabilizada)

### Bloco E — Auth e Onboarding
1. Supabase Auth: email+senha, Google, Apple, magic link
2. Onboarding: turista vs morador → adapta home
3. Cadastro de endereço (por nome de pousada / pin no mapa, evita CEP)
4. Multi-perfil (1 usuário pode ser turista + lojista)

### Bloco F — Módulo Comida (UX iFood-like)
1. Home dos restaurantes: barra de busca + categorias horizontais + lista vertical de cards
2. Tela do restaurante: banner + abas de cardápio + cards de produto
3. Customização de item (acompanhamentos, observação)
4. Carrinho + endereço + cupom + pagamento
5. Checkout: PIX (QR) + cartão (ASAAS) + dinheiro na entrega
6. Status do pedido (stepper visual: recebido → preparando → saiu → entregue) com Realtime
7. **Avaliação obrigatória** ao final do pedido (5 estrelas + tags pré-definidas + comentário + foto opcional)
8. Pop-up de avaliação reabre se pulado (próxima abertura)
9. Histórico de pedidos
10. Modo "retirar no balcão"

### Bloco G — Módulo Transporte
1. Solicitar corrida (origem + destino + tipo)
2. Match com motoristas online (push notification)
3. Mapa em tempo real (Mapbox)
4. Pagamento embarcado
5. **Avaliação obrigatória** do motorista (5 estrelas + tags + comentário)
6. Avaliação reversa: motorista avalia passageiro
7. Driver app: online/offline, aceitar, navegar, ganhar

### Bloco H — Hub Info
1. Clima/vento/onda agora + previsão 7 dias (Open-Meteo)
2. Cards por praia (Sancho, Cacimba, Sueste, Atalaia, Boldró, Conceição, Leão, Porto)
3. Recomendação "Que praia agora?" (regra de vento + onda)
4. Maré + UV + temperatura
5. Mapa interativo da ilha

### Bloco I — Painéis (web responsivo)
1. **Painel Lojista**: catálogo, pedidos em tempo real, dashboard, saque, avaliações recebidas + resposta pública
2. **Painel Motorista** (mobile-first PWA): online/offline, corrida ativa, histórico
3. **Painel Admin**: KYC, moderação, financeiro, métricas, gerência de conteúdo
4. **Painel Operador / Pousada / Locadora** (Etapas 3-4)

### Bloco J — Capacitor → App Stores
1. Wrapper Capacitor com a mesma base Next.js
2. Plugins: Geolocation, Push, Camera, Network Status, Storage
3. Build Android (Play Store) + iOS (App Store)
4. CI/CD: GitHub Actions → Capgo para OTA

---

## ETAPA 3 — Verticais Adicionais

### Bloco K — Passeios e Trilhas
1. Catálogo + calendário de vagas
2. Reserva + pagamento de sinal
3. Selo "Verificado pelo Noronha Delivery" (cruza com lista ICMBio)
4. Pacotes combinados
5. **Avaliação obrigatória** pós-passeio

### Bloco L — Aluguel
1. Buggy / moto / bike elétrica / carro elétrico / equipamentos
2. Check-in/check-out com fotos
3. Caução + termo digital
4. **Avaliação obrigatória** pós-devolução

### Bloco M — Hospedagem
1. Pousadas + hotéis
2. Calendário + reserva com sinal (30% no app)
3. Check-in digital com QR
4. **Avaliação obrigatória** pós-checkout

### Bloco N — Mercado e Farmácia
1. Cesta + entrega
2. Compras antecipadas (turista pede antes de embarcar)
3. **Avaliação obrigatória** pós-entrega

---

## ETAPA 4 — Diferenciais e Escala

### Bloco O — Carteira + Taxas + Pass
1. Calculadora TPA + ICMBio
2. Atalho de pagamento (deep link ou API se conseguir)
3. Cashback 1% (2% Pass holders)
4. Noronha Pass R$ 49,90/viagem

### Bloco P — Notícias + Comunidade
1. Hub de notícias com curadoria
2. Mural oficial da Administração
3. Alertas (balsa, voo, fechamento de praia)
4. Achados e perdidos
5. Classificados moradores

### Bloco Q — Internacional + B2B
1. i18n EN + ES
2. API B2B para agências
3. Programa de afiliados
4. Push pós-compra de passagem (parceria Azul/Gol)

---

## ETAPA 5 — Institucional (NO FINAL)

1. Carta de apoio formal da Administração
2. Aprovação ICMBio para selo "Verificado"
3. Acordo com Nortax (taxistas)
4. CNPJ Noronha / parceria com morador-sócio
5. Termos e políticas LGPD revisados juridicamente
6. Cerimônia de lançamento na Vila dos Remédios

> **Decisão:** seguir construindo o produto em paralelo. Quando o app estiver demonstrável, a aproximação institucional fica natural — "olha o que já existe, queremos seu apoio para escalar".

---

## Cronograma de Marcos (estimativa)

| Semana | Marco |
|---|---|
| 1 | Etapa 1 Blocos A + C (setup) |
| 2–3 | Bloco B (landing no ar) |
| 4 | Bloco D (deploy + analytics) |
| 5–6 | Bloco E + F (auth + comida) |
| 7–8 | Bloco G + H (transporte + info) |
| 9–10 | Bloco I (painéis) |
| 11–12 | Bloco J (Capacitor + stores) |
| 13–16 | Blocos K–N (passeios, aluguel, hospedagem, mercado) |
| 17–20 | Blocos O–P (carteira, notícias) |
| 21+ | Etapa 5 institucional + escala |
