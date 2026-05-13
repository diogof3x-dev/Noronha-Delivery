"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { getServerClient } from "@/lib/supabase/server-client";

const EmailSchema = z.object({
  email: z.string().email("E-mail inválido").max(160),
  next: z.string().max(200).optional(),
});

export type AuthState = {
  ok: boolean;
  sent?: boolean;
  error?: string;
};

async function originUrl(path: string) {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("host") ?? "noronhadelivery.com";
  return `${proto}://${host}${path}`;
}

export async function sendMagicLink(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = EmailSchema.safeParse({
    email: formData.get("email"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "E-mail inválido" };
  }

  const supabase = await getServerClient();
  const next = parsed.data.next || "/app";
  const redirectTo = await originUrl(`/auth/callback?next=${encodeURIComponent(next)}`);

  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: {
      emailRedirectTo: redirectTo,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, sent: true };
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
