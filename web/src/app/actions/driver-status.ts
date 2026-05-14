"use server";

import { revalidatePath } from "next/cache";
import { getServerClient } from "@/lib/supabase/server-client";

export async function toggleDriverOnline(formData: FormData) {
  const goOnline = formData.get("online") === "true";
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("profiles")
    .update({ is_online: goOnline, last_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  revalidatePath("/entregador/painel");
  revalidatePath("/entregador/painel/entregas");
}
