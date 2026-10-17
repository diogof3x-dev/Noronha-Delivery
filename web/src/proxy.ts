import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Modo manutenção (17/10/2026): app fora do ar para o público.
// Webhooks de pagamento, login e super admin continuam funcionando
// pra não perder confirmação de pagamento nem o acesso de quem administra.
// Para religar: MAINTENANCE = false e redeploy.
const MAINTENANCE = true;

const LIBERADAS = [
  "/api/webhooks",
  "/auth/callback",
  "/entrar",
  "/super-admin",
  "/api/super-admin",
  "/icon",
  "/apple-icon",
];

const PAGINA_MANUTENCAO = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Noronha Delivery</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
font-family:system-ui,-apple-system,sans-serif;background:#0b4f6c;color:#fff;text-align:center;padding:16px}
h1{font-size:1.6rem;margin:0 0 .5rem}p{opacity:.85;margin:0;line-height:1.5}
</style></head>
<body><main><h1>Em breve</h1>
<p>Noronha Delivery — aqui você tem Tudo.</p></main></body></html>`;

export async function proxy(request: NextRequest) {
  if (MAINTENANCE) {
    const { pathname } = request.nextUrl;
    const liberada = LIBERADAS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!liberada) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "maintenance" }, { status: 503 });
      }
      return new NextResponse(PAGINA_MANUTENCAO, {
        status: 503,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "retry-after": "3600",
          "cache-control": "no-store",
        },
      });
    }
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
