import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Pronto",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluído",
  cancelled: "Cancelado",
  refunded: "Estornado",
};

export default async function PainelPedidos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id);

  let query = supabase
    .from("orders")
    .select("id, code, status, total_cents, created_at, business_id, businesses(name)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (!isAdmin && businesses?.length) {
    query = query.in("business_id", businesses.map((b) => b.id));
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Pedidos
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {isAdmin ? "Todos os pedidos" : "Seus pedidos"}
        </h1>
      </header>

      {!orders?.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhum pedido ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Quando alguém pedir, os pedidos aparecem aqui em tempo real. Em breve com som
            de alerta e mapa do entregador.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  #{o.code}
                  {isAdmin && (o.businesses as { name?: string } | null)?.name && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      · {(o.businesses as { name: string }).name}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {STATUS_LABEL[o.status] ?? o.status} ·{" "}
                  {new Date(o.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <span className="font-bold">{formatCents(o.total_cents)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
