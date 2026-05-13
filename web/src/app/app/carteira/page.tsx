import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Banknote, Plus, Receipt, Wallet } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Carteira" };

export default async function CarteiraPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/carteira");

  const { data: account } = await supabase
    .from("wallet_accounts")
    .select("balance_cents")
    .eq("owner_id", user.id)
    .is("business_id", null)
    .maybeSingle();

  const { data: tx } = await supabase
    .from("wallet_transactions")
    .select("id, type, amount_cents, description, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const balance = account?.balance_cents ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Carteira</h1>
      </div>

      <section className="overflow-hidden rounded-2xl bg-ocean-grad p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Saldo Noronha
            </p>
            <p className="text-3xl font-bold tracking-tight">{formatCents(balance)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-white/85">
          Cashback acumulado nos pedidos pagos. Use no próximo pedido em qualquer
          estabelecimento.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button
          type="button"
          disabled
          className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 text-left disabled:opacity-60"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Plus className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Adicionar saldo</span>
            <span className="text-[10px] text-muted-foreground">Em breve</span>
          </span>
        </button>
        <Link
          href="/app/pedidos"
          className="flex items-center gap-2 rounded-2xl border border-border bg-card p-4 hover:border-primary/40"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Receipt className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">Meus pedidos</span>
            <span className="text-[10px] text-muted-foreground">Ver histórico</span>
          </span>
        </Link>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Movimentações
        </h2>
        {!tx?.length ? (
          <p className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Sem movimentação ainda. Quando você fizer um pedido pago, o cashback aparece
            aqui.
          </p>
        ) : (
          <ul className="space-y-2">
            {tx.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div className="flex items-center gap-3">
                  <Banknote className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t.description ?? t.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(t.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
                <span className={t.amount_cents >= 0 ? "font-bold text-[color:var(--turtle)]" : "font-bold"}>
                  {t.amount_cents >= 0 ? "+" : ""}
                  {formatCents(t.amount_cents)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
