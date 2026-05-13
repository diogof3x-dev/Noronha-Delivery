import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Noronha Delivery em 30 segundos.",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function CadastrarPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <AuthShell
      eyebrow="Criar conta"
      title="Crie sua conta em 30 segundos"
      subtitle="Entre com Google ou cadastre nome + e-mail + senha."
      altLink={{
        href: `/entrar${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        ctaPrefix: "Já tem conta?",
        label: "Entrar",
      }}
    >
      <div className="space-y-4">
        <GoogleButton next={next} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou com e-mail</span>
          </div>
        </div>

        <SignUpForm next={next} />
      </div>
    </AuthShell>
  );
}
