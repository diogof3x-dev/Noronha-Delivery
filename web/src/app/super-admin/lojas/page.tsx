import Link from "next/link";
import { BadgeCheck, Clock, Leaf, ShieldAlert } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import {
  approveBusinessAdmin,
  setBusinessActiveAdmin,
  toggleEcoCertifiedAdmin,
  unapproveBusinessAdmin,
} from "@/app/actions/business-admin";

export const dynamic = "force-dynamic";

type Filter = "pendentes" | "ativas" | "pausadas" | "todas";

const PUBLIC_PATH: Record<string, string> = {
  restaurante: "/app/restaurante",
  mercado: "/app/restaurante",
  farmacia: "/app/restaurante",
  conveniencia: "/app/restaurante",
  loja: "/app/restaurante",
  pousada: "/app/pousada",
  residencia: "/app/casa",
  operador_passeio: "/app/passeio",
  locadora: "/app/aluguel",
  servico: "/app/servico",
};

const TYPE_LABEL: Record<string, string> = {
  restaurante: "Restaurante",
  mercado: "Mercado",
  farmacia: "Farmácia",
  conveniencia: "Conveniência",
  loja: "Loja",
  pousada: "Pousada",
  residencia: "Residência",
  operador_passeio: "Passeios",
  locadora: "Aluguel",
  servico: "Serviço",
  motorista: "Motorista",
};

export default async function SuperAdminLojas({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const filter: Filter = (params.filter as Filter) ?? "pendentes";

  const supabase = await getServerClient();
  let q = supabase
    .from("businesses")
    .select(
      "id, name, slug, type, district, is_active, is_verified, is_eco_certified, created_at, owner_id, profiles!businesses_owner_id_fkey(full_name, whatsapp)",
    )
    .order("created_at", { ascending: false });

  if (filter === "pendentes") {
    q = q.eq("is_verified", false);
  } else if (filter === "ativas") {
    q = q.eq("is_active", true).eq("is_verified", true);
  } else if (filter === "pausadas") {
    q = q.eq("is_active", false);
  }

  const { data } = await q;

  const [
    { count: pendingCount },
    { count: activeCount },
    { count: pausedCount },
    { count: totalCount },
  ] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_verified", false),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true).eq("is_verified", true),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", false),
    supabase.from("businesses").select("id", { count: "exact", head: true }),
  ]);

  const tabs: { value: Filter; label: string; count: number; tone?: string }[] = [
    { value: "pendentes", label: "Aguardando aprovação", count: pendingCount ?? 0, tone: "warn" },
    { value: "ativas", label: "Ativas", count: activeCount ?? 0 },
    { value: "pausadas", label: "Pausadas", count: pausedCount ?? 0 },
    { value: "todas", label: "Todas", count: totalCount ?? 0 },
  ];

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Lojas</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Aprove lojas pra liberar exibição pro público. Use o botão de Pausar pra suspender
          temporariamente sem deletar histórico.
        </p>
      </header>

      <nav className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((t) => {
          const isActive = filter === t.value;
          const isWarn = t.tone === "warn" && t.count > 0;
          return (
            <Link
              key={t.value}
              href={`/super-admin/lojas?filter=${t.value}`}
              className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
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
            {filter === "pendentes" ? <BadgeCheck className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            {filter === "pendentes"
              ? "Nenhuma loja aguardando aprovação. Tudo certo!"
              : "Nenhuma loja nesta categoria."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((b) => {
            const owner = b.profiles as { full_name?: string; whatsapp?: string } | null;
            const publicPath = PUBLIC_PATH[b.type];
            return (
              <li
                key={b.id}
                className={`rounded-2xl border bg-card p-4 ${
                  !b.is_verified ? "border-[color:var(--sun)]/40" : "border-border"
                }`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {b.name}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {TYPE_LABEL[b.type] ?? b.type}
                      </span>
                      {b.is_eco_certified && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                          <Leaf className="h-3 w-3" />
                          Eco
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {b.district ?? "—"}
                      {owner?.full_name ? ` · ${owner.full_name}` : ""}
                      {owner?.whatsapp ? ` · ${owner.whatsapp}` : ""}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Cadastrada em {new Date(b.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {b.is_verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                        <BadgeCheck className="h-3 w-3" />
                        Aprovada
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--sun)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--sun)]">
                        <Clock className="h-3 w-3" />
                        Aguardando
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        b.is_active
                          ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {b.is_active ? "Ativa" : "Pausada"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                  {!b.is_verified ? (
                    <form action={approveBusinessAdmin}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm">
                        <BadgeCheck className="mr-2 h-3 w-3" />
                        Aprovar loja
                      </Button>
                    </form>
                  ) : (
                    <form action={unapproveBusinessAdmin}>
                      <input type="hidden" name="id" value={b.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Suspender aprovação
                      </Button>
                    </form>
                  )}

                  <form action={setBusinessActiveAdmin}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="active" value={b.is_active ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="outline">
                      {b.is_active ? "Pausar" : "Reativar"}
                    </Button>
                  </form>

                  <form action={toggleEcoCertifiedAdmin}>
                    <input type="hidden" name="id" value={b.id} />
                    <input type="hidden" name="eco" value={b.is_eco_certified ? "false" : "true"} />
                    <Button type="submit" size="sm" variant="outline">
                      <Leaf className="mr-2 h-3 w-3" />
                      {b.is_eco_certified ? "Remover Eco" : "Marcar Eco"}
                    </Button>
                  </form>

                  {b.slug && publicPath && (
                    <Link
                      href={`${publicPath}/${b.slug}`}
                      target="_blank"
                      className="ml-auto text-xs text-primary hover:underline"
                    >
                      Ver loja ↗
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
