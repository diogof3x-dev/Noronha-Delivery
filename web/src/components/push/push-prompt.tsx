"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { savePushSubscription, deletePushSubscription } from "@/app/actions/push";
import { toast } from "sonner";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(b64: string): Uint8Array {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function PushPrompt({ context }: { context: "parceiro" | "entregador" | "cliente" }) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<"idle" | "granted" | "denied" | "blocked">("idle");
  const [pending, start] = useTransition();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !VAPID_PUBLIC) return;
    setSupported(true);

    if (Notification.permission === "denied") setState("blocked");
    else if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        if (sub) setState("granted");
      });
    }
  }, []);

  if (!supported || state === "granted") return null;
  if (state === "blocked") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        <BellOff className="h-4 w-4" />
        <span>
          Notificações bloqueadas no navegador. Abra as permissões do site pra reativar.
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
      <div className="min-w-0 flex-1 text-xs">
        <p className="font-semibold">Ativar notificações</p>
        <p className="text-muted-foreground">
          {context === "parceiro"
            ? "Avisamos quando chegar um pedido novo pra você aceitar"
            : context === "entregador"
              ? "Avisamos quando tiver corrida disponível"
              : "Acompanhe o status do seu pedido em tempo real"}
        </p>
      </div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() => {
          start(async () => {
            try {
              const perm = await Notification.requestPermission();
              if (perm !== "granted") {
                setState(perm === "denied" ? "blocked" : "idle");
                return;
              }
              const reg = await navigator.serviceWorker.register("/sw.js");
              const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC!).buffer as ArrayBuffer,
              });
              const k = sub.toJSON();
              const res = await savePushSubscription({
                endpoint: sub.endpoint,
                p256dh: k.keys?.p256dh ?? "",
                auth: k.keys?.auth ?? "",
                user_agent: navigator.userAgent.slice(0, 500),
              });
              if (res.ok) {
                setState("granted");
                toast.success("Notificações ativadas!");
              } else {
                await sub.unsubscribe().catch(() => {});
                toast.error(res.error);
              }
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Falha ao ativar");
            }
          });
        }}
      >
        <Bell className="mr-1.5 h-3.5 w-3.5" />
        Ativar
      </Button>
    </div>
  );
}
