"use client";

import { useEffect, useState } from "react";
import { Download, Share2, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "noronha:pwa-install-dismissed-at";
const DISMISS_DAYS = 7;

function wasRecentlyDismissed(): boolean {
  if (typeof window === "undefined") return false;
  const at = window.localStorage.getItem(DISMISS_KEY);
  if (!at) return false;
  const ageMs = Date.now() - Number(at);
  return ageMs < DISMISS_DAYS * 24 * 3600 * 1000;
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isStandalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS-only API
      window.navigator.standalone === true;
    if (isStandalone) return;
    if (wasRecentlyDismissed()) return;

    const ua = window.navigator.userAgent;
    const ios = /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (ios) {
      setIsIos(true);
      setHidden(false);
      return;
    }

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setHidden(true);
  }

  if (hidden) return null;
  if (!deferred && !isIos) return null;

  return (
    <div
      className="fixed inset-x-2 z-40 mx-auto max-w-md rounded-2xl border border-primary/30 bg-background/95 p-3 shadow-lg backdrop-blur"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)" }}
    >
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Instalar o app</p>
          {isIos ? (
            <p className="text-[11px] text-muted-foreground">
              Toque em <Share2 className="inline h-3 w-3" /> e depois &quot;Adicionar à Tela
              de Início&quot;
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Abre direto da tela inicial, sem barra de endereço
            </p>
          )}
        </div>
        {!isIos && deferred && (
          <button
            type="button"
            onClick={async () => {
              await deferred.prompt();
              const choice = await deferred.userChoice;
              if (choice.outcome === "accepted") setHidden(true);
              else dismiss();
            }}
            className="shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            Instalar
          </button>
        )}
        <button
          type="button"
          aria-label="Fechar"
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
