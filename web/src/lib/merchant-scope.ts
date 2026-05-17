import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { Profile } from "./profile";

export type MerchantScope = {
  /** IDs das lojas que esse user opera. Se vazio, escopo = TUDO (admin sem loja). */
  businessIds: string[];
  /** True quando o user opera lojas reais (NÃO é admin/platform-wide view). */
  hasOwnBusinesses: boolean;
  /** True quando user é admin global (passa por todas as guards). */
  isPlatformAdmin: boolean;
  /** True quando precisamos mostrar TUDO (admin sem lojas próprias). */
  showAll: boolean;
};

/**
 * Resolve o escopo de painel pro lojista.
 *
 * Regra: admin que ALSO é dono de lojas vê SÓ as próprias no /parceiro/painel.
 * Pra ver tudo da plataforma, ele usa /super-admin.
 * Admin SEM loja própria (operador puro) vê tudo no /parceiro/painel.
 *
 * Isso evita o bug do admin-que-também-testa-como-lojista ver o catálogo de
 * todo mundo no painel dele.
 */
export async function getMerchantScope(
  supabase: SupabaseClient<Database>,
  userId: string,
  profile: Profile | null,
): Promise<MerchantScope> {
  const isPlatformAdmin = profile?.role === "admin";

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId);

  const businessIds = (businesses ?? []).map((b) => b.id);
  const hasOwnBusinesses = businessIds.length > 0;

  return {
    businessIds,
    hasOwnBusinesses,
    isPlatformAdmin,
    showAll: isPlatformAdmin && !hasOwnBusinesses,
  };
}
