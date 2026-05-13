import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar");
  return <>{children}</>;
}
