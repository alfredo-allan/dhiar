import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: pageTitle("Carrinho"),
  description: "Revise seus produtos e confirme o envio do seu pedido.",
};

export default function CartPage() {
  return <CartView />;
}
