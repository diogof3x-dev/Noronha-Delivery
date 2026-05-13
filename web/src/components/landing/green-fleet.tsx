import Image from "next/image";
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
    <section id="verde" className="relative isolate overflow-hidden py-20 md:py-28">
      <Image
        src="/hero/noronha-hero-desktop.jpg"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-[20%_center]"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, rgba(8,30,45,0.88) 0%, rgba(45,134,89,0.80) 100%)",
        }}
        aria-hidden
      />

      <div className="mx-auto max-w-6xl px-4 text-white">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p
              className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--sun)]"
              style={{ textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}
            >
              Compromisso verde
            </p>
            <h2
              className="mt-2 text-3xl font-bold tracking-tight md:text-4xl"
              style={{ textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}
            >
              Um delivery feito para a ilha — não contra ela.
            </h2>
            <p
              className="mt-4 max-w-md text-base text-white/90 md:text-lg"
              style={{ textShadow: "0 1px 10px rgba(0,0,0,0.45)" }}
            >
              Fernando de Noronha é patrimônio. Nascemos eletrificados, silenciosos e
              alinhados à agenda ambiental da Administração. Cada entrega é uma escolha
              pela ilha que a gente quer continuar visitando.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur"
                >
                  <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--sun)]/20 text-[color:var(--sun)]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-white">{p.title}</h3>
                  <p className="mt-1 text-sm text-white/85">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
