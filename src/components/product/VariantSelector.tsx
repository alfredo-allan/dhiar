"use client";

import type { ProductVariant } from "@/types";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedId?: number | null;
  onSelect: (variant: ProductVariant) => void;
  size?: "sm" | "lg";
  label?: string;
}

/**
 * Escolha de volume (30 ml / 50 ml / 100 ml...). Esgotados continuam
 * visíveis, riscados e desabilitados - o cliente entende que existe o
 * tamanho e pode pedir aviso na PDP.
 */
export function VariantSelector({ variants, selectedId, onSelect, size = "sm", label = "Volume" }: VariantSelectorProps) {
  if (variants.length === 0) return null;
  const large = size === "lg";

  return (
    <fieldset>
      <legend className={`mb-2 font-medium uppercase tracking-[0.18em] text-muted ${large ? "text-xs" : "text-[10px]"}`}>
        {label}
      </legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={!variant.inStock}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onSelect(variant);
              }}
              className={[
                "rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                large ? "min-h-11 px-4 text-sm" : "min-h-8 px-3 text-xs",
                isSelected
                  ? "border-foreground bg-foreground text-background"
                  : "border-line bg-surface text-foreground hover:border-foreground",
                !variant.inStock && "cursor-not-allowed opacity-40 line-through",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {variant.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
