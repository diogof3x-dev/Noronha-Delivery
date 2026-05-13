"use client";

import { useEffect, useState } from "react";

export function SectionTabs({ sections }: { sections: string[] }) {
  const [active, setActive] = useState<string>(sections[0] ?? "");

  useEffect(() => {
    if (sections.length === 0) return;
    const observers: IntersectionObserver[] = [];
    sections.forEach((name) => {
      const el = document.getElementById(`sec-${encodeURIComponent(name)}`);
      if (!el) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) setActive(name);
          }
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0.01 },
      );
      io.observe(el);
      observers.push(io);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  function go(name: string) {
    const el = document.getElementById(`sec-${encodeURIComponent(name)}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="sticky top-14 z-20 mt-5 -mx-4 border-b border-border bg-background/95 backdrop-blur">
      <ul className="mx-auto flex max-w-md gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((name) => {
          const isActive = active === name;
          return (
            <li key={name}>
              <button
                type="button"
                onClick={() => go(name)}
                className={`inline-flex shrink-0 items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {name}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
