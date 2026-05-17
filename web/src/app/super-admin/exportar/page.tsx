import { redirect } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";

export const dynamic = "force-dynamic";

export default async function ExportarPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/super-admin/exportar");
  const profile = await getProfile(user);
  if (profile?.role !== "admin") redirect("/");

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Super admin
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Exportar dados</h1>
        <p className="text-xs text-muted-foreground">
          CSV com filtros de data. Aceita Excel, Google Sheets e Python (pandas).
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <ExportCard
          title="Pedidos"
          description="Todos os pedidos com cliente, loja, valor, status, payment_method, datas."
          entity="orders"
          since={ninetyDaysAgo}
          until={today}
        />
        <ExportCard
          title="Lojas"
          description="businesses + dono + GMV total + ticket médio + taxas + último pedido."
          entity="businesses"
          since={ninetyDaysAgo}
          until={today}
          dateless
        />
        <ExportCard
          title="Clientes"
          description="profiles com role customer + total gasto + nº de pedidos."
          entity="customers"
          since={ninetyDaysAgo}
          until={today}
          dateless
        />
        <ExportCard
          title="Motoboys"
          description="profiles com role driver + entregas + último visto online."
          entity="drivers"
          since={ninetyDaysAgo}
          until={today}
          dateless
        />
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p>
          <strong>Privacidade:</strong> exportações ficam registradas no audit log.
          Não compartilhe arquivos com whatsapp, cpf ou pix sem necessidade. LGPD.
        </p>
      </section>
    </div>
  );
}

function ExportCard({
  title,
  description,
  entity,
  since,
  until,
  dateless,
}: {
  title: string;
  description: string;
  entity: string;
  since: string;
  until: string;
  dateless?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <p className="text-xs text-muted-foreground">{description}</p>
      <form
        method="get"
        action={`/api/super-admin/export/${entity}`}
        className="mt-3 space-y-2"
      >
        {!dateless && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                De
              </span>
              <input
                type="date"
                name="since"
                defaultValue={since}
                className="h-9 rounded-md border border-border bg-background px-2"
              />
            </label>
            <label className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Até
              </span>
              <input
                type="date"
                name="until"
                defaultValue={until}
                className="h-9 rounded-md border border-border bg-background px-2"
              />
            </label>
          </div>
        )}
        <button
          type="submit"
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-md bg-primary px-3 text-xs font-semibold text-primary-foreground hover:opacity-90"
        >
          <Download className="h-3.5 w-3.5" />
          Baixar CSV
        </button>
      </form>
    </div>
  );
}
