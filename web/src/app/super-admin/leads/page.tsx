import Link from "next/link";
import { BadgeCheck, Inbox, Trash2 } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { ApproveLeadForm } from "./approve-form";
import { dismissLead, deleteLead } from "@/app/actions/leads-admin";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  waitlist: "Waitlist (cliente)",
  comercio: "Comércio / Restaurante",
  pousada: "Pousada",
  operador: "Operador de passeio",
  motorista: "Motoboy / Motorista",
};

type Filter = "pendentes" | "tratados" | "todos";

export default async function SuperAdminLeads({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "pendentes";

  const supabase = await getServerClient();

  let q = supabase
    .from("leads")
    .select("id, type, name, whatsapp, email, payload, contacted, created_at")
    .order("created_at", { ascending: false });

  if (filter === "pendentes") q = q.eq("contacted", false);
  else if (filter === "tratados") q = q.eq("contacted", true);

  const { data } = await q.limit(200);

  const [{ count: pending }, { count: done }, { count: total }] = await Promise.all([
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("contacted", false),
    supabase.from("leads").select("id", { count: "exact", head: true }).eq("contacted", true),
    supabase.from("leads").select("id", { count: "exact", head: true }),
  ]);

  const tabs: { value: Filter; label: string; count: number; tone?: string }[] = [
    { value: "pendentes", label: "Pendentes", count: pending ?? 0, tone: "warn" },
    { value: "tratados", label: "Tratados", count: done ?? 0 },
    { value: "todos", label: "Todos", count: total ?? 0 },
  ];

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Solicitações de credenciamento
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Quem preenche os formulários de pré-cadastro (<em>quero vender</em>, <em>quero
          credenciar minha pousada</em>, <em>quero ser entregador</em>) aparece aqui.
          Aprove pra criar a loja real e promover o perfil pra <strong>business_owner</strong>.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const isActive = filter === t.value;
          const isWarn = t.tone === "warn" && t.count > 0;
          return (
            <Link
              key={t.value}
              href={`/super-admin/leads?filter=${t.value}`}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : isWarn
                    ? "bg-[color:var(--sun)]/15 text-[color:var(--sun)] hover:bg-[color:var(--sun)]/25"
                    : "bg-secondary text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {t.label}
              <span
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  isActive
                    ? "bg-primary-foreground/20"
                    : isWarn
                      ? "bg-[color:var(--sun)] text-white"
                      : "bg-background"
                }`}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {!data?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            {filter === "pendentes" ? "Nada na fila." : "Vazio."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {data.map((l) => {
            const payload = (l.payload as { business?: string; category?: string; cnpj?: string; district?: string; about?: string; vehicle_type?: string; license_plate?: string } | null) ?? {};
            const displayName = payload.business ?? l.name;

            return (
              <li
                key={l.id}
                className={`rounded-2xl border bg-card p-4 ${
                  !l.contacted ? "border-[color:var(--sun)]/40" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {displayName}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {TYPE_LABEL[l.type] ?? l.type}
                      </span>
                      {l.contacted && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                          <BadgeCheck className="h-3 w-3" />
                          Tratado
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Contato: <strong>{l.name}</strong>
                      {l.whatsapp ? ` · ${l.whatsapp}` : ""}
                      {l.email ? ` · ${l.email}` : ""}
                    </p>
                    {(payload.category || payload.district) && (
                      <p className="text-xs">
                        {payload.category ? <strong>{payload.category}</strong> : null}
                        {payload.category && payload.district ? " · " : ""}
                        {payload.district ?? ""}
                      </p>
                    )}
                    {payload.cnpj && <p className="text-xs">CNPJ: {payload.cnpj}</p>}
                    {payload.vehicle_type && (
                      <p className="text-xs">
                        Veículo: <strong>{payload.vehicle_type}</strong>
                        {payload.license_plate ? ` · ${payload.license_plate}` : ""}
                      </p>
                    )}
                    {payload.about && (
                      <p className="mt-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs">{payload.about}</p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(l.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>

                {!l.contacted && l.type !== "motorista" && l.type !== "waitlist" && (
                  <div className="mt-3 border-t border-border pt-3">
                    <ApproveLeadForm
                      leadId={l.id}
                      defaultName={displayName}
                      defaultType={l.type}
                      defaultDistrict={payload.district ?? "Vila dos Remédios"}
                      defaultEmail={l.email ?? ""}
                    />
                  </div>
                )}

                {!l.contacted && l.type === "motorista" && (
                  <p className="mt-3 rounded-lg border-t border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
                    Motoboys são aprovados em{" "}
                    <Link href="/super-admin/entregadores?filter=candidatos" className="text-primary underline">
                      Entregadores
                    </Link>{" "}
                    depois que ele logar com Google e preencher CNH+veículo no painel.
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                  {l.whatsapp && (
                    <a
                      href={`https://wa.me/${l.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener"
                      className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      WhatsApp ↗
                    </a>
                  )}
                  {!l.contacted && (
                    <form action={dismissLead}>
                      <input type="hidden" name="id" value={l.id} />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        Marcar como tratado
                      </button>
                    </form>
                  )}
                  <form action={deleteLead}>
                    <input type="hidden" name="id" value={l.id} />
                    <button
                      type="submit"
                      aria-label="Excluir"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
