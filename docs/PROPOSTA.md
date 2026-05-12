# Noronha Delivery — Proposta Completa de Super App

**Versão 1.0 · 2026-05-12**
**Solicitado por:** Administração de Fernando de Noronha
**Posicionamento:** Ponto único de contato digital com a ilha — porta de entrada via delivery, oferta interna de ecossistema completo.
**Slogan oficial:** _"Noronha Delivery — aqui você tem Tudo."_

---

## 1. Resumo Executivo

Fernando de Noronha tem **3.341 moradores** (IBGE 2025) e recebeu **139.901 turistas em 2025** (recorde, ~5% acima do teto anual de 132 mil). Apesar disso, **não existe Uber/99, iFood não opera oficialmente, reservas de passeios acontecem via WhatsApp/Instagram com PIX pra CPF de pessoa física**, e a informação sobre clima/taxas/trilhas está espalhada em 6+ sites diferentes.

A oportunidade é construir o **super-app local** que unifica:
- Delivery de comida e mercado
- Transporte sob demanda (vácuo do Uber)
- Reserva de passeios, mergulho e trilhas
- Aluguel de buggy/moto/bike elétrica
- Hospedagem
- Hub de clima, mar, vento e ondas
- Notícias e avisos da Administração
- Pagamento centralizado de TPA + ICMBio

**Estratégia de marca:** "Noronha Delivery" como gancho de download (delivery é a dor mais frequente e cotidiana), mas a casa interna é um ecossistema completo. O slogan **"aqui você tem Tudo"** comunica em 4 palavras a promessa multi-vertical sem perder o gancho do nome — o turista baixa pensando em comida e descobre que resolve transporte, passeio, hospedagem, taxas e clima no mesmo lugar. Quanto mais módulos o usuário usa, maior o LTV e mais defensível a posição.

**Aplicações do slogan:**
- Hero da landing: _"Noronha Delivery · Aqui você tem Tudo."_
- Splash screen do app
- Onboarding (3 telas: "comida", "transporte", "passeios" → "tudo isso e mais")
- Material físico nas pousadas (cartão "Baixe e tenha tudo na palma da mão")
- Ads pagos (Meta/Google): título "Aqui você tem Tudo. Em Noronha."

---

## 2. Contexto da Ilha (síntese da pesquisa)

| Indicador | Valor | Fonte |
|---|---|---|
| População fixa | 3.341 (IBGE 2025) | IBGE |
| Turistas 2025 | 139.901 | CBN Recife / Parna Noronha |
| TPA 2026 | R$ 105,79/dia | Decreto Distrital |
| Ingresso ICMBio 2026 | R$ 192 BR / R$ 384 estrangeiro | Parna Noronha |
| Operadoras 5G | Apenas TIM (abr/2024) | TIM |
| Operadora com sinal mais estável | Claro 4G | essemundoenosso |
| Apps de transporte | Nenhum (sem Uber/99/InDrive) | Noronhei |
| Único táxi consolidado | Nortax (81) 3619-1314 | Nortax |
| iFood | Não opera oficialmente | observação de campo |
| Veículos a combustão | Proibidos a partir de 10/08/2029 | Lei estadual |
| PIX | Dominante (com cartão como secundário) | essemundoenosso |

**Implicações arquiteturais:**
- **Offline-first obrigatório:** cache agressivo, fila de sync, WhatsApp como fallback de notificação.
- **PIX como meio primário:** custo baixo, aceitação universal, resiliente a queda de rede.
- **Geofencing por bairro** (Vila dos Remédios, Floresta, Boldró, Vila do Trinta, Vila do Sueste, Porto): endereçamento da ilha é informal, precisa lookup por pousada/marco.

---

## 3. Análise Competitiva

