import {
  Bike,
  Bus,
  Coffee,
  Dog,
  Dumbbell,
  Flame,
  GlassWater,
  Hammer,
  HandPlatter,
  Headset,
  Hotel,
  Luggage,
  MapPin,
  PartyPopper,
  Pill,
  Plug,
  Sailboat,
  Smartphone,
  ShoppingBasket,
  Sparkles,
  Star,
  Sun,
  Truck,
  Umbrella,
  WashingMachine,
  Waves,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Bike,
  Bus,
  Coffee,
  Dog,
  Dumbbell,
  Flame,
  GlassWater,
  Hammer,
  HandPlatter,
  Headset,
  Hotel,
  Luggage,
  MapPin,
  PartyPopper,
  Pill,
  Plug,
  Sailboat,
  Smartphone,
  ShoppingBasket,
  Sparkles,
  Star,
  Sun,
  Truck,
  Umbrella,
  WashingMachine,
  Waves,
};

export function iconFor(name: string | null | undefined): LucideIcon {
  if (!name) return MapPin;
  return ICONS[name] ?? MapPin;
}

export const GROUP_META: Record<
  string,
  { label: string; tagline: string; accent: string }
> = {
  delivery: {
    label: "Delivery especializado",
    tagline: "Comida, mercado, farmácia",
    accent: "var(--primary)",
  },
  essenciais: {
    label: "Essenciais",
    tagline: "Pro dia-a-dia na ilha",
    accent: "var(--ocean)",
  },
  mobilidade: {
    label: "Mobilidade",
    tagline: "Transfer, malas, bikes",
    accent: "var(--turtle)",
  },
  reservas: {
    label: "Reservas",
    tagline: "Restaurantes, passeios, eventos",
    accent: "var(--ocean)",
  },
  servicos: {
    label: "Serviços",
    tagline: "Lavanderia, spa, pet, mecânica",
    accent: "var(--coral)",
  },
  premium: {
    label: "Premium",
    tagline: "VIP e concierge",
    accent: "var(--sun)",
  },
};

export const GROUP_ORDER = [
  "delivery",
  "essenciais",
  "mobilidade",
  "reservas",
  "servicos",
  "premium",
];
