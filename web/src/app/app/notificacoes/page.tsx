import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Bell, CheckCircle2, Clock, Package, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Notificações" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado pelo estabelecimento",
  preparing: "Em preparo",
  ready: "Pronto pra coleta",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

function statusIcon(status: string) {
  if (status === "delivered" || status === "completed") return CheckCircle2;
  if (status === "cancelled" || status === "refunded") return Bell;
  if (status === "in_transit") return Package;
  return Clock;
}

function statusTone(status: string) {
  if (status === "delivered" || status === "completed") return "text-[color:var(--turtle)]";
  if (status === "cancelled" || status === "refunded") return "text-destructive";
  if (status === "in_transit") return "text-primary";
  return "text-muted-foreground";
}

export default async function NotificacoesPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/notificacoes");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, code, status, total_cents, created_at, payment_status, businesses(name)",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/app"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-bold tracking-tight">Notificações</h1>
      </div>

      {!orders?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Bell className="h-5 w-5" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            Sem novidades por aqui. Quando você fizer um pedido ou reserva, as
            atualizações aparecem aqui.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => {
            const biz = o.businesses as { name?: string } | null;
            const Icon = statusIcon(o.status);
            const tone = statusTone(o.status);
            const showRate = ["delivered", "completed"].includes(o.status);
            return (
              <li key={o.id}>
                <Link
                  href={`/app/pedidos/${o.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3 hover:border-primary/40"
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary ${tone}`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      #{o.code} · {biz?.name ?? "Pedido"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {STATUS_LABEL[o.status] ?? o.status} ·{" "}
                      {new Date(o.created_at).toLocaleString("pt-BR")}
                    </p>
                    {showRate && (
                      <p className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[color:var(--sun)]">
                        <Star className="h-3 w-3 fill-[color:var(--sun)]" /> Avalie sua
                        experiência
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 text-sm font-bold">
                    {formatCents(o.total_cents)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
