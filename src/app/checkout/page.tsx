import { pageTitle } from "@/lib/store";
import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: pageTitle("Checkout"),
  description: "Confira os dados do seu pedido antes de finalizar a compra.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
