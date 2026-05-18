import { getServerClient } from "@/lib/supabase/server-client";
import { getProfile, initialsFor } from "@/lib/profile";
import { AppHeader } from "@/components/app/app-header";
import { BottomNav } from "@/components/app/bottom-nav";
import { CartFab } from "@/components/app/cart-fab";
import { PushPrompt } from "@/components/push/push-prompt";
import { InstallBanner } from "@/components/pwa/install-banner";
import { CartSync } from "@/components/app/cart-sync";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user ? await getProfile(user) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader
        district={profile?.district ?? null}
        initials={initialsFor(profile?.full_name, user?.email)}
        isAuthed={Boolean(user)}
        role={profile?.role ?? null}
      />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-4 pt-3">
        {user && (
          <div className="mb-3">
            <PushPrompt context="cliente" />
          </div>
        )}
        {children}
      </main>
      <CartFab />
      <BottomNav />
      <InstallBanner />
      {user && <CartSync isAuthed={true} />}
    </div>
  );
}
