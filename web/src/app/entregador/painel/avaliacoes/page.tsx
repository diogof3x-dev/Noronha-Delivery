import { redirect } from "next/navigation";
import { Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

export default async function EntregadorAvaliacoes() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entregador/entrar");

  const { data: ratings } = await supabase
    .from("ratings")
    .select("id, stars, comment, tags, created_at")
    .eq("rated_entity", "driver")
    .eq("rated_entity_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Avaliações
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          O que os clientes acham
        </h1>
      </header>

      {!ratings?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--sun)]/15 text-[color:var(--sun)]">
            <Star className="h-6 w-6 fill-current" />
          </span>
          <h2 className="text-lg font-semibold">Sem avaliações ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Cada cliente avalia a entrega (pontualidade, educação, conhecimento da ilha).
            Notas altas te sobem no ranking de prioridade pra próximos pedidos.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {ratings.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-sm font-bold">
                  <Star className="h-4 w-4 fill-[color:var(--sun)] text-[color:var(--sun)]" />
                  {r.stars}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {r.tags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {r.tags.map((t: string) => (
                    <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px]">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
