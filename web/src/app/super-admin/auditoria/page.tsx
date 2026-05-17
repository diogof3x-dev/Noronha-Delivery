import { redirect } from "next/navigation";
import { History } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";

export const dynamic = "force-dynamic";

const ACTION_LABEL: Record<string, string> = {
  approve_lead: "Aprovou lead",
  reject_lead: "Rejeitou lead",
  approve_business: "Aprovou loja",
  suspend_business: "Suspendeu loja",
  unsuspend_business: "Reativou loja",
  approve_driver: "Aprovou motoboy",
  ban_customer: "Baniu cliente",
  unban_customer: "Restaurou cliente",
  impersonate_start: "Começou impersonate",
  impersonate_stop: "Saiu de impersonate",
  set_business_take_rate: "Setou take rate da loja",
  approve_withdrawal: "Aprovou saque",
  reject_withdrawal: "Rejeitou saque",
  edit_platform_settings: "Editou settings",
  create_coupon: "Criou cupom",
  delete_coupon: "Excluiu cupom",
};

export default async function AuditoriaPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/auditoria");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) {
    return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;
  }

  const { data: rows } = await admin
    .from("admin_audit_log")
    .select("id, action, target_type, target_id, target_label, payload, created_at, admin_id")
    .order("created_at", { ascending: false })
    .limit(200);

  const adminIds = Array.from(new Set((rows ?? []).map((r) => r.admin_id)));
  const { data: admins } = adminIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", adminIds)
    : { data: [] };
  const adminMap = new Map((admins ?? []).map((a) => [a.id, a.full_name]));

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Auditoria
        </h1>
        <p className="text-xs text-muted-foreground">
          Últimas 200 ações administrativas
        </p>
      </header>

      {!rows?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <History className="h-5 w-5" />
          </span>
          <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>
        </div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-baseline gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs"
            >
              <span className="font-mono text-[10px] text-muted-foreground">
                {new Date(r.created_at).toLocaleString("pt-BR")}
              </span>
              <span className="font-semibold">
                {adminMap.get(r.admin_id) ?? r.admin_id.slice(0, 8)}
              </span>
              <span className="text-muted-foreground">
                {ACTION_LABEL[r.action] ?? r.action}
              </span>
              {r.target_label && (
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium">
                  {r.target_label}
                </span>
              )}
              {r.target_type && !r.target_label && (
                <span className="text-muted-foreground">
                  · {r.target_type}/{r.target_id?.slice(0, 8)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
