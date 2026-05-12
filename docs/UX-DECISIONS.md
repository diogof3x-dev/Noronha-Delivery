# UX e Decisões de Design — Noronha Delivery

**Documento vivo · iniciado em 2026-05-12**

---

## Princípios Gerais

1. **Familiaridade > novidade.** O turista chega com modelo mental de iFood, Uber, Booking. Replicamos esses padrões — não reinventamos.
2. **1 toque pra ação principal.** Toda tela tem 1 CTA dominante.
3. **Offline-first.** Cache agressivo, fila de sync, estado otimista.
4. **Avaliação obrigatória em tudo.** Não há transação concluída sem rating do cliente.
5. **Mobile-first.** Desktop é dashboard, não consumo.

---

## Sistema de Cores

Paleta institucional Noronha:

```
--primary       (azul oceano)         #0B7FA8
--primary-dark  (azul profundo)       #084D66
--accent        (laranja delivery)    #FF6B35   ← gancho iFood, ação principal
--accent-dark   (laranja escuro)      #E55525
--secondary     (verde tartaruga)     #2D8659
--sand          (areia clara)         #F5E6C8
--coral         (coral)               #E94B4B   ← alertas/urgência
--sun           (amarelo sol)         #F4C430   ← rating estrelas
--ink           (texto principal)     #1A2332
--muted         (texto secundário)    #6B7785
--surface       (fundo)               #FFFFFF
--surface-2     (fundo card)          #FAFBFC
```

**Decisão:** o **laranja `#FF6B35`** é o accent dominante das CTAs no módulo comida — ecoa o iFood vermelho/laranja sem copiar — entrega familiaridade visual.

---

## Tipografia

- **Display:** Geist Sans (ou Inter) — moderna, neutra, legibilidade alta
- **Mono:** Geist Mono (preços, códigos, horários)
- Tamanhos: 12 / 14 / 16 / 20 / 24 / 32 / 48
- Pesos: 400 / 500 / 600 / 700

---

## Padrões Espelhados do iFood (Módulo Comida)

### Home dos Restaurantes
```
┌─────────────────────────────┐
│  📍 Vila dos Remédios   👤  │ ← endereço + perfil
├─────────────────────────────┤
│  🔍 Buscar restaurantes     │ ← search bar
├─────────────────────────────┤
│ 🍕 🍔 🥗 🍣 🍦 🌮 ▶        │ ← categorias scroll horizontal
├─────────────────────────────┤
│ 🔥 Promoções            ▶   │ ← carrossel
├─────────────────────────────┤
│ Para você                   │
│ ┌─────────────────────────┐ │
│ │ [LOGO] Restaurante X    │ │ ← card vertical
│ │ ⭐ 4.8 · 30min · R$ 8   │ │
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

### Tela do Restaurante
- Banner com foto + logo flutuante
- Sticky header com nome + rating + tempo + frete
- Abas de categorias do cardápio (sticky ao scroll)
- Cards de produto com foto, descrição, preço
- FAB carrinho fixo no rodapé com contador e total

### Item / Customização
- Foto grande full-width
- Descrição + preço
- Acompanhamentos opcionais (radio/checkbox)
- Quantidade + observações
- CTA "Adicionar — R$ X,XX" fixo

### Carrinho
- Lista de itens com edit/remove
- Endereço de entrega (CEP-less, busca por pousada/marco)
- Cupom
- Resumo financeiro (subtotal + frete + total)
- Forma de pagamento
- CTA "Finalizar pedido"

### Pagamento
- PIX (QR code instantâneo, copia-cola, 10min validade)
- Cartão crédito/débito (ASAAS Checkout)
- Dinheiro na entrega (com campo "troco para")
- Saldo Noronha (cashback)

### Status do Pedido (Tela Live)
Stepper vertical com timestamps:
1. ✅ Pedido recebido
2. ✅ Restaurante confirmou
3. ⏳ Preparando seu pedido
4. ⏳ Saiu para entrega (com mapa do entregador)
5. ⏳ Entregue
6. ⏳ Avalie seu pedido ← **leva direto pra tela de rating**

### Histórico
- Lista cronológica
- Status (concluído / cancelado / em andamento)
- "Pedir novamente" 1-tap
- "Avaliar" se ainda não avaliou

---

## Sistema de Avaliação Universal

### Regra de Ouro
**Toda transação concluída dispara modal de avaliação obrigatório.** O usuário pode pular, mas o modal reabre nas próximas 3 sessões. Após pular 3x ou avaliar, o pedido vira "finalizado".

### Tela de Avaliação

```
┌─────────────────────────────────┐
│                                  │
│   Como foi sua experiência?     │
│                                  │
│        ⭐ ⭐ ⭐ ⭐ ⭐             │  ← obrigatório
│                                  │
│ ─────────────────────────────── │
│                                  │
│ O que você mais gostou?         │
│ [Tag] [Tag] [Tag] [Tag] [Tag]   │  ← tags contextuais (multi-select)
│                                  │
│ Deixe um comentário (opcional)  │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ └─────────────────────────────┘ │
│                                  │
│ 📷 Adicionar foto (opcional)    │
│                                  │
│  [ Enviar avaliação ]           │
│                                  │
└─────────────────────────────────┘
```

### Tags por Categoria (pré-definidas)

**Restaurante:**
- Positivas: "Comida quente", "Embalagem ok", "Entregador educado", "No prazo", "Saboroso", "Porção generosa"
- Negativas: "Atraso", "Frio", "Faltou item", "Errado", "Embalagem ruim", "Caro demais"

**Passeio:**
- Positivas: "Guia atencioso", "Pontual", "Vista incrível", "Bem organizado", "Equipamento bom", "Valeu o preço"
- Negativas: "Atrasou", "Grupo cheio", "Equipamento ruim", "Guia distraído", "Não correspondeu"

**Transporte:**
- Positivas: "Pontual", "Veículo limpo", "Motorista educado", "Direção segura", "Conhece a ilha"
- Negativas: "Atrasou", "Veículo sujo", "Direção arriscada", "Mal humorado", "Cancelou"

**Hospedagem:**
- Positivas: "Limpa", "Café bom", "Bem localizada", "Vista boa", "Atendimento", "Custo-benefício"
- Negativas: "Suja", "Barulho", "Wi-Fi ruim", "Café fraco", "Mal localizada"

**Aluguel:**
- Positivas: "Veículo bom", "Combustível ok", "Entrega rápida", "Atendimento", "Preço justo"
- Negativas: "Veículo ruim", "Sujo", "Atraso na entrega", "Cobrança injusta"

**Mercado:**
- Positivas: "Tudo correto", "Bem embalado", "Rápido", "Preço justo", "Fresco"
- Negativas: "Faltou item", "Errado", "Vencido", "Mal embalado", "Caro"

### Cálculo do Score Público

Score exibido = **média bayesiana** (evita item novo com 1 avaliação 5★ dominar):

```
score = (n * média_item + m * média_global) / (n + m)
```

- `n` = número de avaliações do item
- `m` = peso da média global (sugestão: m = 10)

Exibição: estrela com decimal (`4.7`) + número de avaliações (`(187)`).

### Resposta do Lojista
- Lojista pode responder a cada avaliação (pública, 1x por avaliação).
- Avaliação <3★ dispara push pro lojista responder.
- Avaliação <2★ entra na fila do suporte (admin pode mediar).

### Anti-fraude
- 1 avaliação por pedido (não por usuário).
- Heurística: avaliações 5★ em sequência do mesmo IP/CPF → flag.
- Avaliação só após `pedido = entregue` confirmado.
- Avaliação congelada após 30 dias (não pode mais editar).

### Schema da Tabela `ratings`

```sql
create table ratings (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid references orders(id) unique,    -- 1 por pedido
  business_id     uuid references businesses(id),       -- denormalizado pra agregar rápido
  service_id      uuid references services(id),         -- opcional, prato/passeio específico
  rated_by        uuid references profiles(id),
  rated_entity    text not null,                         -- 'business' | 'driver' | 'service'
  rated_entity_id uuid not null,
  stars           int not null check (stars between 1 and 5),
  tags            text[] default '{}',
  comment         text,
  photo_urls      text[] default '{}',
  reply           text,
  reply_at        timestamptz,
  flagged         boolean default false,
  created_at      timestamptz default now()
);

