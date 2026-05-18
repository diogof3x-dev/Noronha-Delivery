import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Home, MapPin, Plus, Sailboat, TreePalm, Wind } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { Button } from "@/components/ui/button";
import { AddressFormCard } from "./address-form";
import { deleteCustomerAddress, setDefaultAddress } from "@/app/actions/customer-addresses";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  pousada: Wind,
  praia: TreePalm,
  barco: Sailboat,
  casa: Home,
  outro: MapPin,
};

const KIND_LABEL: Record<string, string> = {
  pousada: "Pousada",
  praia: "Praia",
  barco: "Barco",
  casa: "Casa",
  outro: "Outro",
};

export default async function EnderecosPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/app/perfil/enderecos");

  const { data: addresses } = await supabase
    .from("customer_addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Link
          href="/app/perfil"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Voltar"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Perfil
          </p>
          <h1 className="text-base font-bold tracking-tight">Meus endereços</h1>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Salve endereços que você usa com frequência. No checkout, eles aparecem prontos
        pra um toque só.
      </p>

      <AddressFormCard />

      {!addresses?.length ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum endereço salvo ainda. Adicione aí em cima.
        </div>
      ) : (
        <ul className="space-y-2">
          {addresses.map((a) => {
            const Icon = KIND_ICON[a.kind] ?? MapPin;
            return (
              <li
                key={a.id}
                className={`rounded-2xl border bg-card p-4 ${
                  a.is_default ? "border-primary/40 bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                      {a.label}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                        {KIND_LABEL[a.kind] ?? a.kind}
                      </span>
                      {a.is_default && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          padrão
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{a.address}</p>
                    {a.notes && (
                      <p className="mt-1 text-[11px] italic text-muted-foreground">
                        &quot;{a.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <AddressFormCard initial={a} compact />
                  {!a.is_default && (
                    <form
                      action={async (fd) => {
                        "use server";
                        await setDefaultAddress(fd);
                      }}
                    >
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Tornar padrão
                      </Button>
                    </form>
                  )}
                  <form
                    action={async (fd) => {
                      "use server";
                      await deleteCustomerAddress(fd);
                    }}
                  >
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Excluir
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
