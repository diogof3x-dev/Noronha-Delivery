"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getBrowserClient } from "@/lib/supabase/browser-client";
import {
  sendOrderMessage,
  markOrderMessagesAsRead,
} from "@/app/actions/order-chat";

export type ChatMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  sender_kind: "customer" | "business" | "driver" | "admin";
  body: string;
  created_at: string;
};

type Props = {
  orderId: string;
  currentUserId: string;
  /** "modal" abre um overlay full-screen mobile; "inline" renderiza embutido */
  variant?: "modal" | "inline";
  /** controlado externamente */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** participantes pra labelar (foto/nome) */
  customerName?: string | null;
  driverName?: string | null;
  businessName?: string | null;
};

const KIND_LABEL: Record<ChatMessage["sender_kind"], string> = {
  customer: "Cliente",
  business: "Estabelecimento",
  driver: "Motoboy",
  admin: "Suporte F3X",
};

const KIND_COLOR: Record<ChatMessage["sender_kind"], string> = {
  customer: "var(--turtle)",
  business: "var(--primary)",
  driver: "var(--sun)",
  admin: "#94A3B8",
};

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function OrderChat({
  orderId,
  currentUserId,
  variant = "modal",
  open = true,
  onOpenChange,
  customerName,
  driverName,
  businessName,
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement | null>(null);

  // fetch + realtime
  useEffect(() => {
    if (!open) return;
    const supabase = getBrowserClient();

    supabase
      .from("order_messages")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    const channel = supabase
      .channel(`order-chat:${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "order_messages",
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          const m = payload.new as ChatMessage;
          setMessages((cur) => {
            if (cur.some((x) => x.id === m.id)) return cur;
            return [...cur, m];
          });
        },
      )
      .subscribe();

    // marca como lido
    void markOrderMessagesAsRead(orderId);

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, open]);

  // auto-scroll
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text) return;
    const fd = new FormData();
    fd.set("order_id", orderId);
    fd.set("body", text);
    setBody("");
    start(async () => {
      const res = await sendOrderMessage(fd);
      if (!res.ok) {
        setBody(text); // restaura
        toast.error(res.error);
      }
    });
  }

  const messagesUI = (
    <>
      <div
        ref={listRef}
        className="flex-1 space-y-2 overflow-y-auto px-3 py-3"
        style={{ scrollbarWidth: "thin" }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">
              Comece a conversa sobre esse pedido.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Cliente, lojista e motoboy participam aqui.
            </p>
          </div>
        ) : (
          messages.map((m, i) => {
            const mine = m.sender_id === currentUserId;
            const showHeader =
              i === 0 || messages[i - 1]!.sender_id !== m.sender_id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm ${
                    mine
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm border border-border bg-card"
                  }`}
                >
                  {showHeader && !mine && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-[0.1em]"
                      style={{ color: KIND_COLOR[m.sender_kind] }}
                    >
                      {m.sender_kind === "business" && businessName
                        ? businessName
                        : m.sender_kind === "customer" && customerName
                          ? customerName
                          : m.sender_kind === "driver" && driverName
                            ? driverName
                            : KIND_LABEL[m.sender_kind]}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-0.5 text-[9px] ${
                      mine ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    {fmtTime(m.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-border bg-background p-2"
      >
        <Input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escreva sua mensagem..."
          maxLength={1000}
          autoFocus
          disabled={pending}
          className="flex-1"
        />
        <Button type="submit" size="sm" disabled={pending || !body.trim()}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </>
  );

  if (variant === "inline") {
    return (
      <section className="flex h-[400px] flex-col rounded-2xl border border-border bg-background">
        <header className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
          <MessageCircle className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold">Chat do pedido</span>
        </header>
        {messagesUI}
      </section>
    );
  }

  // modal — full-screen mobile, overlay desktop
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={() => onOpenChange?.(false)}
    >
      <div
        className="flex h-[92vh] w-full max-w-md flex-col rounded-t-3xl bg-background shadow-2xl sm:h-[80vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-sm font-bold">
              <MessageCircle className="h-4 w-4 text-primary" />
              Chat do pedido
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Cliente · Estabelecimento · Motoboy
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange?.(false)}
            aria-label="Fechar"
            className="rounded-full p-1 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        {messagesUI}
      </div>
    </div>
  );
}

export function ChatOpenerButton({
  orderId,
  currentUserId,
  customerName,
  driverName,
  businessName,
  unreadCount,
  label = "Chat do pedido",
}: {
  orderId: string;
  currentUserId: string;
  customerName?: string | null;
  driverName?: string | null;
  businessName?: string | null;
  unreadCount?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        {label}
        {unreadCount && unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      <OrderChat
        orderId={orderId}
        currentUserId={currentUserId}
        open={open}
        onOpenChange={setOpen}
        customerName={customerName}
        driverName={driverName}
        businessName={businessName}
      />
    </>
  );
}
