"use client";

import Image from "next/image";
import { useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/browser-client";
import { STORAGE_CACHE_CONTROL } from "@/lib/constants";

const BUCKET = "business-assets";

export function ImageUpload({
  name,
  defaultUrl,
  label,
  aspect = "square",
}: {
  name: string;
  defaultUrl?: string | null;
  label: string;
  aspect?: "square" | "wide";
}) {
  const [url, setUrl] = useState<string | null>(defaultUrl ?? null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleFile(file: File) {
    setErr(null);
    if (!file.type.startsWith("image/")) {
      setErr("Arquivo precisa ser imagem");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErr("Imagem maior que 5MB");
      return;
    }
    setBusy(true);
    try {
      const supabase = getBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErr("Faça login");
        return;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: STORAGE_CACHE_CONTROL,
        upsert: false,
      });
      if (error) {
        setErr(error.message);
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  const boxClass =
    aspect === "wide"
      ? "relative h-24 w-72 sm:w-80 overflow-hidden rounded-xl"
      : "relative h-24 w-24 overflow-hidden rounded-xl";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-3">
        <div className={`${boxClass} border border-border bg-secondary`}>
          {url ? (
            <Image src={url} alt={label} fill className="object-cover" sizes="200px" unoptimized />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="inline-flex h-9 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-muted">
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {url ? "Trocar" : "Enviar imagem"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.currentTarget.value = "";
              }}
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover
            </button>
          )}
        </div>
      </div>
      <input type="hidden" name={name} value={url ?? ""} />
      <p className="text-[11px] text-muted-foreground">PNG/JPG/WebP até 5MB.</p>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </div>
  );
}
