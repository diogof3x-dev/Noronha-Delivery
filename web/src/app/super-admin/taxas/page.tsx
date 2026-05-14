import { Trash2 } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toggleCampaign, deleteCampaign } from "@/app/actions/take-rate";
import { SettingsForm } from "./settings-form";
import { CampaignForm } from "./campaign-form";

export const dynamic = "force-dynamic";

export default async function SuperAdminTaxas() {
  const supabase = await getServerClient();

  const [{ data: settings }, { data: campaigns }] = await Promise.all([
    supabase.from("platform_settings").select("default_take_rate_bps, d_plus_days, updated_at").eq("id", 1).maybeSingle(),
    supabase
      .from("take_rate_campaigns")
      .select("id, name, take_rate_bps, starts_at, ends_at, applies_to, applies_id, priority, is_active, notes, created_at")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-8 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Taxas e campanhas
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          A taxa padrão é cobrada de todas as transações. As campanhas sobrescrevem a taxa
          por loja, categoria ou globalmente, com prioridade configurável.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <SettingsForm
          defaults={{
            default_take_rate_pct: ((settings?.default_take_rate_bps ?? 1000) / 100).toFixed(2),
            d_plus_days: String(settings?.d_plus_days ?? 8),
          }}
        />
        <CampaignForm />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Campanhas ({(campaigns ?? []).length})
        </h2>
        {!campaigns?.length ? (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem campanhas. Crie uma acima para sobrescrever a taxa padrão.
          </p>
        ) : (
          <ul className="space-y-2">
            {campaigns.map((c) => (
              <li
                key={c.id}
                className={`flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 ${
                  !c.is_active ? "opacity-60" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    {c.name}
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      {(c.take_rate_bps / 100).toFixed(2)}%
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      P{c.priority ?? 100}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {c.applies_to === "all"
                      ? "Aplica a tudo"
                      : c.applies_to === "business"
                        ? `Loja ${c.applies_id?.slice(0, 8) ?? "—"}`
                        : `Categoria ${c.applies_id}`}
                    {" · "}
                    {c.starts_at ? new Date(c.starts_at).toLocaleDateString("pt-BR") : "agora"} →{" "}
                    {c.ends_at ? new Date(c.ends_at).toLocaleDateString("pt-BR") : "sem fim"}
                  </p>
                  {c.notes && <p className="mt-1 text-xs">{c.notes}</p>}
                </div>
                <form action={toggleCampaign}>
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="is_active" value={c.is_active ? "false" : "true"} />
                  <Button variant="outline" size="sm" type="submit" className="h-8">
                    {c.is_active ? "Pausar" : "Ativar"}
                  </Button>
                </form>
                <form action={deleteCampaign}>
                  <input type="hidden" name="id" value={c.id} />
                  <button
                    type="submit"
                    aria-label="Excluir"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export { SettingsForm as _S, CampaignForm as _C, Input as _I, Label as _L, Textarea as _T };
