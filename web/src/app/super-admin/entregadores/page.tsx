import Link from "next/link";
import { BadgeCheck, Bike, Clock, ShieldAlert } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { setDriverApprovedAdmin } from "@/app/actions/profile-admin";

export const dynamic = "force-dynamic";

type Filter = "candidatos" | "aprovados" | "todos";

const VEHICLE_LABEL: Record<string, string> = {
  bike_eletrica: "Bike elétrica",
  scooter_eletrica: "Scooter elétrica",
  moto: "Moto",
  buggy: "Buggy",
  carro_eletrico: "Carro elétrico",
  carro: "Carro",
};

export default async function SuperAdminEntregadores({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "candidatos";

  const supabase = await getServerClient();

  // 1) lojistas, drivers e candidatos (que enviaram CNH+veículo mas ainda são customer)
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, full_name, whatsapp, cpf, role, cnh_number, cnh_category, vehicle, pix_kind, pix_value, is_online, created_at",
    )
    .or("role.eq.driver,and(role.eq.customer,cnh_number.not.is.null)")
    .order("created_at", { ascending: false })
    .limit(200);

  type Row = (NonNullable<typeof data>)[number];

  const candidatos: Row[] = [];
  const aprovados: Row[] = [];
  for (const p of data ?? []) {
    if (p.role === "driver") aprovados.push(p);
    else if (p.cnh_number) candidatos.push(p);
  }

  let list: Row[] = [];
  if (filter === "candidatos") list = candidatos;
  else if (filter === "aprovados") list = aprovados;
  else list = [...candidatos, ...aprovados];

  const tabs: { value: Filter; label: string; count: number; tone?: string }[] = [
    { value: "candidatos", label: "Candidatos", count: candidatos.length, tone: "warn" },
    { value: "aprovados", label: "Aprovados", count: aprovados.length },
    { value: "todos", label: "Todos", count: candidatos.length + aprovados.length },
  ];

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Entregadores</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Aprove candidatos pra liberar o painel de entregador. Quem é aprovado pode ficar
          online e aceitar corridas. Pra revogar, suspende e o usuário volta a ser cliente.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const isActive = filter === t.value;
          const isWarn = t.tone === "warn" && t.count > 0;
          return (
            <Link
              key={t.value}
              href={`/super-admin/entregadores?filter=${t.value}`}
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

      {!list.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            {filter === "candidatos" ? <BadgeCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            {filter === "candidatos"
              ? "Nenhum candidato no momento. Quando alguém preencher cadastro de entregador, aparece aqui."
              : "Vazio."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((p) => {
            const v = (p.vehicle as { kind?: string; plate?: string; model?: string; color?: string } | null) ?? {};
            const isDriver = p.role === "driver";
            return (
              <li
                key={p.id}
                className={`rounded-2xl border bg-card p-4 ${
                  isDriver ? "border-border" : "border-[color:var(--sun)]/40"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {p.full_name ?? "—"}
                      {isDriver ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                          <BadgeCheck className="h-3 w-3" />
                          Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--sun)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--sun)]">
                          <Clock className="h-3 w-3" />
                          Candidato
                        </span>
                      )}
                      {p.is_online && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                          ● Online
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {p.whatsapp ?? "—"}
                      {p.cpf ? ` · CPF ${p.cpf}` : ""}
                    </p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs">
                      <Bike className="h-3 w-3 text-primary" />
                      {v.kind ? VEHICLE_LABEL[v.kind] ?? v.kind : "—"}
                      {v.model ? ` · ${v.model}` : ""}
                      {v.plate && v.plate !== "—" ? ` · ${v.plate}` : ""}
                    </p>
                    {p.cnh_number && (
                      <p className="text-xs">
                        <strong>CNH:</strong> {p.cnh_number}
                        {p.cnh_category ? ` (${p.cnh_category})` : ""}
                      </p>
                    )}
                    {p.pix_value && (
                      <p className="text-xs">
                        <strong>PIX ({p.pix_kind}):</strong> {p.pix_value}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    {!isDriver ? (
                      <form action={setDriverApprovedAdmin}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="approved" value="true" />
                        <Button type="submit" size="sm">
                          <BadgeCheck className="mr-2 h-3 w-3" />
                          Aprovar
                        </Button>
                      </form>
                    ) : (
                      <form action={setDriverApprovedAdmin}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="approved" value="false" />
                        <Button type="submit" size="sm" variant="outline">
                          Suspender
                        </Button>
                      </form>
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
