import { Banknote } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { formatCents } from "@/lib/format";
import { approveWithdrawal, rejectWithdrawal } from "@/app/actions/withdrawals";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  requested: "Aguardando",
  processing: "Processando",
  paid: "Pago",
  rejected: "Rejeitado",
};

export default async function SaquesPage() {
  const supabase = await getServerClient();

  const { data } = await supabase
    .from("withdrawal_requests")
    .select(
      "id, amount_cents, pix_key, pix_kind, status, rejection_reason, paid_at, created_at, business_id, requested_by, businesses(name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super Admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Saques solicitados
        </h1>
      </header>

      {!data?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Banknote className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhum saque solicitado</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Saques de lojistas e entregadores aparecem aqui pra aprovação ou rejeição.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {data.map((w) => (
            <li key={w.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {formatCents(w.amount_cents)} ·{" "}
                    <span className="text-xs text-muted-foreground">
                      {(w.businesses as { name?: string } | null)?.name ?? "—"}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS[w.status] ?? w.status} ·{" "}
                    {new Date(w.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 text-xs">
                    <strong>{w.pix_kind?.toUpperCase()}:</strong> {w.pix_key}
                  </p>
                  {w.rejection_reason && (
                    <p className="mt-1 text-xs text-destructive">{w.rejection_reason}</p>
                  )}
                </div>
                {w.status === "requested" && (
                  <div className="flex gap-2">
                    <form action={approveWithdrawal}>
                      <input type="hidden" name="id" value={w.id} />
                      <Button size="sm" type="submit">
                        Aprovar
                      </Button>
                    </form>
                    <form action={rejectWithdrawal} className="flex gap-1">
                      <input type="hidden" name="id" value={w.id} />
                      <input
                        name="reason"
                        placeholder="Motivo"
                        className="h-8 w-32 rounded-md border border-input bg-background px-2 text-xs"
                      />
                      <Button size="sm" variant="outline" type="submit">
                        Recusar
                      </Button>
                    </form>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
