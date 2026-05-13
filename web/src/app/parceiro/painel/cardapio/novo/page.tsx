import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { NovoCardapioTabs } from "./novo-cardapio-tabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Novo item no cardápio" };

export default async function NovoCardapioPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/parceiro/entrar?next=/parceiro/painel/cardapio/novo");

  const profile = await getProfile(user);
  const isAdmin = profile?.role === "admin";

  let bizQuery = supabase.from("businesses").select("id, name, type").order("name");
  if (!isAdmin) bizQuery = bizQuery.eq("owner_id", user.id);
  const { data: businesses } = await bizQuery;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div>
        <Link
          href="/parceiro/painel/cardapio"
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro cardápio
        </Link>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Cardápio
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
          Adicionar itens ao cardápio
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          3 jeitos pra subir o catálogo: um por vez, vários de uma vez colando texto, ou
          importando direto do seu iFood / 99 / site próprio.
        </p>
      </div>

      {!businesses?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <h2 className="text-lg font-semibold">Nenhuma loja vinculada</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Fale com o suporte pelo WhatsApp pra criar sua loja primeiro.
          </p>
        </div>
      ) : (
        <NovoCardapioTabs businesses={businesses} />
      )}
    </div>
  );
}
