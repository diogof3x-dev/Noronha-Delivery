import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Receipt } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/format";

export const metadata = { title: "Pedidos" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto pra retirada",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
};

export default async function PedidosPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/pedidos");

  const { data: orders } = await supabase
    .from("orders")
    .select("id, code, status, total_cents, created_at, business_id, businesses(name)")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

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
        <h1 className="text-lg font-bold tracking-tight">Meus pedidos</h1>
      </div>

      {!orders?.length ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Receipt className="h-6 w-6" />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Nenhum pedido ainda</h2>
            <p className="text-sm text-muted-foreground">
              Quando você fizer seu primeiro pedido, ele aparece aqui pra você acompanhar.
            </p>
          </div>
          <Link
            href="/app/comida"
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            Explorar restaurantes
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const businessName = (o.businesses as { name?: string } | null)?.name ?? "Estabelecimento";
            return (
              <li key={o.id}>
                <Link
                  href={`/app/pedidos/${o.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
                >
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{businessName}</p>
                    <p className="text-xs text-muted-foreground">
                      #{o.code} · {STATUS_LABEL[o.status] ?? o.status}
                    </p>
                  </div>
                  <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
