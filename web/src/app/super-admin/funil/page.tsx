import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { FunnelChart } from "./funnel-chart";

export const dynamic = "force-dynamic";

export default async function FunilPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/funil");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const admin = getAdminClient();
  if (!admin) return <div className="p-8 text-sm text-destructive">Service role não configurado</div>;

  const [{ data: funnel }, { count: totalLeads }, { count: totalContacted }, { count: totalApproved }, { count: totalActiveBiz }] =
    await Promise.all([
      admin.from("mv_funnel_leads_weekly").select("*").order("week", { ascending: true }),
      admin.from("leads").select("id", { count: "exact", head: true }),
      admin.from("leads").select("id", { count: "exact", head: true }).eq("contacted", true),
      admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "business_owner"),
      admin.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true),
    ]);

  // taxa de conversão: leads contatados / total, business_owners / contatados, ativos / business_owners
  const ratioContact = totalLeads ? ((totalContacted ?? 0) / totalLeads) * 100 : 0;
  const ratioApprove = totalContacted ? ((totalApproved ?? 0) / totalContacted) * 100 : 0;
  const ratioActive = totalApproved ? ((totalActiveBiz ?? 0) / totalApproved) * 100 : 0;

  const weeks = (funnel ?? []).map((r) => ({
    label: new Date(r.week).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    total: Number(r.leads_total),
    contacted: Number(r.leads_contacted),
    comercio: Number(r.leads_comercio),
    motorista: Number(r.leads_motorista),
    pousada: Number(r.leads_pousada),
    operador: Number(r.leads_operador),
  }));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Funil de cadastro</h1>
        <p className="text-xs text-muted-foreground">Lead → contatado → aprovado → ativo</p>
      </header>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <FunnelStat label="Total de leads" value={totalLeads ?? 0} pct={100} />
        <FunnelStat label="Contatados" value={totalContacted ?? 0} pct={ratioContact} />
        <FunnelStat label="Aprovados" value={totalApproved ?? 0} pct={ratioApprove} />
        <FunnelStat label="Loja ativa" value={totalActiveBiz ?? 0} pct={ratioActive} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Leads semanais por tipo (180d)
        </h2>
        <FunnelChart data={weeks} />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          <strong>Como ler:</strong> a coluna &quot;Aprovados&quot; é a contagem de profiles
          com role <code>business_owner</code> (passaram pela aprovação manual). &quot;Loja ativa&quot; é
          quem completou cadastro e tem businesses.is_active=true. Quanto maior a queda entre
          colunas, maior o atrito naquela etapa.
        </p>
      </section>
    </div>
  );
}

function FunnelStat({ label, value, pct }: { label: string; value: number; pct: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value.toLocaleString("pt-BR")}</p>
      <p className="text-[11px] text-muted-foreground">{pct.toFixed(1)}% do anterior</p>
    </div>
  );
}
