import { getServerClient } from "@/lib/supabase/server-client";

export const dynamic = "force-dynamic";

export default async function DebugPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let profile = null;
  let profileError = null;
  if (user) {
    const r = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = r.data;
    profileError = r.error?.message ?? null;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6 font-mono text-xs">
      <h1 className="text-lg font-bold">Debug — sessão atual</h1>

      <section>
        <h2 className="font-bold">user (auth.users)</h2>
        <pre className="overflow-auto rounded bg-muted p-3">
          {JSON.stringify(
            {
              user_id: user?.id,
              email: user?.email,
              providers: user?.app_metadata?.providers,
              created_at: user?.created_at,
              error: userError?.message,
            },
            null,
            2,
          )}
        </pre>
      </section>

      <section>
        <h2 className="font-bold">profile (public.profiles)</h2>
        <pre className="overflow-auto rounded bg-muted p-3">
          {JSON.stringify({ profile, error: profileError }, null, 2)}
        </pre>
      </section>

      <section>
        <h2 className="font-bold">Verificação</h2>
        <p>user.id == profile.id? {String(user?.id === profile?.id)}</p>
        <p>profile.role === &quot;admin&quot;? {String(profile?.role === "admin")}</p>
        <p>passaria no gate do parceiro?{" "}
          {String(profile?.role === "business_owner" || profile?.role === "admin")}
        </p>
        <p>passaria no gate do entregador?{" "}
          {String(profile?.role === "driver" || profile?.role === "admin")}
        </p>
      </section>
    </main>
  );
}
