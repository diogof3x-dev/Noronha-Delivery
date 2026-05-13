import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/signin-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Entrar — Parceiro",
  description: "Acesse o painel do parceiro do Noronha Delivery.",
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function ParceiroEntrarPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const dest = next ?? "/parceiro/painel";

  return (
    <AuthShell
      eyebrow="Painel do parceiro"
      title="Entre na sua conta"
      subtitle="Acesse pedidos, catálogo, vendas e saque com o e-mail cadastrado."
      altLink={{
        href: "/parceiro/credenciar",
        ctaPrefix: "Ainda não é parceiro?",
        label: "Credenciar meu negócio",
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
