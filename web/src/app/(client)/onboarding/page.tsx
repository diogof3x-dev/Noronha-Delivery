import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile } from "@/lib/profile";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  const profile = await getProfile(user);

  if (profile?.full_name && profile?.district) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen flex-col bg-sand-grad">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="space-y-2 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Boas-vindas
          </p>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Vamos personalizar sua experiência
          </h1>
          <p className="text-sm text-muted-foreground">
            Em 30 segundos a gente adapta o app pra você.
          </p>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <OnboardingForm defaultName={profile?.full_name ?? ""} />
        </div>
      </div>
    </main>
  );
}