create index on ratings(rated_entity, rated_entity_id);
create index on ratings(business_id);
create index on ratings(rated_by);
```

### View Materializada de Score Agregado

```sql
create materialized view business_scores as
select
  business_id,
  count(*) as total_reviews,
  avg(stars)::numeric(3,2) as avg_stars,
  ((count(*) * avg(stars) + 10 * 4.0) / (count(*) + 10))::numeric(3,2) as bayesian_score
from ratings
group by business_id;
```

Refresh a cada nova avaliação (trigger ou job).

---

## Padrões Globais do App

### Navegação
- Bottom tab (5 itens): **Início · Buscar · Pedidos · Carteira · Perfil**
- Início é o "hub" — cards horizontais por módulo (Comida, Transporte, Passeios, Hospedagem, Aluguel, Mercado, Clima)
- Header sticky com endereço atual + sino notificações

### Estados Vazios
- Toda lista vazia tem ilustração + texto + CTA
- Mensagem em PT amistosa, sem jargão

### Erros
- Banner inline no contexto
- Erro de rede com botão "Tentar de novo"
- Pagamento falho com retry e contato suporte

### Loading
- Skeleton em listas
- Spinner inline em botões
- Estado otimista em ações reversíveis

### Acessibilidade
- Contraste AA mínimo
- Toques 44x44 mínimo
- Labels semânticas
- Suporte a screen reader

---

## Decisões Específicas Tomadas

1. **Slogan oficial:** "Noronha Delivery — aqui você tem Tudo."
2. **Accent laranja `#FF6B35`** para CTAs do delivery (gancho iFood sem copiar).
3. **Endereço sem CEP:** ilha tem endereçamento informal — usuário busca por pousada/marco/PIN.
4. **PIX é meio primário.** Cartão secundário. Dinheiro permitido no delivery.
5. **Avaliação obrigatória universal** com modal reabrindo 3x se pulado.
6. **Score bayesiano** (m=10) pra ranking estável.
7. **Resposta pública do lojista** permitida 1x por avaliação.
8. **Onboarding diferencia turista vs morador** — UX adapta home.
9. **WhatsApp fallback** sempre que push falhar (Z-API).
10. **Modo retirar no balcão** desde o MVP do delivery.

---

## Próximas decisões em aberto

- [ ] Mascote: golfinho? tartaruga? tubarão? (definir antes da identidade visual final)
- [ ] Validar/pivotar marca com pizzaria @noronhadelivery
- [ ] Empresa jurídica: CNPJ PE + filial Noronha ou sócio morador?
- [ ] Reservar domínios e perfis sociais