| Player | Foco | Força | Gap explorável |
|---|---|---|---|
| **Noronhei** | Reserva de passeios | Marca, catálogo, UX | Só passeios; sem delivery/transporte/clima |
| **Noronha Delivery (Instagram)** | Pizzaria desde 2015 | Marca histórica | Marca já existe — **rebatizar a proposta como "Noronha App / Noronha Tudo"** OU absorver via parceria/aquisição |
| **deliverynoronha.com.br** | Agregador | Domínio relacionado | Baixa atividade — possível aquisição de domínio |
| **Booking / Airbnb** | Hospedagem | Catálogo global | Não cobre delivery, transporte, taxas locais |
| **Civitatis / GetYourGuide** | Passeios em inglês | Audiência estrangeira | Take rate alto, sem operação local |
| **ICMBio / TPA oficial** | Pagamento de taxas | Oficial | UX ruim, separados, sem agregação |

**⚠ Risco de naming:** já existe pizzaria com a marca @noronhadelivery desde 2015. Três caminhos:
1. **Parceria/aquisição** do nome com o dono atual (incorporar pizzaria como primeiro restaurante âncora).
2. **Pivot do nome** — opções: "Noronha App", "Tudo Noronha", "Ilha App", "Noronha+", "AppNoronha".
3. **Coexistência:** posicionar o super-app como categoria diferente, mas há risco de confusão e disputa de marca.

> **Recomendação:** validar opção 1 antes de avançar. Se inviável, partir pra opção 2 ("Noronha App" é o mais claro e SEO-amigável).

---

## 4. Personas

### Turista pré-viagem
**Quem:** comprou passagem, está planejando. SP, RJ, MG são 50%+ do público.
**Dores:** entender taxas (TPA + ICMBio), reservar passeios com segurança, montar roteiro.
**Hooks no app:** simulador de taxas, agendamento antecipado de transfer + 1º passeio.

### Turista na ilha
**Quem:** chegou, fica em média 4–7 dias.
**Dores:** transporte (sem Uber), comida fora da pousada, saber o que fazer hoje com o tempo X.
**Hooks:** "Que praia agora?" (recomendação por vento/onda), 1-tap pra chamar buggy/táxi, delivery.

### Morador consumidor
**Quem:** 3.341 pessoas. Custo de vida alto, poucas opções.
**Dores:** comida pronta cara via WhatsApp, sem transporte fora ônibus circular, comércio limitado.
**Hooks:** delivery agregado mais barato, classificados internos, carona.

### Lojista / restaurante
**Quem:** ~30–50 restaurantes + ~10–15 mercados.
**Dores:** pedidos fragmentados (WhatsApp, Instagram, telefone), sem dashboard, sem maquininha confiável.
**Hooks:** painel único, take rate menor que iFood (12–15%), saque PIX.

### Operador de passeios / mergulho / barco
**Quem:** ~20–40 operadores credenciados ICMBio.
**Dores:** reservas via DM, pagamento via PIX pra CPF, agendamento manual.
**Hooks:** calendário, pagamento split (cliente paga no app, operador recebe líquido).

### Pousada
**Quem:** 80–130 pousadas formalizadas.
**Dores:** comissão Booking 15%+, falta visibilidade pra brasileiros.
**Hooks:** take rate menor, integração com transfer e passeios.

### Motorista / locador de buggy
**Quem:** táxis (Nortax) + ~10 locadoras de buggy + motos.
**Dores:** sem app, espera telefonema, qualidade de locadora não rastreada.
**Hooks:** demanda canalizada, rating público, pagamento garantido.

### Admin distrital
**Quem:** Administração de Noronha.
**Dores:** sem visibilidade do que acontece informalmente, dificuldade de comunicar com turistas e moradores.
**Hooks:** dashboard de uso, canal oficial de avisos, dados anonimizados de fluxo.

---

## 5. Mapa de Módulos do App

### A. Delivery de Comida (core)
- Catálogo de restaurantes com horário e tempo de entrega
- Cardápio com fotos, observações, customização
- Carrinho + checkout PIX/cartão
- Rastreio em tempo real do pedido
- Modo "retirar no balcão"
- Avaliação pós-pedido
- Histórico

