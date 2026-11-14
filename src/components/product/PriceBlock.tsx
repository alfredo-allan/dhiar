import type { ProductVariant } from "@/types";
import { formatBRL } from "@/lib/format";

interface PriceBlockProps {
  variant?: ProductVariant;
  /** Preço quando o produto não tem variantes (legado). */
  fallbackPrice?: number;
  size?: "sm" | "lg";
}

/**
 * De/por + preço no Pix + parcelamento, sempre com os números que vêm da
 * API (`variant.pricing`) - o desconto Pix e as parcelas são regras do
 * servidor, o front só exibe.
 */
export function PriceBlock({ variant, fallbackPrice, size = "sm" }: PriceBlockProps) {
  const price = variant?.price ?? fallbackPrice;
  if (price === undefined) return null;
  const compareAt = variant?.compareAtPrice;
  const pricing = variant?.pricing;
  const large = size === "lg";

  return (
    <div className={large ? "space-y-1.5" : "space-y-0.5"}>
      {compareAt && compareAt > price && (
        <p className={`text-muted line-through ${large ? "text-sm" : "text-xs"}`}>
          {formatBRL(compareAt)}
        </p>
      )}
      <p className={`font-semibold tracking-tight text-foreground ${large ? "text-3xl" : "text-lg"}`}>
        {formatBRL(price)}
      </p>
      {pricing && pricing.pixDiscountPercent > 0 && (
        <p className={`text-success ${large ? "text-base" : "text-xs"}`}>
          <span className="font-semibold">{formatBRL(pricing.pixPrice)}</span> no Pix
          <span className="text-muted"> ({pricing.pixDiscountPercent}% off)</span>
        </p>
      )}
      {pricing && pricing.installments.count > 1 && (
        <p className={`text-muted ${large ? "text-sm" : "text-xs"}`}>
          ou {pricing.installments.count}x de {formatBRL(pricing.installments.value)} sem juros
        </p>
      )}
    </div>
  );
}
