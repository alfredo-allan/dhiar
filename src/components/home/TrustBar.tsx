import { BadgePercent, CreditCard, ShieldCheck, Truck } from "lucide-react";
import type { CommerceSettings } from "@/lib/products";
import { formatBRL } from "@/lib/format";

/** Argumentos de compra logo abaixo do hero - os números vêm da API. */
export function TrustBar({ commerce }: { commerce: CommerceSettings | null }) {
  const items = [
    {
      icon: BadgePercent,
      title: commerce?.pixDiscountPercent ? `${commerce.pixDiscountPercent}% off no Pix` : "Pagamento via Pix",
      text: "Aprovação na hora",
    },
    {
      icon: CreditCard,
      title: `Até ${commerce?.maxInstallments ?? 12}x sem juros`,
      text: "No cartão de crédito",
    },
    {
      icon: Truck,
      title: commerce?.freeShippingThreshold ? `Frete grátis acima de ${formatBRL(commerce.freeShippingThreshold)}` : "Envio para todo o Brasil",
      text: "Com rastreio",
    },
    { icon: ShieldCheck, title: "100% originais", text: "Compra segura" },
  ];

  return (
    <section aria-label="Vantagens" className="border-b border-line bg-surface">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4 lg:px-8">
        {items.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-center gap-3 py-5 sm:py-6">
            <Icon className="h-6 w-6 shrink-0 text-accent" strokeWidth={1.5} aria-hidden />
            <div>
              <p className="text-sm font-semibold leading-tight">{title}</p>
              <p className="text-xs text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