### B. Mercado e Comércio
- Mercados (Noronhão, Poty, Noronha Frios) com cesta
- Farmácia
- Compras antecipadas (turista pede antes de embarcar, recebe na pousada)

### C. Transporte (Noronha Mob)
- Corrida sob demanda (substituto do Uber)
- Integração com Nortax (taxistas oficiais)
- Transfer aeroporto ↔ pousada agendado
- Buggy compartilhado (rota fixa pras praias)
- Pagamento embarcado, gorjeta opcional

### D. Aluguel
- Buggy, moto, bike elétrica, carro elétrico
- Equipamentos: snorkel, GoPro, prancha, kit de mergulho
- Reserva por dia/semana, pagamento de caução, foto de check-in/check-out

### E. Passeios e Trilhas
- Catálogo de operadores credenciados ICMBio
- Ilha-tour, mergulho, barco, planasub, canoa havaiana, SUP
- Trilhas guiadas (Atalaia, Capim-Açu, Sancho)
- Selo "Verificado" para credenciados
- Calendário de vagas
- Lembrete de trilhas com agendamento ICMBio (deep link ou integração)
- Pacotes combinados (transfer + passeio + foto)

### F. Hospedagem
- Pousadas formalizadas + hotéis
- Disponibilidade em tempo real, reserva com sinal
- Política de cancelamento clara
- Check-in digital com QR code
- Upsell: transfer + 1º passeio + cesta de boas-vindas

### G. Hub de Informação
- **Clima/Mar agora:** temperatura, vento, ondas, maré, UV (Open-Meteo grátis + INMET oficial)
- **Previsão 7 dias** por praia
- **"Que praia visitar hoje?"** — recomendação por vento, onda, lotação
- **Status de trilhas:** vagas no ICMBio (manual com refresh diário se sem API)
- **Mapa interativo** com pontos, distância, tempo de buggy
- **Calendário de eventos** locais (festas, regatas, lua cheia, eclipses)

### H. Carteira Noronha
- Saldo (cashback acumulado por uso)
- TPA + ICMBio: calculadora + pagamento atalho (deep link oficial ou integração se LAI liberar API)
- Histórico de pedidos e pagamentos
- Noronha Pass (assinatura turista — opcional, fase 5)

### I. Notícias e Comunidade
- Hub de notícias da ilha (curadoria + parceria com blog do Ricardo Antunes, Diário PE)
- Avisos oficiais da Administração (selo)
- Alertas de balsa, voo, fechamento de praia
- Achados e perdidos
- Classificados moradores

### J. Painel Lojista (web)
- KYC e cadastro
- Catálogo (produtos, preços, imagens, disponibilidade)
- Pedidos em tempo real com som de alerta
- Estoque
- Dashboard de vendas (gráficos, ticket médio, top produtos)
- Solicitação de saque (ASAAS, mínimo R$ 50, D+1 ou D+7)
- Avaliações recebidas e resposta
- Boost/destaque (anúncio interno pago)

### K. Painel Operador (web + mobile)
- Agenda diária de passeios
- Confirmação de reserva
- Lista de passageiros do dia (com WhatsApp e observações)
- Cancelamento e remarcação
- Avaliações
- Saque

### L. Painel Motorista (mobile)
- Status online/offline
- Aceitar/recusar corrida
- Navegação até origem/destino (Mapbox)
- Ganhos diários
- Saque

### M. Painel Super Admin (web)
- Aprovação de KYC (lojista, operador, motorista)
- Moderação de catálogo e conteúdo
- Resolução de disputas
- Financeiro: conciliação ASAAS, take rate por categoria, repasses
- Métricas: pedidos, GMV, take, NPS, churn
- Banimento e suspensão
- Notificações push em massa
- Curadoria de notícias

---

