import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import {
  PersonalForm,
  AddressForm,
  PixForm,
  PasswordForm,
} from "./forms";

export const dynamic = "force-dynamic";

export const metadata = { title: "Meu cadastro" };

type AddressData = {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
};

export default async function CadastroPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar?next=/parceiro/painel/cadastro");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, whatsapp, cpf, birth_date, district, address, pix_kind, pix_value, role")
    .eq("id", user.id)
    .maybeSingle();

  const address = (profile?.address as AddressData | null) ?? {};
  const providers = user.app_metadata?.providers as string[] | undefined;
  const hasPasswordAuth = providers?.includes("email") ?? false;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Conta
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Meu cadastro</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Mantém seus dados sempre atualizados — eles são usados pra emissão de nota, contato em
          caso de problema no pedido, e pagamento PIX dos seus saques.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Dados pessoais</h2>
            <p className="text-xs text-muted-foreground">
              Email <strong>{user.email}</strong> (não pode trocar — fale com suporte se precisar)
            </p>
          </header>
          <PersonalForm
            defaults={{
              full_name: profile?.full_name ?? "",
              whatsapp: profile?.whatsapp ?? "",
              cpf: profile?.cpf ?? "",
              birth_date: profile?.birth_date ?? "",
            }}
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Endereço</h2>
            <p className="text-xs text-muted-foreground">
              Pra entregas e correspondência oficial.
            </p>
          </header>
          <AddressForm
            defaults={{
              cep: address.cep ?? "",
              street: address.street ?? "",
              number: address.number ?? "",
              complement: address.complement ?? "",
              district: address.district ?? profile?.district ?? "",
              city: address.city ?? "Fernando de Noronha",
              state: address.state ?? "PE",
            }}
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Chave PIX</h2>
            <p className="text-xs text-muted-foreground">
              Pra receber seus saques após D+8 (janela legal de estorno).
            </p>
          </header>
          <PixForm
            defaults={{
              pix_kind: profile?.pix_kind ?? "cpf",
              pix_value: profile?.pix_value ?? "",
            }}
          />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5">
          <header className="mb-4">
            <h2 className="text-base font-semibold">Trocar senha</h2>
            <p className="text-xs text-muted-foreground">
              {hasPasswordAuth
                ? "Define uma nova senha pra próximo login por e-mail."
                : "Sua conta entra com Google. Você pode definir uma senha extra aqui se quiser."}
            </p>
          </header>
          <PasswordForm />
        </section>
      </div>
    </div>
  );
}
