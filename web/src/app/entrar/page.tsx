import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailMagicLinkForm } from "@/components/auth/email-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o Noronha Delivery com seu e-mail ou Google.",
};

type Props = {
  searchParams: Promise<{ next?: string }>;
};

export default async function EntrarPage({ searchParams }: Props) {
  const { next } = await searchParams;

  return (
    <AuthShell
      eyebrow="Entrar"
      title="Bem-vindo de volta"
      subtitle="Use o e-mail ou Google para acessar sua conta."
      altLink={{
        href: `/cadastrar${next ? `?next=${encodeURIComponent(next)}` : ""}`,
        ctaPrefix: "Primeira vez por aqui?",
        label: "Criar conta",
      }}
    >
      <div className="space-y-4">
        <GoogleButton next={next} />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <EmailMagicLinkForm next={next} cta="Receber link de acesso" />
      </div>
    </AuthShell>
  );
}