## 6. Stack Técnica Recomendada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Frontend Web** (landing + painéis) | Next.js 16 + shadcn/ui + Tailwind | Já dominado (Livoo, leilaapp), App Router, deploy Vercel |
| **App Mobile** | Capacitor + React (mesmo codebase do web onde fizer sentido) | Reaproveita expertise do leilaapp, Android + iOS, fácil OTA com Capgo |
| **Backend** | Supabase (Postgres + Auth + Storage + Realtime + Edge Functions) | Já dominado, RLS resolve multi-tenant, autonomia v4.0 ([[feedback_supabase_autonomy]]) |
| **Pagamentos** | ASAAS (PIX + cartão + split + saque) | Já integrado em outros projetos |
| **WhatsApp/SMS fallback** | Z-API ou Evolution API + Twilio (SMS) | Conectividade ruim na ilha exige fallback |
| **Mapas** | Mapbox (offline pack disponível) | Cache offline crítico |
| **Push** | OneSignal + Capacitor Push | Notificação de pedido, corrida, lembrete |
| **Geofencing** | Capacitor Geolocation | Cobrança por zona, status de entregador |
| **Clima** | Open-Meteo (free) + INMET (oficial) | Custo zero, dado público |
| **Realtime de pedido** | Supabase Realtime (Postgres Changes) | Pedido → cozinha → entregador |
| **Email** | Resend | Já integrado |
| **Analytics** | PostHog (self-hostable) ou Mixpanel | Funil completo, sessão |
| **Search** | Postgres FTS inicialmente; Algolia se escalar | Catálogo cresce devagar |
| **CDN/imagens** | Vercel Image + Supabase Storage | Otimização automática |
| **Monitoramento** | Sentry + Vercel Analytics | Crash + Web Vitals |
| **Domínio** | noronhadelivery.com.br + noronhadelivery.app + tudonoronha.com.br (reserva) | Captura todas variantes |

---

## 7. Modelo de Negócio

### Take rate por categoria
| Categoria | Take rate | Comparação |
|---|---|---|
| Delivery comida | 12–15% | iFood 23–27% |
| Mercado | 8–10% | — |
| Transporte | 15–20% | Uber 25%, com split motorista 80% |
| Passeios | 8–10% | GetYourGuide 20–30% |
| Aluguel | 10% | — |
| Hospedagem | 8–12% | Booking 15%+ |

### Outras receitas
- **Boost/destaque** pago no app pros parceiros (modelo de leilão simplificado)
- **Anúncios internos** (marcas de surf, mergulho, hotéis sazonais)
- **Noronha Pass** (assinatura turista R$ 49,90/viagem — frete grátis, 1 transfer cortesia, descontos)
- **Parceria institucional** com Administração (taxa de processamento sobre TPA paga via app)
- **API B2B** para agências (long-tail)

### Saque
- ASAAS split automático no momento do pagamento
- Saldo libera D+1 (PIX) ou D+7 (cartão)
- Saque mínimo R$ 50
- Sem taxa de saque PIX (custo absorvido no take rate)

### Modelagem rápida (cenário base mês 6 pós-MVP)
- 25 restaurantes ativos · ticket médio R$ 80 · 12 pedidos/dia cada → R$ 720K GMV/mês · take 13% = **R$ 93.600**
- 10 motoristas/buggys ativos · 8 corridas/dia · R$ 35 média → R$ 84K GMV/mês · take 18% = **R$ 15.120**
- 15 operadores de passeio · 50 reservas/mês · R$ 250 média → R$ 187K GMV/mês · take 10% = **R$ 18.700**
- 20 unidades de hospedagem · 8 reservas/mês · R$ 1.500 média → R$ 240K GMV/mês · take 10% = **R$ 24.000**

**Receita total cenário base mês 6:** ~**R$ 151K/mês** sobre GMV ~R$ 1,23M/mês.
**Custo infra estimado:** R$ 2.500–4.000/mês (Vercel + Supabase Pro + Mapbox + Twilio + WhatsApp).

---

## 8. Plano de Fases

### **FASE 0 — Preparação Institucional (4 semanas)**

