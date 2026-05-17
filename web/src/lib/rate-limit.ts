import { getAdminClient } from "./supabase/admin-client";

export type RateLimitResult = { ok: true } | { ok: false; error: string };

/**
 * Consome 1 token do bucket. Retorna ok:true se permitiu, ok:false se bloqueou.
 * O bucket reseta automaticamente quando o tempo de window expira.
 */
export async function consumeRateLimit(
  key: string,
  options: { limit: number; windowSeconds: number; errorMessage?: string },
): Promise<RateLimitResult> {
  const admin = getAdminClient();
  if (!admin) return { ok: true }; // fail-open: sem admin client não bloqueia

  const { data, error } = await admin.rpc("consume_rate_limit", {
    p_key: key,
    p_limit: options.limit,
    p_window_seconds: options.windowSeconds,
  });

  if (error) {
    // fail-open em caso de erro de DB; logar pra Sentry capturar
    console.error("[rateLimit] rpc failed", error);
    return { ok: true };
  }

  if (data === false) {
    return {
      ok: false,
      error: options.errorMessage ?? "Muitas tentativas. Tente em alguns segundos.",
    };
  }

  return { ok: true };
}

export function rateLimitKey(...parts: (string | undefined | null)[]): string {
  return parts.filter(Boolean).join(":");
}
