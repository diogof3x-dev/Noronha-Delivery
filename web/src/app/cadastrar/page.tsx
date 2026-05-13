import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { EmailMagicLinkForm } from "@/components/auth/email-form";
import { GoogleButton } from "@/components/auth/google-button";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta no Noronha Delivery e tenha a ilha na palma da mão.",
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
      subtitle="Sem senha, sem fricção. Entre com Google ou receba um link no e-mail."
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
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <EmailMagicLinkForm next={next} cta="Criar conta por e-mail" />
      </div>
    </AuthShell>
  );
}