**Objetivo:** garantir legitimidade, viabilidade jurídica e dados de campo antes de codar.

- [ ] Carta formal de apoio da Administração Distrital (selo "App apoiado")
- [ ] Reunião com ICMBio sobre integração de trilhas (API ou export)
- [ ] LAI para Administração: cadastro de comércios formalizados, frota, regras de operação
- [ ] Definição jurídica: CNPJ em PE + filial em Noronha, ou parceria com morador-sócio
- [ ] **Validação da marca "Noronha Delivery"** com o atual @noronhadelivery — parceria, aquisição, ou pivot pra "Noronha App"
- [ ] Pesquisa de campo: ir à ilha 1 semana (ou contratar morador como ops local). Entrevistar 30 estabelecimentos
- [ ] Carta de intenção de 8–10 restaurantes âncora, 3–5 motoristas/buggys, 5–8 operadores de passeio
- [ ] Setup: GitHub repo, Supabase project, Vercel project, ASAAS conta, Mapbox token
- [ ] Identidade visual: paleta (verde mar + areia + azul Noronha), mascote opcional (golfinho? tubarão pequeno? tartaruga?), logotipo, tipografia
- [ ] Definir politicas de privacidade, termos de uso (LGPD + ICMBio compliance)

**Entregáveis:** dossiê institucional, identidade visual fechada, 10 cartas de intenção, estrutura jurídica resolvida.

---

### **FASE 1 — Landing Page de Captura e Pré-cadastro (2 semanas)**

**Objetivo:** começar a construir base de leads e pré-cadastrar parceiros antes do app existir.

**Páginas:**
1. **Home** — hero com mascote + identidade + "Disponível em breve" + captura email/WhatsApp
2. **/turista** — promessa: chegue com tudo na mão (lista de módulos)
3. **/sou-comercio** — formulário pra restaurantes/mercados (CNPJ, contato, categoria, fotos)
4. **/sou-operador** — formulário pra passeios/aluguel (credenciamento ICMBio, serviços oferecidos)
5. **/sou-motorista** — formulário pra Nortax e buggys (CNH, veículo, foto)
6. **/sou-pousada** — formulário pra hospedagem
7. **/blog** — 5 artigos iniciais SEO: "Como funciona a TPA 2026", "Trilhas com agendamento ICMBio", "Onde comer em Noronha", "Como se locomover sem Uber", "Melhor época pra visitar"
8. **/sobre** — institucional, apoio da Administração
9. **/contato** — WhatsApp business, email

**Stack:**
- Next.js 16 + Tailwind + shadcn/ui
- Form → Supabase (table `leads` segmentada por tipo)
- Resend pra confirmação automática
- Pixels: Meta, Google Ads, TikTok
- SEO técnico: schema.org LocalBusiness, sitemap, OG completo
- Domínios: noronhadelivery.com.br + .app + redirects de variantes

**Anúncios pré-lançamento:**
- Meta Ads segmentando interesses "Fernando de Noronha", "viagem Brasil", aeroporto Recife
- Google Ads: "delivery noronha", "uber noronha", "passeios noronha"
- Orçamento: R$ 3K–5K/mês durante fases 1–2 pra construir base de leads pré-app

**Entregáveis:** landing publicada, formulários ativos, blog com 5 artigos, ads rodando, base de pelo menos 500 leads pré-cadastrados.

---

### **FASE 2 — MVP App: Comida + Transporte + Info (8–10 semanas)**

**Foco:** resolver as 2 dores mais frequentes (comida fragmentada + sem transporte) + diferencial info clima.

**Funcionalidades:**
- Auth: email+senha, Google, Apple, magic link
- Onboarding: turista vs morador → personalização da home
- Perfil + endereço (cadastro de pousada/casa por nome ou pin no mapa)
- **Módulo Comida:**
  - 8–10 restaurantes ao vivo
  - Cardápio, pedido, customização, observação
  - Pagamento PIX (instantâneo) + cartão (parcelado)
  - Rastreio (recebido → preparando → saiu pra entrega → entregue)
  - Avaliação pós-pedido
