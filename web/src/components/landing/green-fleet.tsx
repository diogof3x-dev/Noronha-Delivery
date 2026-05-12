import { Bike, Leaf, Volume2, Wind } from "lucide-react";

const pillars = [
  {
    icon: Bike,
    title: "100% elétrico",
    body: "Bikes e scooters elétricas como frota padrão. Zero emissão na entrega.",
  },
  {
    icon: Volume2,
    title: "Menos barulho",
    body: "Vibe da ilha preservada. Entrega silenciosa em qualquer hora do dia.",
  },
  {
    icon: Wind,
    title: "Menos combustível",
    body: "Alinhado à transição da ilha para mobilidade zero combustão até 2029.",
  },
  {
    icon: Leaf,
    title: "Marketing verde",
    body: "Cada pedido conta CO₂ evitado. Selo público de impacto ambiental.",
  },
];

export function GreenFleetSection() {
  return (
    <section id="verde" className="relative isolate overflow-hidden bg-secondary py-20 md:py-28">
      <div
        className="absolute inset-0 -z-10 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(circle at 80% 30%, var(--turtle) 0px, transparent 45%), radial-gradient(circle at 20% 70%, var(--ocean) 0px, transparent 45%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--turtle)]">
              Compromisso verde
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Um delivery feito para a ilha — não contra ela.
            </h2>
            <p className="mt-4 text-base text-muted-foreground md:text-lg">
              Fernando de Noronha é patrimônio. Nascemos eletrificados, silenciosos e
              alinhados à agenda ambiental da Administração. Cada entrega é uma escolha pela
              ilha que a gente quer continuar visitando.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--turtle)]/15 text-[color:var(--turtle)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
