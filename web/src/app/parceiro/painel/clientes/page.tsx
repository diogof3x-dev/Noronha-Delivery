import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Calendar,
  Clock,
  MessageCircle,
  Send,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { formatCents } from "@/lib/format";
import { Stat } from "@/components/dashboard/cards";
import { PushCampaignForm } from "./push-campaign-form";

export const dynamic = "force-dynamic";

const DOW_LABEL = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function PainelClientes() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar");

  const { data: businesses } = await supabase
    .from("businesses")
    .select("id, name")
    .eq("owner_id", user.id);

  if (!businesses?.length) {
    return (
      <div className="p-8 text-sm text-muted-foreground">
        Cadastre uma loja em{" "}
        <Link href="/parceiro/painel/loja" className="text-primary underline">
          Minha loja
        </Link>{" "}
        primeiro.
      </div>
    );
  }

  const business = businesses[0];
  const admin = getAdminClient();
  if (!admin)
    return (
      <div className="p-8 text-sm text-destructive">Service role não configurado</div>
    );

  const [{ data: stats }, { data: credits }, { data: campaigns }] = await Promise.all([
    admin
      .from("mv_business_customer_stats")
      .select("*")
      .eq("business_id", business.id)
      .gt("paid_orders_count", 0)
      .order("total_spent_cents", { ascending: false })
      .limit(50),
    admin
      .from("business_push_credits")
      .select("*")
      .eq("business_id", business.id)
      .maybeSingle(),
    admin
      .from("business_push_campaigns")
      .select(
        "id, title, body, target_count, sent_count, created_at, sent_at, status",
      )
      .eq("business_id", business.id)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const customerIds = (stats ?? []).map((s) => s.customer_id);
  const [{ data: profiles }, { data: favorites }, { data: pushSubs }] =
    await Promise.all([
      customerIds.length
        ? admin
            .from("profiles")
            .select("id, full_name, whatsapp, district, is_resident")
            .in("id", customerIds)
        : { data: [] },
      customerIds.length
        ? admin
            .from("mv_business_customer_favorites")
            .select("*")
            .eq("business_id", business.id)
            .in("customer_id", customerIds)
            .order("qty_total", { ascending: false })
        : { data: [] },
      customerIds.length
        ? admin
            .from("push_subscriptions")
            .select("user_id")
            .in("user_id", customerIds)
            .is("failed_at", null)
        : { data: [] },
    ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const favoritesByCust = new Map<string, Array<{ name: string; qty: number }>>();
  for (const f of favorites ?? []) {
    const list = favoritesByCust.get(f.customer_id) ?? [];
    if (list.length < 3) {
      list.push({ name: f.name_snapshot, qty: Number(f.qty_total) });
    }
    favoritesByCust.set(f.customer_id, list);
  }
  const pushSubMap = new Set((pushSubs ?? []).map((s) => s.user_id));

  // KPIs gerais
  const totalCustomers = (stats ?? []).length;
  const totalSpent = (stats ?? []).reduce(
    (sum, s) => sum + Number(s.total_spent_cents),
    0,
  );
  const avgTicket = totalCustomers
    ? Math.round(totalSpent / (stats ?? []).reduce((s, c) => s + c.paid_orders_count, 0))
    : 0;
  const totalRecurring = (stats ?? []).filter((s) => s.paid_orders_count > 1).length;
  const reachable = (stats ?? []).filter((s) => pushSubMap.has(s.customer_id)).length;

  const freeRemaining = credits?.free_remaining ?? 500;
  const paidBalance = credits?.paid_balance ?? 0;
  const totalCredits = freeRemaining + paidBalance;
  const totalUsed = credits?.total_used ?? 0;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Seus clientes
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {business.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Quem mais pediu, o que mais pediram, quando pediram. Dispare push pra trazer eles
          de volta.
        </p>
      </header>

      {/* KPIs */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Users} label="Clientes únicos" value={String(totalCustomers)} />
        <Stat
          icon={Star}
          label="Recorrentes (2+)"
          value={`${totalRecurring} (${
            totalCustomers ? Math.round((totalRecurring / totalCustomers) * 100) : 0
          }%)`}
        />
        <Stat icon={Sparkles} label="Ticket médio" value={formatCents(avgTicket)} />
        <Stat
          icon={MessageCircle}
          label="Alcançáveis por push"
          value={`${reachable} (${
            totalCustomers ? Math.round((reachable / totalCustomers) * 100) : 0
          }%)`}
        />
      </section>

      {/* PUSH MARKETING */}
      <section className="rounded-2xl border-2 border-[color:var(--sun)]/40 bg-[color:var(--sun)]/5 p-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em]">
              <Send className="h-4 w-4 text-[color:var(--sun)]" />
              Push pros seus clientes
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Notificação direta no celular dos seus clientes. Sem taxa de WhatsApp, sem
              espera, sem app de terceiro.
            </p>
          </div>
          <div className="rounded-xl border border-[color:var(--sun)]/40 bg-background px-3 py-2 text-right">
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Créditos
            </p>
            <p className="text-lg font-bold leading-none">
              {totalCredits.toLocaleString("pt-BR")}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {freeRemaining > 0
                ? `${freeRemaining} grátis · ${paidBalance} pagos`
                : "todos pagos"}
              {totalUsed > 0 ? ` · ${totalUsed} usados` : ""}
            </p>
          </div>
        </header>

        <div className="mt-4">
          <PushCampaignForm
            businessId={business.id}
            totalCredits={totalCredits}
            customerStats={{
              all: totalCustomers,
              vip: Math.min(50, totalCustomers),
              recurring: totalRecurring,
              reachable,
            }}
          />
        </div>

        {totalCredits < 100 && (
          <div className="mt-3 rounded-lg border border-[color:var(--sun)]/40 bg-background p-3 text-xs">
            <p className="font-semibold">Créditos acabando</p>
            <p className="text-muted-foreground">
              Em breve você poderá comprar pacotes de créditos. Por enquanto fale com a F3X
              pra aumentar sua cota.
            </p>
          </div>
        )}
      </section>

      {(campaigns?.length ?? 0) > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Últimas campanhas
          </h2>
          <ul className="space-y-2">
            {campaigns!.map((c) => (
              <li
                key={c.id}
                className="rounded-2xl border border-border bg-card p-3 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {c.body}
                    </p>
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      c.status === "sent"
                        ? "bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]"
                        : c.status === "failed"
                          ? "bg-destructive/15 text-destructive"
                          : "bg-[color:var(--sun)]/15 text-[color:var(--sun)]"
                    }`}
                  >
                    {c.status === "sent"
                      ? `${c.sent_count}/${c.target_count} enviados`
                      : c.status}
                  </span>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pt-BR")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* RANKING DE CLIENTES */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Top {Math.min(50, totalCustomers)} clientes da sua loja
        </h2>
        {!stats?.length ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Sem clientes pagantes ainda. Quando o primeiro pedido for pago, ele aparece aqui.
          </div>
        ) : (
          <ul className="space-y-2">
            {stats.map((s, i) => {
              const profile = profileMap.get(s.customer_id);
              const favs = favoritesByCust.get(s.customer_id) ?? [];
              const reachableByPush = pushSubMap.has(s.customer_id);
              const daysSinceLast = Math.round(
                (Date.now() - new Date(s.last_order_at).getTime()) /
                  (24 * 3600 * 1000),
              );
              return (
                <li
                  key={s.customer_id}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[10px] font-bold">
                          {i + 1}
                        </span>
                        {profile?.full_name ?? s.customer_id.slice(0, 8)}
                        {reachableByPush && (
                          <span className="rounded-full bg-[color:var(--turtle)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--turtle)]">
                            push ok
                          </span>
                        )}
                        {profile?.is_resident && (
                          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            residente
                          </span>
                        )}
                        {s.paid_orders_count >= 5 && (
                          <span className="rounded-full bg-[color:var(--sun)]/15 px-2 py-0.5 text-[10px] font-semibold text-[color:var(--sun)]">
                            VIP
                          </span>
                        )}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {profile?.whatsapp ?? "—"}
                        {profile?.district ? ` · ${profile.district}` : ""}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        <span>
                          <strong className="text-foreground">
                            {s.paid_orders_count}
                          </strong>{" "}
                          pedido{s.paid_orders_count === 1 ? "" : "s"}
                        </span>
                        <span>
                          gastou{" "}
                          <strong className="text-foreground">
                            {formatCents(Number(s.total_spent_cents))}
                          </strong>
                        </span>
                        <span>
                          ticket{" "}
                          <strong className="text-foreground">
                            {formatCents(Number(s.avg_ticket_cents))}
                          </strong>
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                        {s.favorite_hour != null && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            costuma pedir <strong>{s.favorite_hour}h</strong>
                          </span>
                        )}
                        {s.favorite_dow != null && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <strong>{DOW_LABEL[s.favorite_dow]}</strong>
                          </span>
                        )}
                        <span>
                          último pedido há <strong>{daysSinceLast}d</strong>
                        </span>
                      </div>
                      {favs.length > 0 && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          ❤️ Favoritos:{" "}
                          {favs
                            .map((f) => `${f.qty}× ${f.name}`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                    {profile?.whatsapp && (
                      <a
                        href={`https://wa.me/55${profile.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/5 px-3 py-1.5 text-xs font-semibold text-[color:var(--turtle)] hover:bg-[color:var(--turtle)]/10"
                      >
                        <MessageCircle className="h-3 w-3" />
                        WhatsApp
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Como funciona o push direcionado</p>
        <p className="mt-1">
          Você começa com <strong>500 disparos grátis</strong>. Cada cliente alcançado
          consome 1 crédito. Quando acabar, fale com a F3X pra comprar pacote (em breve
          autosserviço). Clientes que <em>desinstalaram o app</em> ou{" "}
          <em>negaram permissão</em> não consomem crédito.
        </p>
      </section>
    </div>
  );
}