- **Módulo Transporte:**
  - Corrida sob demanda (origem-destino com mapa)
  - Integração Nortax: notificação ao despachante + corrida no app
  - 3–5 buggys parceiros como motoristas pioneiros
  - Pagamento embarcado (PIX/cartão), gorjeta opcional
- **Hub Info:**
  - Clima/vento/ondas Open-Meteo + INMET
  - "Que praia agora?" (regra simples: vento <15 nós + onda <1,5m → Sancho/Sueste; vento alto → Cacimba/Boldró)
  - Previsão 7 dias
- Carteira simples (saldo cashback 1% por pedido)
- Push notifications (pedido pronto, entregador chegou, corrida aceita)
- WhatsApp fallback (Z-API): se push falha, manda WhatsApp
- **Painel Lojista web:** cardápio, pedidos em tempo real, vendas, saque
- **Painel Motorista mobile:** online/offline, aceitar corrida, navegação, ganhos
- **Painel Admin web:** KYC, moderação, conciliação, métricas

**Lançamento soft:**
- Beta fechado 2 semanas com 50 moradores + 100 turistas convidados
- Feedback estruturado (NPS + entrevistas)
- Iteração final 1 semana
- Lançamento público com evento na Vila dos Remédios + ads + WhatsApp pros leads pré-cadastrados

**Entregáveis:** app Android + iOS publicados, painéis web operacionais, 10 estabelecimentos ativos, 200 downloads na primeira semana.

---

### **FASE 3 — Passeios, Trilhas e Aluguel (6 semanas)**

- Catálogo de passeios com 10–15 operadores
- Calendário de vagas + reserva + pagamento
- Selo "Verificado pelo Noronha Delivery" (cruzado com lista ICMBio)
- Reviews públicos
- Pacotes combinados (ilha-tour + barco; transfer + 1º passeio)
- Marketplace de aluguel: buggy, moto, bike elétrica, equipamentos (snorkel, GoPro)
- Check-in/check-out com fotos
- Lembrete de trilhas ICMBio com agendamento (push 48h antes)
- Página pública do operador (perfil, fotos, reviews)

**Entregáveis:** 15 operadores ativos, 10 locadoras, ticket médio R$ 250 em passeios.

---

### **FASE 4 — Hospedagem + Comércio + Mercado (6 semanas)**

- Pousadas/hotéis: cadastro, calendário, reserva com sinal (30% no app, 70% no check-in)
- Política de cancelamento por categoria
- Check-in digital com QR
- Mercados (Noronhão, Poty, Noronha Frios): cesta + entrega
- Farmácia
- Compras antecipadas (turista pede antes do embarque, recebe na pousada na chegada)
- Upsell: pousada oferece transfer + passeio no mesmo carrinho

**Entregáveis:** 20 pousadas + 5 mercados + 1 farmácia ativos.

---

### **FASE 5 — Carteira Avançada + Taxas + Noronha Pass (4 semanas)**

- Calculadora TPA + ICMBio embutida (com seleção de dias)
- Atalho de pagamento (deep link oficial ou integração via API se conseguir)
- Noronha Pass (assinatura turista R$ 49,90/viagem)
  - Frete grátis em delivery
  - 1 transfer aeroporto incluso
  - 10% off em passeios parceiros
  - Suporte prioritário
- Cashback aumentado pra pass holders (2%)
- Notificações inteligentes (lembrete de trilha, recomendação por tempo)

**Entregáveis:** integração de taxas funcionando, primeiros 100 assinantes do Pass.

---

### **FASE 6 — Notícias, Comunidade e Eventos (4 semanas)**

- Hub de notícias com curadoria diária (parceria editorial com blog Ricardo Antunes + Diário PE)
- Mural oficial da Administração (selo verificado)
- Alertas: balsa atrasada, voo cancelado, praia fechada, eclipse, lua cheia
- Eventos locais (festas, regatas, palestras)
- Achados e perdidos
- Classificados de morador (carona, doações, vendas)
- Chat operador ↔ cliente (após reserva confirmada)

