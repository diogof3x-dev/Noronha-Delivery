import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Receipt, Star } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";
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

const STATUS_TONE: Record<string, string> = {
  pending: "text-[color:var(--sun)]",
  confirmed: "text-primary",
  preparing: "text-primary",
  ready: "text-primary",
  in_transit: "text-primary",
  delivered: "text-[color:var(--turtle)]",
  completed: "text-[color:var(--turtle)]",
  cancelled: "text-destructive",
  refunded: "text-destructive",
};

export default async function PedidosPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/pedidos");

  const { data: orders } = await supabase
    .from("orders")
    .select(
      "id, code, status, total_cents, created_at, business_id, businesses(name), driver_id",
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  // pedidos já avaliados
  const orderIds = (orders ?? []).map((o) => o.id);
  const { data: ratings } = orderIds.length
    ? await supabase
        .from("ratings")
        .select("order_id")
        .in("order_id", orderIds)
        .eq("rated_by", user.id)
    : { data: [] };
  const rated = new Set((ratings ?? []).map((r) => r.order_id));

  const ativos = (orders ?? []).filter(
    (o) => !["delivered", "completed", "cancelled", "refunded"].includes(o.status),
  );
  const aguardandoAvaliacao = (orders ?? []).filter(
    (o) => ["delivered", "completed"].includes(o.status) && !rated.has(o.id),
  );
  const finalizados = (orders ?? []).filter(
    (o) =>
      ["delivered", "completed", "cancelled", "refunded"].includes(o.status) &&
      !aguardandoAvaliacao.find((a) => a.id === o.id),
  );

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
          <Link href="/app/comida" className={cn(buttonVariants(), "h-10 px-4")}>
            Explorar restaurantes
          </Link>
        </div>
      ) : (
        <>
          {aguardandoAvaliacao.length > 0 && (
            <Section title="Aguardando sua avaliação" badge={`${aguardandoAvaliacao.length}`}>
              <ul className="space-y-2">
                {aguardandoAvaliacao.map((o) => (
                  <li key={o.id}>
                    <Link
                      href={`/app/pedidos/${o.id}`}
                      className="flex items-center gap-3 rounded-2xl border border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-4 transition-colors hover:bg-[color:var(--sun)]/10"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--sun)]/15 text-[color:var(--sun)]">
                        <Star className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {(o.businesses as { name?: string } | null)?.name ?? "Estabelecimento"}
                        </p>
                        <p className="text-xs text-[color:var(--sun)]">
                          Toque pra avaliar — leva 5 segundos
                        </p>
                      </div>
                      <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {ativos.length > 0 && (
            <Section title="Em andamento" badge={`${ativos.length}`}>
              <OrderList orders={ativos} />
            </Section>
          )}

          {finalizados.length > 0 && (
            <Section title="Finalizados" badge={`${finalizados.length}`}>
              <OrderList orders={finalizados} />
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {title}
        <span className="rounded-full bg-secondary px-1.5 text-[10px]">{badge}</span>
      </h2>
      {children}
    </section>
  );
}

function OrderList({
  orders,
}: {
  orders: {
    id: string;
    code: string;
    status: string;
    total_cents: number;
    businesses: { name?: string } | null;
  }[];
}) {
  return (
    <ul className="space-y-2">
      {orders.map((o) => {
        const businessName = o.businesses?.name ?? "Estabelecimento";
        return (
          <li key={o.id}>
            <Link
              href={`/app/pedidos/${o.id}`}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex-1">
                <p className="text-sm font-semibold">{businessName}</p>
                <p className="text-xs">
                  <span className="text-muted-foreground">#{o.code} · </span>
                  <span className={STATUS_TONE[o.status]}>
                    {STATUS_LABEL[o.status] ?? o.status}
                  </span>
                </p>
              </div>
              <span className="text-sm font-bold">{formatCents(o.total_cents)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
