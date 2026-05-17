export type TurnstileVerifyResult = { ok: true } | { ok: false; error: string };

export async function verifyTurnstileToken(
  token: string | null,
  ip?: string | null,
): Promise<TurnstileVerifyResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true }; // fail-open se não configurado
  if (!token) return { ok: false, error: "Captcha ausente" };

  try {
    const body = new URLSearchParams();
    body.set("secret", secret);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (json.success) return { ok: true };
    return { ok: false, error: (json["error-codes"] ?? []).join(",") || "Captcha falhou" };
  } catch (e) {
    // erro de rede — fail-open (não pode bloquear cadastro por causa do CF)
    console.error("[turnstile] verify failed", e);
    return { ok: true };
  }
}
