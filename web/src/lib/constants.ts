// Constantes centrais da plataforma — fonte única da verdade.
// Quando mudar, conferir também as RPCs do Supabase (effective_take_rate_bps,
// platform_settings) que duplicam o default em SQL.

/** Taxa de serviço cobrada do cliente em basis points (1.99% = 199 bps) */
export const SERVICE_FEE_BPS = 199;

/** Take rate padrão da plataforma quando não há campanha ativa (10% = 1000 bps) */
export const DEFAULT_TAKE_RATE_BPS = 1000;

/** Tamanho do código de entrega que o cliente repassa pro motoboy */
export const DELIVERY_CODE_LENGTH = 4;

/** Quantos dias após delivered o saldo do lojista é liberado pra saque (D+8) */
export const PAYOUT_D_PLUS_DAYS = 8;

/** Quantas tentativas de gerar PIX antes de desistir e deixar o cliente retry manual */
export const PIX_GENERATION_RETRIES = 2;

/** SLA target em minutos pra dashboard de operação */
export const DELIVERY_SLA_MINUTES = 60;

/** Tolerância de centavos entre o valor do MP webhook e o total do pedido */
export const MP_AMOUNT_TOLERANCE_CENTS = 5;

/** Cache-Control p/ assets imutáveis no Supabase Storage (1 ano) */
export const STORAGE_CACHE_CONTROL = "public, max-age=31536000, immutable";
