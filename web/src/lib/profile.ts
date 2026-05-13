import type { User } from "@supabase/supabase-js";
import { getServerClient } from "@/lib/supabase/server-client";

export type Profile = {
  id: string;
  full_name: string | null;
  whatsapp: string | null;
  district: string | null;
  is_resident: boolean;
  role: "customer" | "business_owner" | "driver" | "admin";
};

export async function getProfile(user: User): Promise<Profile | null> {
  const supabase = await getServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, whatsapp, district, is_resident, role")
    .eq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("[getProfile]", error);
    return null;
  }
  return data;
}

export function initialsFor(name: string | null | undefined, email?: string | null) {
  const source = (name || email || "?").trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
