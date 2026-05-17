"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "auto" | "light" | "dark";
          size?: "normal" | "compact";
        },
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function Turnstile({
  name = "turnstile_token",
  onToken,
  compact = false,
}: {
  name?: string;
  onToken?: (token: string) => void;
  compact?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (!SITE_KEY) return;
    if (typeof window === "undefined") return;

    function render() {
      if (!ref.current || !window.turnstile) return;
      if (widgetId.current) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY!,
        callback: (t) => {
          setToken(t);
          onToken?.(t);
        },
        "expired-callback": () => setToken(""),
        "error-callback": () => setToken(""),
        theme: "auto",
        size: compact ? "compact" : "normal",
      });
    }

    if (window.turnstile) {
      render();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = render;
    document.head.appendChild(script);

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {}
        widgetId.current = null;
      }
    };
  }, [onToken, compact]);

  if (!SITE_KEY) return null;

  return (
    <>
      <div ref={ref} />
      <input type="hidden" name={name} value={token} />
    </>
  );
}
