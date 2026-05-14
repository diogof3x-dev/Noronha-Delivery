import Link from "next/link";
import { getServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

export default async function SuperAdminLojas() {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("businesses")
    .select(
      "id, name, slug, type, district, is_active, is_verified, is_eco_certified, created_at, owner_id, profiles!businesses_owner_id_fkey(full_name, whatsapp)",
    )
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Lojas ({(data ?? []).length})
        </h1>
      </header>

      {!data?.length ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Nenhuma loja cadastrada ainda.
        </p>
      ) : (
        <ul className="space-y-2">
          {data.map((b) => {
            const owner = b.profiles as { full_name?: string; whatsapp?: string } | null;
            return (
              <li key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {b.name}
                    {b.is_eco_certified && (
                      <span className="rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-bold text-[color:var(--turtle)]">
                        Eco
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {b.type} · {b.district ?? "—"} ·{" "}
                    {owner?.full_name ?? "—"}
                    {owner?.whatsapp ? ` · ${owner.whatsapp}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    b.is_active
                      ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {b.is_active ? "Ativa" : "Pausada"}
                </span>
                {b.slug && (
                  <Link
                    href={`/app/restaurante/${b.slug}`}
                    target="_blank"
                    className="text-xs text-primary hover:underline"
                  >
                    Ver loja ↗
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
