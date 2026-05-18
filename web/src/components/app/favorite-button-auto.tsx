"use client";

import { useEffect, useState } from "react";
import { FavoriteButton } from "./favorite-button";
import { getBrowserClient } from "@/lib/supabase/browser-client";

/**
 * Mesma API do FavoriteButton mas detecta initialFavorited no mount.
 * Usar em páginas ISR onde não conseguimos saber server-side.
 */
export function FavoriteButtonAuto({
  kind,
  businessId,
  serviceId,
  iconOnly = true,
  size = "md",
}: {
  kind: "business" | "service";
  businessId: string;
  serviceId?: string;
  iconOnly?: boolean;
  size?: "sm" | "md";
}) {
  const [favorited, setFavorited] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    const supabase = getBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        if (active) setFavorited(false);
        return;
      }
      let q = supabase
        .from("customer_favorites")
        .select("id")
        .eq("customer_id", data.user.id)
        .eq("kind", kind)
        .eq("business_id", businessId);
      q = serviceId ? q.eq("service_id", serviceId) : q.is("service_id", null);
      q.maybeSingle().then(({ data: row }) => {
        if (active) setFavorited(!!row);
      });
    });
    return () => {
      active = false;
    };
  }, [kind, businessId, serviceId]);

  if (favorited === null) {
    // skeleton — mesmo formato que o botão
    return (
      <div
        className={`inline-flex ${
          size === "sm" ? "h-8 w-8" : "h-10 w-10"
        } animate-pulse items-center justify-center rounded-full border border-border bg-muted/30`}
      />
    );
  }

  return (
    <FavoriteButton
      kind={kind}
      businessId={businessId}
      serviceId={serviceId}
      initialFavorited={favorited}
      iconOnly={iconOnly}
      size={size}
    />
  );
}
