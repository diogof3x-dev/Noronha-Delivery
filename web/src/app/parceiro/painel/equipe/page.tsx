import Link from "next/link";
import { redirect } from "next/navigation";
import { Crown, Mail, Users, UserMinus, UserCheck } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getAdminClient } from "@/lib/supabase/admin-client";
import { Button } from "@/components/ui/button";
import { InviteForm } from "./invite-form";
import { removeMember, updateMemberRole } from "@/app/actions/team";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  owner: "Dono",
  manager: "Gerente",
  staff: "Balcão",
};

const ROLE_DESC: Record<string, string> = {
  owner: "Acesso total à loja, inclusive financeiro",
  manager: "Gerencia cardápio, pedidos, promoções e equipe",
  staff: "Aceita e processa pedidos; sem financeiro nem cadastro",
};

export default async function PainelEquipe() {
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

  const { data: members } = await supabase
    .from("business_members")
    .select("id, user_id, invited_email, role, permissions, invited_at, joined_at")
    .eq("business_id", business.id)
    .is("removed_at", null)
    .order("created_at", { ascending: false });

  // hydrate names dos members com user_id
  const userIds = (members ?? [])
    .map((m) => m.user_id)
    .filter((x): x is string => !!x);
  const { data: profiles } = admin && userIds.length
    ? await admin.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Equipe
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          {business.name}
        </h1>
        <p className="text-xs text-muted-foreground">
          Convide gerentes e balcão pra ajudarem a atender os pedidos.
        </p>
      </header>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Mail className="h-4 w-4" />
          Convidar nova pessoa
        </h2>
        <InviteForm businessId={business.id} />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Membros
        </h2>

        <ul className="space-y-2">
          <li className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-sm font-bold">
                  <Crown className="h-4 w-4 text-[color:var(--sun)]" />
                  Você (Dono)
                </p>
                <p className="text-xs text-muted-foreground">
                  Acesso total — não pode ser removido
                </p>
              </div>
            </div>
          </li>

          {!members?.length ? (
            <li className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Ninguém ainda. Convide um gerente ou balcão acima.
            </li>
          ) : (
            members.map((m) => (
              <li key={m.id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-bold">
                      {m.user_id ? (
                        <>
                          <UserCheck className="h-4 w-4 text-[color:var(--turtle)]" />
                          {profileMap.get(m.user_id) ?? m.user_id.slice(0, 8)}
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {m.invited_email}
                        </>
                      )}
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] ${
                          m.role === "manager"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {ROLE_LABEL[m.role]}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {ROLE_DESC[m.role]}
                    </p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {m.joined_at
                        ? `Entrou em ${new Date(m.joined_at).toLocaleDateString("pt-BR")}`
                        : `Convidado em ${new Date(m.invited_at).toLocaleDateString("pt-BR")} · aguardando aceite`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <form action={updateMemberRole}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <input
                        type="hidden"
                        name="role"
                        value={m.role === "manager" ? "staff" : "manager"}
                      />
                      <Button size="sm" variant="outline" type="submit">
                        {m.role === "manager" ? "→ Balcão" : "→ Gerente"}
                      </Button>
                    </form>
                    <form action={removeMember}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="business_id" value={business.id} />
                      <Button size="sm" variant="outline" type="submit">
                        <UserMinus className="h-3 w-3" />
                      </Button>
                    </form>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Sobre os papéis</p>
        <ul className="mt-2 space-y-1">
          <li>
            <Users className="mr-1 inline h-3 w-3" />
            <strong>Gerente:</strong> edita cardápio, gerencia pedidos, cria promoções e
            convida balcão. <em>Não acessa financeiro nem cadastro da loja.</em>
          </li>
          <li>
            <Users className="mr-1 inline h-3 w-3" />
            <strong>Balcão:</strong> aceita, prepara e fecha pedidos. <em>Apenas operação
            do dia.</em>
          </li>
        </ul>
      </section>
    </div>
  );
}
