import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getCommerceSettings } from "@/lib/products";

export const metadata: Metadata = {
  title: pageTitle("Sacola"),
  description: "Revise seus perfumes e finalize o pedido pelo WhatsApp.",
};

export default async function CartPage() {
  const settings = await getCommerceSettings();
  return <CartView pixDiscountPercent={settings.pixDiscountPercent} />;
}
