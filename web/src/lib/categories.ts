import {
  Bike,
  Bus,
  CalendarCheck,
  Coffee,
  Croissant,
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

export type ServiceCategory = {
  id: string;
  label: string;
  icon: LucideIcon;
  group: "essenciais" | "delivery" | "mobilidade" | "reservas" | "servicos" | "premium";
};

export const serviceCategories: ServiceCategory[] = [
  // Essenciais
  { id: "farmacia", label: "Farmácia e emergências", icon: Pill, group: "essenciais" },
  { id: "mercado", label: "Mercado rápido", icon: ShoppingBasket, group: "essenciais" },
  { id: "agua-gelo", label: "Água, gelo e carvão", icon: Flame, group: "essenciais" },
  { id: "conveniencia", label: "Conveniência 24h", icon: GlassWater, group: "essenciais" },
  { id: "itens-turisticos", label: "Itens turísticos", icon: Sun, group: "essenciais" },

  // Delivery especializado
  { id: "delivery-praia", label: "Delivery de praia", icon: Umbrella, group: "delivery" },
  { id: "delivery-pousada", label: "Delivery para pousadas", icon: Hotel, group: "delivery" },
  { id: "delivery-barco", label: "Delivery para barcos", icon: Sailboat, group: "delivery" },
  { id: "delivery-b2b", label: "Entregas entre empresas", icon: Truck, group: "delivery" },

  // Mobilidade
  { id: "transporte-malas", label: "Transporte de malas", icon: Luggage, group: "mobilidade" },
  { id: "transfer", label: "Transfer aeroporto / pousada", icon: Bus, group: "mobilidade" },
  { id: "bikes-scooters", label: "Aluguel de bikes e scooters", icon: Bike, group: "mobilidade" },

  // Reservas
  { id: "reserva-restaurante", label: "Reserva de restaurantes", icon: HandPlatter, group: "reservas" },
  { id: "passeios", label: "Agendamento de passeios", icon: Waves, group: "reservas" },
  { id: "ingressos", label: "Venda de ingressos e eventos", icon: PartyPopper, group: "reservas" },

  // Serviços ao turista e morador
  { id: "recarga", label: "Recarga de celular", icon: Smartphone, group: "servicos" },
  { id: "power-bank", label: "Aluguel de carregadores / power banks", icon: Plug, group: "servicos" },
  { id: "lavanderia", label: "Retirada de lavanderia", icon: WashingMachine, group: "servicos" },
  { id: "pet", label: "Pet shop / veterinário", icon: Dog, group: "servicos" },
  { id: "academia", label: "Academia e personal", icon: Dumbbell, group: "servicos" },
  { id: "spa", label: "Massagens e spa", icon: Sparkles, group: "servicos" },
  { id: "mecanica", label: "Assistência mecânica", icon: Hammer, group: "servicos" },

  // Premium
  { id: "turismo-vip", label: "Turismo VIP", icon: Star, group: "premium" },
  { id: "concierge", label: "Concierge para turistas", icon: Headset, group: "premium" },
];

export const groupMeta = {
  essenciais: { label: "Essenciais do dia-a-dia", icon: Coffee, accent: "ocean" as const },
  delivery: { label: "Delivery especializado", icon: Truck, accent: "primary" as const },
  mobilidade: { label: "Mobilidade", icon: Bike, accent: "turtle" as const },
  reservas: { label: "Reservas e ingressos", icon: CalendarCheck, accent: "ocean" as const },
  servicos: { label: "Serviços ao turista e morador", icon: Sparkles, accent: "coral" as const },
  premium: { label: "Premium e concierge", icon: Star, accent: "sun" as const },
};

export const groupsOrder: Array<keyof typeof groupMeta> = [
  "delivery",
  "essenciais",
  "mobilidade",
  "reservas",
  "servicos",
  "premium",
];

export const categoriesByGroup = (group: keyof typeof groupMeta) =>
  serviceCategories.filter((c) => c.group === group);

export function placeIcon(id: string): LucideIcon {
  return serviceCategories.find((c) => c.id === id)?.icon ?? MapPin;
}
