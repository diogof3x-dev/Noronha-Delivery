# Demandas Oficiais — Administração de Fernando de Noronha

**Recebido em 2026-05-12 via WhatsApp do administrador.**

Lista de categorias de serviço solicitadas para o app Noronha Delivery. Cigarros eletrônicos foram explicitamente removidos a pedido do usuário (mantemos "itens turísticos" apenas, se permitido legalmente).

---

## Categorias de Serviço (cobertura do app)

### Essenciais do dia-a-dia
1. **Farmácia e emergências**
2. **Mercado rápido**
3. **Água, gelo e carvão**
4. **Conveniência 24h**
5. **Itens turísticos** (se permitido legalmente)

### Delivery especializado
6. **Delivery de praia** (levar pedido até a praia onde o cliente está)
7. **Delivery para pousadas**
8. **Delivery para barcos e praias específicas**
9. **Entregas entre empresas** (B2B inter-comerciantes)

### Mobilidade e bagagem
10. **Transporte de malas**
11. **Transfer aeroporto ↔ pousada**
12. **Aluguel de bikes e scooters** (privilegiar elétrico — pegada verde)

### Reservas e agendamento
13. **Reservas de restaurantes**
14. **Agendamento de passeios**
15. **Venda de ingressos/eventos**

### Serviços ao turista e morador
16. **Recarga de celular**
17. **Aluguel de carregadores / power banks**
18. **Retirada de lavanderia**
19. **Pet shop / veterinário**
20. **Academia e personal trainer**
21. **Massagens / spa**
22. **Assistência mecânica**

### Premium
23. **Turismo VIP**
24. **"Concierge" para turistas** (atendimento dedicado, personalização de roteiro)

---

## Pitch ambiental institucional (pedido do administrador)

- **Delivery 100% elétrico** (bike e scooter elétrica como frota padrão)
- **Menos barulho** (vibe da ilha preservada)
- **Menos combustível** (alinhado à lei de proibição de combustão em 10/08/2029)
- **Marketing "verde" para Noronha** — posicionar o app como parte da agenda de sustentabilidade da ilha

---

## Implicações pra arquitetura

### Mapeamento → módulos da PROPOSTA.md

| Demanda do admin | Módulo no app |
|---|---|
| Farmácia, mercado, água/gelo/carvão, conveniência, itens turísticos | **Módulo Mercado e Conveniência** (expansão do bloco D) |
| Delivery de praia, pousada, barco, B2B | **Módulo Delivery** (variações de destino: praia/pousada/barco/empresa) |
| Transporte de malas, transfer, bikes/scooters | **Módulo Transporte + Aluguel** |
| Reservas restaurante, agendamento passeio, ingressos | **Módulo Reservas** (fundir restaurante + passeio + evento) |
| Recarga celular, power bank, lavanderia, pet, academia, spa, mecânica | **Módulo Serviços** (categoria nova "Serviços ao Turista") |
| Turismo VIP + concierge | **Noronha Pass VIP** (tier premium da assinatura) |

### Novo módulo dedicado: "Serviços"
Necessário criar uma vertical inteira para serviços não-mercadoria (recarga, lavanderia, pet, academia, spa, mecânica, concierge). UX baseada em:
- Categoria → prestador → agendamento ou solicitação imediata
- Pagamento embarcado
- **Avaliação obrigatória** após conclusão

### Delivery contextual (destino flexível)
O turista no app deve poder pedir delivery para:
- Sua pousada (padrão)
- Praia onde está (com geolocalização + ponto de referência, ex: "Praia do Sancho — barraca do Tito")
- Barco (com nome da embarcação e marina)
- Outro endereço

### Frota elétrica como diferencial
- KYC do entregador exige veículo elétrico (bike, scooter)
- Selo "100% Elétrico" no app
- Pitch "marketing verde" no onboarding e na landing
- Métrica pública: "X kg de CO₂ evitados este mês"

---

## A incorporar em outros documentos

- [x] PROPOSTA.md → atualizar mapa de módulos (próxima revisão)
- [x] BUILD-PLAN.md → criar bloco específico "Módulo Serviços"
- [x] UX-DECISIONS.md → adicionar variações de destino no checkout de delivery
- [x] Landing page → incluir os 24 serviços como prova de cobertura ("Aqui você tem TUDO" se materializa nessa lista)
- [x] Identidade visual → adicionar selo verde / leaf icon
