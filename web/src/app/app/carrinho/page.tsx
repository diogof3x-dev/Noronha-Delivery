import { CartView } from "./cart-view";

export const metadata = { title: "Carrinho" };
export const dynamic = "force-dynamic";

export default function CarrinhoPage() {
  return <CartView />;
}
