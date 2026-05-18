"use client";

import { useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { sendCustomerPushCampaign } from "@/app/actions/customer-push";

type Segment = "all" | "vip" | "inactive_30d" | "new_30d" | "first_order_only";

const SEGMENTS: Array<{ value: Segment; label: string; desc: string }> = [
  { value: "all", label: "Todos pagantes", desc: "Todos que já pagaram pelo menos 1 pedido" },
  { value: "vip", label: "Top 50 (VIP)", desc: "Os que mais gastaram lifetime" },
  { value: "inactive_30d", label: "Sumiram (30d+)", desc: "Sem pedidos nos últimos 30 dias" },
  { value: "new_30d", label: "Novos (30d)", desc: "Primeira compra nos últimos 30 dias" },
  { value: "first_order_only", label: "Pediram só 1x", desc: "Trazer pra segunda compra" },
];

const PRESETS = [
  {
    title: "Promoção relâmpago!",
    body: "Hoje tem desconto especial pra você. Toca aqui pra ver.",
  },
  {
    title: "Saudades de você",
    body: "Faz um tempo que você não pede. Volta com um cupom de boas-vindas!",
  },
  {
    title: "Item novo no cardápio 🎉",
    body: "Acabamos de adicionar um item que você vai amar. Vem ver!",
  },
  {
    title: "Ainda dá tempo",
    body: "Cozinha aberta até as 22h. Bora pedir aquele clássico?",
  },
];

export function PushCampaignForm({
  businessId,
  totalCredits,
  customerStats,
}: {
  businessId: string;
  totalCredits: number;
  customerStats: { all: number; vip: number; recurring: number; reachable: number };
}) {
  const [segment, setSegment] = useState<Segment>("all");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [pending, start] = useTransition();

  const segmentSize = {
    all: customerStats.all,
    vip: customerStats.vip,
    inactive_30d: Math.floor(customerStats.all * 0.3),
    new_30d: Math.floor(customerStats.all * 0.2),
    first_order_only: Math.max(0, customerStats.all - customerStats.recurring),
  }[segment];

  const insufficient = segmentSize > totalCredits;

  return (
    <form
      action={(fd) =>
        start(async () => {
          fd.set("segment", segment);
          const res = await sendCustomerPushCampaign(fd);
          if (res.ok) {
            toast.success(
              `Enviado pra ${res.sent} cliente${res.sent === 1 ? "" : "s"}! Restam ${res.creditsLeft} créditos.`,
            );
            setTitle("");
            setBody("");
            setUrl("");
          } else {
            toast.error(res.error);
          }
        })
      }
      className="space-y-3"
    >
      <input type="hidden" name="business_id" value={businessId} />

      <div>
        <Label className="text-[10px] uppercase tracking-[0.18em]">
          Quem vai receber
        </Label>
        <div className="mt-1 grid gap-1.5 sm:grid-cols-2">
          {SEGMENTS.map((s) => (
            <label
              key={s.value}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-xs ${
                segment === s.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <input
                type="radio"
                name="segment_radio"
                checked={segment === s.value}
                onChange={() => setSegment(s.value)}
                className="mt-0.5 h-3.5 w-3.5"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.label}</p>
                <p className="text-[10px] text-muted-foreground">{s.desc}</p>
              </div>
            </label>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Estimativa: <strong>{segmentSize}</strong> cliente
          {segmentSize === 1 ? "" : "s"} no segmento. Consumirá até{" "}
          <strong>{segmentSize}</strong> crédito{segmentSize === 1 ? "" : "s"} ({totalCredits} disponíveis).
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="title" className="text-[10px] uppercase tracking-[0.18em]">
            Título (max 80 char)
          </Label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={80}
            placeholder="Promoção relâmpago!"
          />
        </div>
        <div>
          <Label htmlFor="url" className="text-[10px] uppercase tracking-[0.18em]">
            Link (opcional)
          </Label>
          <Input
            id="url"
            name="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="/app/restaurante/sua-loja"
            maxLength={300}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="body" className="text-[10px] uppercase tracking-[0.18em]">
          Mensagem (max 220 char)
        </Label>
        <Textarea
          id="body"
          name="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={220}
          rows={2}
          placeholder="Hoje tem desconto. Toca aqui pra ver."
        />
      </div>

      <div>
        <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Modelos prontos
        </p>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setTitle(p.title);
                setBody(p.body);
              }}
              className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-muted/50"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* preview */}
      {(title || body) && (
        <div className="rounded-lg border-2 border-dashed border-border bg-background p-3">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Pré-visualização
          </p>
          <div className="mt-1 rounded-lg border border-border bg-card p-3 shadow-sm">
            <p className="text-sm font-bold">{title || "Título"}</p>
            <p className="mt-0.5 text-xs">{body || "Mensagem"}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              noronhadelivery.com · agora
            </p>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={pending || !title || !body || insufficient || segmentSize === 0}
        className="w-full"
      >
        {pending ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Send className="mr-2 h-3.5 w-3.5" />
        )}
        {insufficient
          ? `Saldo insuficiente — faltam ${segmentSize - totalCredits} créditos`
          : segmentSize === 0
            ? "Nenhum cliente no segmento"
            : `Enviar pra ${segmentSize} cliente${segmentSize === 1 ? "" : "s"}`}
      </Button>
    </form>
  );
}
