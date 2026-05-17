import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { SuspendForm } from "./suspend-form";
import { TakeRateForm } from "./take-rate-form";
import { unsuspendBusiness } from "@/app/actions/admin-ops";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function LojaDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/entrar?next=/super-admin/lojas/${id}`);
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  const { data: biz } = await admin
    .from("businesses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!biz) notFound();

  const [{ data: lifetime }, { data: takeRates }, { data: ownerProfile }] = await Promise.all([
    admin.from("mv_business_lifetime").select("*").eq("business_id", id).maybeSingle(),
    admin
      .from("take_rate_campaigns")
      .select("id, take_rate_bps, starts_at, ends_at, is_active, name, created_at")
      .eq("applies_to", "business")
      .eq("applies_id", id)
      .order("created_at", { ascending: false }),
    admin.from("profiles").select("full_name, whatsapp").eq("id", biz.owner_id).maybeSingle(),
  ]);

  const activeOverride = (takeRates ?? []).find(
    (t) =>
      t.is_active &&
      t.starts_at &&
      t.ends_at &&
      new Date(t.starts_at).getTime() <= Date.now() &&
      new Date(t.ends_at).getTime() >= Date.now(),
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center gap-2">
        <Link
          href="/super-admin/lojas"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            {biz.type}
          </p>
          <h1 className="text-xl font-bold tracking-tight">{biz.name}</h1>
        </div>
        {!biz.is_active && (
          <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-[11px] font-semibold text-destructive">
            <ShieldAlert className="h-3 w-3" /> Suspensa
          </span>
        )}
      </div>

      {biz.suspended_reason && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
          <p className="font-semibold text-destructive">Motivo da suspensão</p>
          <p className="mt-1 text-muted-foreground">{biz.suspended_reason}</p>
          {biz.suspended_at && (
            <p className="mt-1 text-[10px] text-muted-foreground">
              {new Date(biz.suspended_at).toLocaleString("pt-BR")}
            </p>
          )}
          <form
            action={async (fd) => {
              "use server";
              await unsuspendBusiness(fd);
            }}
            className="mt-3"
          >
            <input type="hidden" name="business_id" value={biz.id} />
            <Button size="sm" type="submit">
              Reativar loja
            </Button>
          </form>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="GMV total" value={formatCents(Number(lifetime?.gmv_cents ?? 0))} />
        <Stat label="Receita plataforma" value={formatCents(Number(lifetime?.fee_cents ?? 0))} />
        <Stat label="Pedidos pagos" value={String(lifetime?.paid_count ?? 0)} />
        <Stat label="Ticket médio" value={formatCents(Number(lifetime?.avg_ticket_cents ?? 0))} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Dono
        </h2>
        <p className="font-semibold">{ownerProfile?.full_name ?? "—"}</p>
        <p className="text-xs text-muted-foreground">{ownerProfile?.whatsapp ?? "—"}</p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold">Take rate</h2>
        <p className="text-xs text-muted-foreground">
          {activeOverride
            ? `Override ativo: ${(activeOverride.take_rate_bps / 100).toFixed(2)}% (${activeOverride.name})`
            : "Sem override — usa padrão da plataforma"}
        </p>
        <TakeRateForm businessId={biz.id} currentBps={activeOverride?.take_rate_bps ?? null} />
      </section>

      {biz.is_active && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <h2 className="mb-2 text-sm font-semibold text-destructive">Suspender loja</h2>
          <p className="text-xs text-muted-foreground">
            Loja some da vitrine, não recebe pedidos novos. Pedidos em andamento seguem.
          </p>
          <SuspendForm businessId={biz.id} />
        </section>
      )}

      {(takeRates ?? []).length > 1 && (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Histórico de overrides
          </h2>
          <ul className="space-y-1 text-xs">
            {(takeRates ?? []).map((t) => (
              <li key={t.id} className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-[10px] text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString("pt-BR")}
                </span>
                <span className="font-bold">{(t.take_rate_bps / 100).toFixed(2)}%</span>
                <span className="text-muted-foreground">{t.name}</span>
                {t.is_active ? (
                  <span className="rounded-full bg-[color:var(--turtle)]/10 px-2 text-[10px] font-semibold text-[color:var(--turtle)]">
                    ativo
                  </span>
                ) : (
                  <span className="text-muted-foreground">· inativo</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
