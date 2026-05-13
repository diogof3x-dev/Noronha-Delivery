import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/signin-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Entrar — Entregador",
  description: "Acesse o app de entregador do Noronha Delivery.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function EntregadorEntrarPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const dest = next ?? "/entregador/painel";

  return (
    <AuthShell
      eyebrow="App do entregador"
      title="Entre pra começar a rodar"
      subtitle="Acesse com o e-mail cadastrado e ligue o switch online."
      altLink={{
        href: "/entregador/credenciar",
        ctaPrefix: "Ainda não é credenciado?",
        label: "Quero entregar",
      }}
    >
      <div className="space-y-4">
        <GoogleButton next={dest} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou com e-mail</span>
          </div>
        </div>

        <SignInForm next={dest} />
      </div>
    </AuthShell>
  );
}