**Entregáveis:** hub de notícias ativo, 1 publicação/dia mínima, mural oficial Administração.

---

### **FASE 7 — Escala, Internacionalização e B2B (contínuo)**

- Versão em inglês e espanhol
- Onboarding em inglês
- Parceria com Azul/Gol pra push pós-compra de passagem
- API B2B para agências do continente (long-tail de revenda)
- Programa de afiliados (creator/influencer recebe % por download convertido)
- Expansão pra outras ilhas similares (Abrolhos? Atol das Rocas? Tinharé?)

---

## 9. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Conectividade ruim derruba app | Alta | Alto | Offline-first, cache agressivo, fallback WhatsApp/SMS |
| Marca "Noronha Delivery" já existe | Certa | Médio | Parceria, aquisição ou pivot pra "Noronha App" antes da Fase 1 |
| Operadores resistentes ao take rate | Média | Médio | 60 dias free + take rate menor que iFood/Booking + visibilidade |
| Sazonalidade extrema | Certa | Médio | Modelagem financeira com pico dez–fev; foco em morador na baixa |
| ICMBio sem API de trilhas | Alta | Baixo | Refresh manual diário + deep link pro site oficial |
| Restrição jurídica a não-morador operar | Média | Alto | CNPJ PE + sócio morador + assessoria jurídica antes da Fase 2 |
| iFood decide entrar | Baixa | Alto | Defender por velocidade, parceria institucional e multi-vertical |
| Lei combustão 2029 reduz frota de moto | Certa | Médio | Privilegiar bike elétrica e parceria com fabricantes |
| Pagamento falha por sinal | Alta | Médio | PIX QR estático como fallback, cache de pedidos |
| Reclamação massiva (turista x operador) | Média | Alto | Política de reembolso clara + intermediação no chat + escrow |
| LGPD em dados de turistas/estrangeiros | Média | Alto | Política clara, consentimento explícito, DPO definido |
| Custo de aquisição alto fora da ilha | Média | Médio | Foco em SEO orgânico + parceria aérea + influencers de viagem |

---

## 10. Equipe e Investimento

### Time mínimo para MVP (fases 0–2)
- 1 **PM/Product Owner** (você ou parceiro)
- 1 **Tech Lead Full-stack** (você)
- 1 **Dev mobile/Capacitor** sênior
- 1 **Designer UI/UX**
- 1 **Ops Noronha** (residente, contratado em jornada parcial) — onboarding presencial, suporte
- 1 **Growth/Marketing** (parcial, fase 1+)

### Time para escalar (fases 3+)
- +1 Dev backend
- +1 Customer Success
- +1 Designer/Content

### Custo de infra inicial
- Vercel Pro: ~$20/usuário/mês
- Supabase Pro: $25/mês + uso
- Mapbox: free até 50K loads/mês
- ASAAS: gratuito + taxa transacional
- Twilio/Z-API: ~R$ 200–500/mês
- Resend: $20/mês
- Sentry: free tier inicial
- OneSignal: free tier inicial
- **Total estimado:** R$ 800–1.500/mês até atingir GMV consistente.

### Investimento estimado em 6 meses (fases 0–2)
- Equipe: ~R$ 60–100K/mês × 6 = R$ 360–600K
- Infra: ~R$ 10K
- Marketing pré-lançamento: ~R$ 30–50K
- Jurídico + contábil: ~R$ 15–25K
- Pesquisa de campo + Ops local: ~R$ 30K
- **Total para MVP ao ar:** R$ 450–720K

---

## 11. Métricas de Sucesso (MVP — 90 dias pós-lançamento)

