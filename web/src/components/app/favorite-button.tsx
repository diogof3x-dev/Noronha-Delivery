"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/app/actions/favorites";

type Props = {
  kind: "business" | "service";
  businessId: string;
  serviceId?: string;
  initialFavorited: boolean;
  /** quando true, o botão é só ícone redondo (vitrines); quando false, pílula com texto */
  iconOnly?: boolean;
  size?: "sm" | "md";
};

export function FavoriteButton({
  kind,
  businessId,
  serviceId,
  initialFavorited,
  iconOnly = true,
  size = "md",
}: Props) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, start] = useTransition();
  const router = useRouter();

  // sincroniza com server quando navega
  useEffect(() => {
    setFavorited(initialFavorited);
  }, [initialFavorited]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const optimistic = !favorited;
    setFavorited(optimistic);
    start(async () => {
      const res = await toggleFavorite({ kind, businessId, serviceId });
      if (!res.ok) {
        setFavorited(!optimistic);
        toast.error(res.error);
        return;
      }
      try {
        navigator.vibrate?.(30);
      } catch {}
      if (res.favorited) {
        toast.success("❤️ Adicionado aos favoritos");
      }
      router.refresh();
    });
  }

  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        className={`inline-flex ${dim} items-center justify-center rounded-full border border-border bg-background/90 shadow-sm backdrop-blur transition-transform active:scale-90 ${
          favorited
            ? "text-destructive"
            : "text-muted-foreground hover:text-destructive"
        }`}
      >
        {pending ? (
          <Loader2 className={`${icon} animate-spin`} />
        ) : (
          <Heart
            className={`${icon} ${favorited ? "fill-destructive" : ""}`}
            strokeWidth={2.2}
          />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
        favorited
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "border-border bg-card hover:border-destructive/30"
      }`}
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Heart className={`h-3 w-3 ${favorited ? "fill-destructive" : ""}`} />
      )}
      {favorited ? "Favoritado" : "Favoritar"}
    </button>
  );
}
