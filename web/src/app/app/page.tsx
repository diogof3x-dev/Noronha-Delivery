import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Leaf, Sparkles } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { iconFor, GROUP_META, GROUP_ORDER } from "@/lib/category-icon";

export default async function AppHome() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const profile = await getProfile(user);

  const { data: categories } = await supabase
    .from("categories")
    .select("id, label, group_id, icon, position")
    .eq("is_active", true)
    .order("position", { ascending: true });

  const firstName = (profile?.full_name ?? "").split(" ")[0] || "olá";
  const greeting = profile?.is_resident
    ? `Bom dia, ${firstName}`
    : `Bem-vindo a Noronha, ${firstName}`;
  const subline = profile?.is_resident
    ? "O que você precisa hoje?"
    : "Tudo o que a ilha oferece, num lugar só.";

  const byGroup = (categories ?? []).reduce<
    Record<string, NonNullable<typeof categories>>
  >((acc, c) => {
    (acc[c.group_id] ??= []).push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-xl font-bold tracking-tight">{greeting}</h1>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </section>

      <section className="overflow-hidden rounded-2xl bg-ocean-grad p-5 text-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              Mar e clima agora
            </p>
            <p className="mt-1 text-lg font-semibold">Em breve aqui</p>
            <p className="mt-1 text-xs text-white/85">
              Vento, ondas, maré e &ldquo;que praia agora?&rdquo;.
            </p>
          </div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-[color:var(--sun)]">
            <Sparkles className="h-6 w-6" />
          </span>
        </div>
      </section>

      <section className="rounded-2xl border border-[color:var(--turtle)]/30 bg-[color:var(--turtle)]/10 p-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--turtle)] text-white">
            <Leaf className="h-4 w-4" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">100% elétrico</p>
            <p className="text-xs text-muted-foreground">
              Cada pedido aqui é entrega silenciosa e sem combustão.
            </p>
          </div>
        </div>
      </section>

      {GROUP_ORDER.filter((g) => byGroup[g]?.length).map((groupId) => {
        const meta = GROUP_META[groupId];
        const items = byGroup[groupId] ?? [];
        return (
          <section key={groupId} className="space-y-3">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold tracking-tight">{meta.label}</h2>
                <p className="text-xs text-muted-foreground">{meta.tagline}</p>
              </div>
              <Link
                href={`/app/buscar?grupo=${groupId}`}
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary"
              >
                Ver tudo
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex min-w-max gap-3">
                {items.map((cat) => {
                  const Icon = iconFor(cat.icon);
                  return (
                    <li key={cat.id}>
                      <Link
                        href={`/app/categoria/${cat.id}`}
                        className="flex w-28 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center transition-colors hover:border-primary/40 hover:bg-secondary/30"
                      >
                        <span
                          className="flex h-12 w-12 items-center justify-center rounded-xl text-primary"
                          style={{ backgroundColor: "var(--secondary)" }}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="line-clamp-2 text-[11px] font-medium leading-tight">
                          {cat.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        );
      })}
    </div>
  );
}
