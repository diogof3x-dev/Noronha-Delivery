import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { getProfile } from "@/lib/profile";
import { OrderCard, type MerchantOrder } from "./order-card";
import { RealtimeOrdersListener } from "./realtime-listener";
import { PushPrompt } from "@/components/push/push-prompt";

export const dynamic = "force-dynamic";

const SECTION_TITLES: Record<string, string> = {
  pending: "Aguardando você aceitar",
  confirmed: "Recebidos",
  preparing: "Em preparo",
  ready: "Prontos pra retirada",
  in_transit: "Saíram pra entrega",
};
const SECTION_ORDER = ["pending", "confirmed", "preparing", "ready", "in_transit"];

export default async function PainelPedidos() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");
  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase.from("businesses").select("id, name");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;
  const bizMap = new Map((businesses ?? []).map((b) => [b.id, b.name]));
  const bizIds = (businesses ?? []).map((b) => b.id);

  let query = supabase
    .from("orders")
    .select(
      "id, code, status, total_cents, created_at, business_id, customer_id, destination_kind, destination_label, destination_notes, payment_method, payment_status, delivery_code, order_items(name_snapshot, quantity)",
    )
    .order("created_at", { ascending: false })
    .limit(80);
  if (!isAdmin && bizIds.length) query = query.in("business_id", bizIds);

  const { data: orders } = await query;

  const customerIds = Array.from(
    new Set((orders ?? []).map((o) => o.customer_id).filter((x): x is string => Boolean(x))),
  );
  const customerMap = new Map<string, { name: string | null; whatsapp: string | null }>();
  if (customerIds.length) {
    const admin = getAdminClient();
    if (admin) {
      const { data: customers } = await admin
        .from("profiles")
        .select("id, full_name, whatsapp")
        .in("id", customerIds);
      for (const c of customers ?? []) {
        customerMap.set(c.id, { name: c.full_name, whatsapp: c.whatsapp });
      }
    }
  }

  const items: MerchantOrder[] = (orders ?? []).map((o) => {
    const cust = o.customer_id ? customerMap.get(o.customer_id) : undefined;
    return {
      id: o.id,
      code: o.code,
      status: o.status,
      total_cents: o.total_cents,
      created_at: o.created_at,
      destination_kind: o.destination_kind,
      destination_label: o.destination_label,
      destination_notes: o.destination_notes,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      delivery_code: o.delivery_code,
      business_name: bizMap.get(o.business_id),
      customer_name: cust?.name ?? null,
      customer_whatsapp: cust?.whatsapp ?? null,
      items: ((o.order_items as { name_snapshot: string; quantity: number }[] | null) ?? []).map(
        (i) => ({ name_snapshot: i.name_snapshot, quantity: i.quantity }),
      ),
    };
  });

  const grouped = new Map<string, MerchantOrder[]>();
  for (const o of items) {
    if (!grouped.has(o.status)) grouped.set(o.status, []);
    grouped.get(o.status)!.push(o);
  }
  const finalized = items.filter((o) =>
    ["delivered", "completed", "cancelled", "refunded"].includes(o.status),
  );

  return (
    <div className="space-y-6 p-4 md:p-8">
      <PushPrompt context="parceiro" />
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Pedidos
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {isAdmin ? "Todos os pedidos" : "Seus pedidos"}
          </h1>
        </div>
        <RealtimeOrdersListener businessIds={bizIds} />
      </header>

      {!items.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </span>
          <h2 className="text-lg font-semibold">Nenhum pedido ainda</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Pedidos chegam aqui em tempo real com sinal sonoro. Mantenha esta aba aberta.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {SECTION_ORDER.map((s) => {
            const list = grouped.get(s) ?? [];
            if (!list.length) return null;
            return (
              <section key={s} className="space-y-2">
                <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  {SECTION_TITLES[s]} · {list.length}
                </h2>
                <ul className="space-y-2">
                  {list.map((o) => (
                    <OrderCard key={o.id} order={o} showBusiness={isAdmin} />
                  ))}
                </ul>
              </section>
            );
          })}

          {finalized.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Finalizados recentes
              </h2>
              <ul className="space-y-2 opacity-70">
                {finalized.slice(0, 10).map((o) => (
                  <OrderCard key={o.id} order={o} showBusiness={isAdmin} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
