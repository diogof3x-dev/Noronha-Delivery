"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";
import { verifyTurnstileToken } from "@/lib/turnstile";

const SignInSchema = z.object({
  email: z.string().email("E-mail inválido").max(160),
  password: z.string().min(6, "Senha precisa ter ao menos 6 caracteres").max(72),
  next: z.string().max(200).optional(),
});

const SignUpSchema = z.object({
  full_name: z.string().min(2, "Informe seu nome").max(120),
  email: z.string().email("E-mail inválido").max(160),
  password: z.string().min(6, "Senha precisa ter ao menos 6 caracteres").max(72),
  next: z.string().max(200).optional(),
});

export type AuthState = {
  ok: boolean;
  error?: string;
};

async function originUrl(path: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "noronhadelivery.com";
  return `${proto}://${host}${path}`;
}

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    const msg = /invalid login credentials/i.test(error.message)
      ? "E-mail ou senha incorretos"
      : error.message;
    return { ok: false, error: msg };
  }

  redirect(parsed.data.next || "/app");
}

export async function signUpWithPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = SignUpSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const turnstile = await verifyTurnstileToken(formData.get("turnstile_token")?.toString() ?? null);
  if (!turnstile.ok) {
    return { ok: false, error: "Verificação anti-bot falhou. Recarregue a página." };
  }

  const supabase = await getServerClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.full_name },
    },
  });

  if (error) {
    const msg = /already registered/i.test(error.message)
      ? "Esse e-mail já tem conta. Use Entrar."
      : error.message;
    return { ok: false, error: msg };
  }

  // Loga automaticamente após cadastro
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (signInError) {
    return { ok: false, error: signInError.message };
  }

  redirect(parsed.data.next || "/app");
}

export async function signInWithGoogle(formData: FormData) {
  const next = (formData.get("next") as string | null) || "/app";
  const supabase = await getServerClient();
  const redirectTo = await originUrl(`/auth/callback?next=${encodeURIComponent(next)}`);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });

  if (error || !data?.url) {
    throw new Error(error?.message || "Falha ao iniciar Google");
  }
  redirect(data.url);
}

export async function signOut() {
  const supabase = await getServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
