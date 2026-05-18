"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateBanner } from "@/app/actions/promotions";

const COLORS = [
  { value: "#0B7FA8", label: "Mar" },
  { value: "#2BB673", label: "Verde tartaruga" },
  { value: "#F4B642", label: "Sol" },
  { value: "#E76F51", label: "Pôr-do-sol" },
  { value: "#1F2937", label: "Noite" },
];

export function BannerForm({
  businessId,
  initial,
}: {
  businessId: string;
  initial: { text: string; ctaLabel: string; ctaUrl: string; color: string };
}) {
  const [text, setText] = useState(initial.text);
  const [ctaLabel, setCtaLabel] = useState(initial.ctaLabel);
  const [ctaUrl, setCtaUrl] = useState(initial.ctaUrl);
  const [color, setColor] = useState(initial.color || "#0B7FA8");
  const [pending, start] = useTransition();

  return (
    <div className="mt-3 space-y-3">
      {text && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-semibold text-white"
          style={{ background: color }}
        >
          {text}
          {ctaLabel && (
            <span className="ml-2 inline-block rounded-full bg-white/20 px-2 py-0.5 text-[10px]">
              {ctaLabel} →
            </span>
          )}
        </div>
      )}

      <form
        action={(fd) =>
          start(async () => {
            const res = await updateBanner(fd);
            if (res.ok) toast.success("Banner atualizado!");
            else toast.error(res.error);
          })
        }
        className="grid gap-3 md:grid-cols-2"
      >
        <input type="hidden" name="business_id" value={businessId} />
        <input type="hidden" name="banner_color" value={color} />

        <div className="md:col-span-2">
          <Label htmlFor="banner_text" className="text-[10px] uppercase">Texto do banner</Label>
          <Input
            id="banner_text"
            name="banner_text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ex: Frete grátis acima de R$ 50"
            maxLength={120}
          />
        </div>

        <div>
          <Label htmlFor="banner_cta_label" className="text-[10px] uppercase">Texto do botão</Label>
          <Input
            id="banner_cta_label"
            name="banner_cta_label"
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Ex: Ver promo"
            maxLength={40}
          />
        </div>
        <div>
          <Label htmlFor="banner_cta_url" className="text-[10px] uppercase">Link (opcional)</Label>
          <Input
            id="banner_cta_url"
            name="banner_cta_url"
            value={ctaUrl}
            onChange={(e) => setCtaUrl(e.target.value)}
            placeholder="https://..."
            maxLength={200}
          />
        </div>

        <div className="md:col-span-2">
          <Label className="text-[10px] uppercase">Cor</Label>
          <div className="mt-1 flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                className={`h-8 w-8 rounded-full border-2 transition-transform ${
                  color === c.value
                    ? "border-foreground scale-110"
                    : "border-transparent"
                }`}
                style={{ background: c.value }}
                title={c.label}
                aria-label={`Cor ${c.label}`}
              />
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex gap-2">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Salvar banner
          </Button>
          {text && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setText("");
                setCtaLabel("");
                setCtaUrl("");
              }}
            >
              Limpar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
