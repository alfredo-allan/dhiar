"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { useAddToCart } from "@/hooks/useAddToCart";
import { concentrationLabel, genderLabel } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { PriceBlock } from "./PriceBlock";
import { VariantSelector } from "./VariantSelector";
import { NotesPyramid } from "./NotesPyramid";

interface QuickViewModalProps {
  product: Product;
  initialVariant?: ProductVariant;
  onClose: () => void;
}

/**
 * "Espiar": visualização rápida sem sair da vitrine. Telas pequenas abrem
 * como folha de baixo (bottom sheet, alcance do polegar); médias e grandes,
 * como modal centralizado em duas colunas. Fecha com Esc, clique fora ou X;
 * trava o scroll do fundo e devolve o foco a quem abriu.
 */
export function QuickViewModal({ product, initialVariant, onClose }: QuickViewModalProps) {
  const [selected, setSelected] = useState<ProductVariant | undefined>(initialVariant);
  const [added, setAdded] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const addToCart = useAddToCart();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  const href = `/shop/${product.category}/${product.slug}`;
  const details = [concentrationLabel(product.concentration), genderLabel(product.gender), product.olfactoryFamily]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button
        type="button"
        aria-label="Fechar"
        tabIndex={-1}
        onClick={onClose}
        className="animate-fade-in absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`quickview-${product.id}`}
        className="animate-slide-up relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface shadow-2xl sm:max-w-3xl sm:rounded-3xl"
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Fechar visualização rápida"
          className="tap-target absolute right-3 top-3 z-10 flex items-center justify-center rounded-full bg-surface/80 text-foreground backdrop-blur"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid sm:grid-cols-2">
          <div className="relative aspect-[4/5] bg-surface-2 sm:aspect-auto sm:min-h-[28rem]">
            <ProductImage
              src={product.coverImage ?? product.imageUrl}
              alt={product.title}
              sizes="(min-width: 640px) 384px, 100vw"
            />
          </div>

          <div className="flex flex-col gap-5 p-6 sm:p-8">
            <div>
              {product.brand && (
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">{product.brand.name}</p>
              )}
              <h2 id={`quickview-${product.id}`} className="font-display mt-1 text-3xl leading-tight">
                {product.title}
              </h2>
              {details && <p className="mt-1 text-sm text-muted">{details}</p>}
            </div>

            <VariantSelector
              variants={product.variants ?? []}
              selectedId={selected?.id}
              onSelect={(variant) => {
                setSelected(variant);
                setAdded(false);
              }}
              size="lg"
            />

            <PriceBlock variant={selected} fallbackPrice={product.price} size="lg" />

            <NotesPyramid notes={product.notes} compact />

            <div className="mt-auto flex flex-col gap-2 pt-2">
              <button
                type="button"
                disabled={(product.variants?.length ?? 0) > 0 && !selected?.inStock}
                onClick={() => {
                  addToCart(product, selected);
                  setAdded(true);
                  onClose();
                }}
                className="min-h-12 rounded-full bg-foreground px-6 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-accent-ink disabled:opacity-40"
              >
                {added ? "Adicionado!" : "Adicionar à sacola"}
              </button>
              <Link
                href={href}
                onClick={onClose}
                className="min-h-11 rounded-full px-6 py-3 text-center text-sm font-medium text-foreground underline-offset-4 hover:underline"
              >
                Ver todos os detalhes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
