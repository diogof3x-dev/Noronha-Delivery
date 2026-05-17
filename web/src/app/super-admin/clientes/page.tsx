import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { BanForm } from "./ban-form";
import { unbanCustomer } from "@/app/actions/admin-ops";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Filter = "todos" | "ativos" | "banidos" | "top";

export default async function SuperAdminClientes({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; q?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "top";
  const search = params.q?.trim() ?? "";

  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/clientes");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  let q = admin
    .from("mv_customer_lifetime")
    .select("*")
    .limit(100);

  if (filter === "top") q = q.order("total_spent_cents", { ascending: false });
  else q = q.order("customer_created_at", { ascending: false });

  if (search) {
    q = q.or(`name.ilike.%${search}%,whatsapp.ilike.%${search}%`);
  }

  const { data: rows } = await q;

  // pra filtros ativos/banidos preciso de info do profile (não está na MV)
  const ids = (rows ?? []).map((r) => r.customer_id);
  const { data: profiles } = ids.length
    ? await admin
        .from("profiles")
        .select("id, is_banned, banned_reason, banned_at")
        .in("id", ids)
    : { data: [] };
  const banMap = new Map(
    (profiles ?? []).map((p) => [p.id, { banned: p.is_banned, reason: p.banned_reason, at: p.banned_at }]),
  );

  const filtered = (rows ?? []).filter((r) => {
    const b = banMap.get(r.customer_id);
    if (filter === "banidos") return b?.banned === true;
    if (filter === "ativos") return b?.banned !== true;
    return true;
  });

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Super admin
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Clientes</h1>
        </div>
        <form className="flex items-center gap-2" action="/super-admin/clientes">
          <input type="hidden" name="filter" value={filter} />
          <input
            type="search"
            name="q"
            defaultValue={search}
            placeholder="nome ou whatsapp..."
            className="h-9 w-48 rounded-full border border-border bg-card px-3 text-xs"
          />
          <Button size="sm" type="submit" variant="outline">
            Buscar
          </Button>
        </form>
      </header>

      <div className="inline-flex rounded-full border border-border bg-card p-1 text-xs">
        {(["top", "ativos", "banidos", "todos"] as Filter[]).map((f) => (
          <Link
            key={f}
            href={`/super-admin/clientes?filter=${f}${search ? `&q=${search}` : ""}`}
            className={`rounded-full px-3 py-1 font-semibold capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "top" ? "Top GMV" : f}
          </Link>
        ))}
      </div>

      {!filtered.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <Users className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((r) => {
            const b = banMap.get(r.customer_id);
            return (
              <li
                key={r.customer_id}
                className={`rounded-2xl border bg-card p-3 ${
                  b?.banned ? "border-destructive/30 bg-destructive/5" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {r.name ?? "—"}
                      {b?.banned && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                          <ShieldAlert className="h-3 w-3" /> Banido
                        </span>
                      )}
                      {r.is_resident && (
                        <span className="rounded-full bg-[color:var(--turtle)]/10 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--turtle)]">
                          residente
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {r.whatsapp ?? "—"} {r.district ? `· ${r.district}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {r.paid_orders_count} pedidos · {formatCents(Number(r.total_spent_cents))} total
                      {r.last_order_at &&
                        ` · último ${new Date(r.last_order_at).toLocaleDateString("pt-BR")}`}
                    </p>
                    {b?.banned && b.reason && (
                      <p className="mt-1 text-[11px] text-destructive">
                        <strong>Motivo:</strong> {b.reason}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    {b?.banned ? (
                      <form
                        action={async (fd) => {
                          "use server";
                          await unbanCustomer(fd);
                        }}
                      >
                        <input type="hidden" name="customer_id" value={r.customer_id} />
                        <Button type="submit" size="sm" variant="outline">
                          Restaurar
                        </Button>
                      </form>
                    ) : (
                      <BanForm customerId={r.customer_id} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
