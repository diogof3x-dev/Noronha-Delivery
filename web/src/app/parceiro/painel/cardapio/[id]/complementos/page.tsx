import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile"
import { getMerchantScope } from "@/lib/merchant-scope";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCents } from "@/lib/format";
import {
  addOption,
  addOptionGroup,
  deleteOption,
  deleteOptionGroup,
} from "@/app/actions/service-options";

export const dynamic = "force-dynamic";
export const metadata = { title: "Complementos do item" };

type Props = { params: Promise<{ id: string }> };

export default async function ComplementosPage({ params }: Props) {
  const { id } = await params;
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/parceiro/entrar?next=/parceiro/painel/cardapio/${id}/complementos`);

  const profile = await getProfile(user);
  const scope = await getMerchantScope(supabase, user.id, profile);
  const isAdmin = scope.showAll;

  const { data: service } = await supabase
    .from("services")
    .select("id, name, price_cents, business_id, businesses(owner_id, name)")
    .eq("id", id)
    .maybeSingle();

  if (!service) notFound();

  const ownerId = (service.businesses as { owner_id?: string } | null)?.owner_id;
  if (!isAdmin && ownerId !== user.id) {
    return (
      <div className="p-6">
        <p className="text-sm text-destructive">Sem permissão pra editar este item.</p>
      </div>
    );
  }

  const { data: groups } = await supabase
    .from("service_option_groups")
    .select("id, name, kind, min_choices, max_choices, position")
    .eq("service_id", id)
    .order("position");

  type OptionRow = {
    id: string;
    group_id: string;
    name: string;
    price_delta_cents: number;
    position: number;
    is_active: boolean;
  };

  const groupIds = (groups ?? []).map((g) => g.id);
  const optionsRes = groupIds.length
    ? await supabase
        .from("service_options")
        .select("id, group_id, name, price_delta_cents, position, is_active")
        .in("group_id", groupIds)
        .order("position")
    : { data: [] as OptionRow[] };
  const options = (optionsRes.data ?? []) as OptionRow[];

  const byGroup = new Map<string, OptionRow[]>();
  for (const o of options) {
    if (!byGroup.has(o.group_id)) byGroup.set(o.group_id, []);
    byGroup.get(o.group_id)!.push(o);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/parceiro/painel/cardapio"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro cardápio
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Complementos
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">{service.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Item base {formatCents(service.price_cents)} · adicione grupos de escolha (talher,
          acompanhamento, bebida, adicional). Cada opção pode adicionar valor ao total.
        </p>
      </div>

      <section className="space-y-4">
        {(groups ?? []).length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Sem grupos ainda. Crie um abaixo (ex: <strong>Talher</strong> obrigatório, ou
            <strong> Adicional</strong> opcional).
          </div>
        )}

        {(groups ?? []).map((g) => {
          const opts = byGroup.get(g.id) ?? [];
          return (
            <article key={g.id} className="rounded-2xl border border-border bg-card p-4">
              <header className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">
                    {g.name}
                    <span
                      className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        g.kind === "required"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {g.kind === "required" ? "OBRIGATÓRIO" : "OPCIONAL"}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {g.kind === "required"
                      ? `Escolha de ${g.min_choices} até ${g.max_choices}`
                      : `Até ${g.max_choices} opções`}
                  </p>
                </div>
                <form action={deleteOptionGroup}>
                  <input type="hidden" name="id" value={g.id} />
                  <button
                    type="submit"
                    aria-label="Excluir grupo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </form>
              </header>

              <ul className="mt-3 space-y-1.5">
                {opts.map((o) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    <span>{o.name}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {o.price_delta_cents === 0
                          ? "sem custo extra"
                          : `+${formatCents(o.price_delta_cents)}`}
                      </span>
                      <form action={deleteOption}>
                        <input type="hidden" name="id" value={o.id} />
                        <button
                          type="submit"
                          aria-label="Remover opção"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </form>
                    </span>
                  </li>
                ))}
                {opts.length === 0 && (
                  <li className="text-xs text-muted-foreground">Sem opções neste grupo ainda.</li>
                )}
              </ul>

              <form action={addOption} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="group_id" value={g.id} />
                <div className="grid flex-1 gap-1 min-w-40">
                  <Label htmlFor={`opt-name-${g.id}`} className="text-xs">
                    Nova opção
                  </Label>
                  <Input
                    id={`opt-name-${g.id}`}
                    name="name"
                    required
                    maxLength={120}
                    placeholder="Ex: Coca-Cola Lata"
                    className="h-8"
                  />
                </div>
                <div className="grid gap-1 w-28">
                  <Label htmlFor={`opt-delta-${g.id}`} className="text-xs">
                    +R$
                  </Label>
                  <Input
                    id={`opt-delta-${g.id}`}
                    name="price_delta_brl"
                    inputMode="decimal"
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
                <Button type="submit" size="sm" className="h-8">
                  Adicionar
                </Button>
              </form>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-base font-semibold">Novo grupo</h2>
        <p className="text-xs text-muted-foreground">
          Ex: Talher (obrigatório, escolha 1), Acompanhamento (obrigatório, escolha 2),
          Adicional (opcional, até 4).
        </p>
        <form action={addOptionGroup} className="mt-3 grid gap-3 sm:grid-cols-5">
          <input type="hidden" name="service_id" value={service.id} />
          <div className="sm:col-span-2 grid gap-1.5">
            <Label htmlFor="group_name">Nome</Label>
            <Input id="group_name" name="name" required maxLength={80} placeholder="Talher, Acompanhamento, Bebida..." />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="group_kind">Tipo</Label>
            <select
              id="group_kind"
              name="kind"
              defaultValue="optional"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="optional">Opcional</option>
              <option value="required">Obrigatório</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="group_min">Mínimo</Label>
            <Input id="group_min" name="min_choices" type="number" min={0} max={20} defaultValue={0} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="group_max">Máximo</Label>
            <Input id="group_max" name="max_choices" type="number" min={1} max={20} defaultValue={1} />
          </div>
          <div className="sm:col-span-5">
            <Button type="submit">Criar grupo</Button>
          </div>
        </form>
      </section>
    </div>
  );
}