| Métrica | Meta |
|---|---|
| Downloads acumulados | 4.000 |
| % turistas que chegam e baixam | 30% (gancho: QR code no embarque/pousada) |
| Conversão de download → 1ª transação | 60% |
| Pedidos/mês mês 3 | 3.500 |
| GMV/mês mês 3 | R$ 150K |
| Take rate efetivo médio | 12% |
| NPS | >60 |
| Restaurantes ativos | 25 |
| Motoristas/buggys ativos | 10 |
| Operadores de passeio | 15 |
| Tempo médio até 1º pedido | <72h após download |

---

## 12. Go-to-Market

### Pré-lançamento (Fase 1)
- Ads Meta + Google segmentando "Fernando de Noronha"
- Captura no Instagram dos perfis de viagem (parceria com 5–10 microinfluencers)
- Releases pra Panrotas, Mercado&Eventos, Brasil Turis
- Cartas de boas-vindas aos pré-cadastrados

### Lançamento (Fase 2)
- Evento físico na Vila dos Remédios (com Administração presente se conseguir selo)
- QR code adesivado em todas pousadas parceiras
- QR code na chegada do aeroporto (parceria com terminal)
- Cupom de 1ª corrida grátis e 1ª entrega grátis
- WhatsApp pra base pré-cadastrada
- Vídeo institucional 60s pra YouTube/Reels/TikTok
- PR com blog do Ricardo Antunes, Diário PE, CBN Recife

### Pós-lançamento (Fase 3+)
- Programa de indicação (turista convida turista)
- Parceria com Azul/Gol: notificação pós-compra de passagem
- Conteúdo no blog 2x/semana (SEO long-tail)
- Influencer trips trimestrais

---

## 13. Próximos Passos Imediatos

1. **Validar marca** "Noronha Delivery" com pizzaria atual (parceria? aquisição? pivot?)
2. **Reunião formal** com Administração pra carta de apoio e cronograma de pesquisa de campo
3. **Definir entidade jurídica** (CNPJ PE + filial Noronha vs sócio morador)
4. **Reservar domínios** (noronhadelivery.com.br/.app + variantes pivot)
5. **Fechar identidade visual** (logo, mascote, paleta, tipografia)
6. **Iniciar Fase 1** (landing) em paralelo com Fase 0 (institucional) — sem dependência crítica
7. **Pesquisa de campo de 1 semana** na ilha pra entrevistar 30 estabelecimentos e fechar 10 cartas de intenção
8. **Setup técnico** (repos, Supabase, Vercel, ASAAS, Mapbox)

---

## Anexos

### A. Fontes da Pesquisa (12/05/2026)
- IBGE Fernando de Noronha 2025 (3.341 hab)
- CBN Recife — Recorde 139.901 turistas em 2025
- Decreto Distrital — TPA R$ 105,79/dia em 2026 (IPCA +4,4%)
- Parna Noronha / ICMBio — Ingresso R$ 192 BR / R$ 384 estrangeiro 2026
- Lei estadual — Proibição combustão 10/08/2029
- Open-Meteo Marine API (gratuita, sem key, dados oficiais)
- INMET API (dados de estação automática)
- Pesquisa de campo competitiva: Noronhei, Noronha Delivery (Instagram), Noronha Tour, Atalaia Receptivo, Mahalo, Em Noronha
- TripAdvisor / Reclame Aqui / blog Ricardo Antunes — dores do usuário

### B. Glossário
- **TPA**: Taxa de Preservação Ambiental, paga ao Distrito por dia de permanência
- **ICMBio/PARNAMAR**: Parque Nacional Marinho de Fernando de Noronha, ingresso para áreas protegidas
- **Nortax**: Associação de Taxistas de Noronha, único serviço oficial de táxi
- **Take rate**: % retido pelo marketplace sobre o GMV
- **GMV**: Gross Merchandise Volume, volume bruto transacionado
- **NPS**: Net Promoter Score
- **KYC**: Know Your Customer, validação de identidade de parceiros

---

**Documento vivo.** Iteramos a cada decisão. Próxima atualização após validação da marca e reunião com Administração.
