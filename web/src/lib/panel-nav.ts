import {
  BarChart3,
  BedDouble,
  Banknote,
  Bike,
  CalendarCheck,
  CalendarDays,
  ListChecks,
  Sailboat,
  Sparkles,
  Star,
  Store,
  UserCog,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";

export type PanelNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const BASE: PanelNavItem[] = [
  { href: "/parceiro/painel", label: "Visão geral", icon: BarChart3 },
];

const CADASTRO_LOJA: PanelNavItem[] = [
  { href: "/parceiro/painel/vendas", label: "Vendas", icon: Banknote },
  { href: "/parceiro/painel/avaliacoes", label: "Avaliações", icon: Star },
  { href: "/parceiro/painel/loja", label: "Minha loja", icon: Store },
  { href: "/parceiro/painel/cadastro", label: "Meu cadastro", icon: UserCog },
];

const FOOD: PanelNavItem[] = [
  { href: "/parceiro/painel/pedidos", label: "Pedidos", icon: ListChecks },
  { href: "/parceiro/painel/cardapio", label: "Cardápio", icon: UtensilsCrossed },
];

const LODGING: PanelNavItem[] = [
  { href: "/parceiro/painel/quartos", label: "Quartos", icon: BedDouble },
  { href: "/parceiro/painel/reservas", label: "Reservas", icon: CalendarCheck },
];

const TOURS: PanelNavItem[] = [
  { href: "/parceiro/painel/passeios", label: "Passeios", icon: Sailboat },
  { href: "/parceiro/painel/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/parceiro/painel/reservas-passeio", label: "Reservas", icon: CalendarCheck },
];

const RENTALS: PanelNavItem[] = [
  { href: "/parceiro/painel/equipamentos", label: "Equipamentos", icon: Bike },
  { href: "/parceiro/painel/locacoes", label: "Locações", icon: CalendarCheck },
];

const SERVICES_VERTICAL: PanelNavItem[] = [
  { href: "/parceiro/painel/servicos", label: "Serviços", icon: Sparkles },
  { href: "/parceiro/painel/horarios", label: "Horários", icon: CalendarDays },
  { href: "/parceiro/painel/agendamentos", label: "Agendamentos", icon: CalendarCheck },
];

export function getPanelNav(type: string | null | undefined): PanelNavItem[] {
  switch (type) {
    case "pousada":
      return [...BASE, ...LODGING, ...CADASTRO_LOJA];
    case "operador_passeio":
      return [...BASE, ...TOURS, ...CADASTRO_LOJA];
    case "locadora":
      return [...BASE, ...RENTALS, ...CADASTRO_LOJA];
    case "servico":
      return [...BASE, ...SERVICES_VERTICAL, ...CADASTRO_LOJA];
    case "restaurante":
    case "mercado":
    case "farmacia":
    case "conveniencia":
    case "loja":
    default:
      return [...BASE, ...FOOD, ...CADASTRO_LOJA];
  }
}
