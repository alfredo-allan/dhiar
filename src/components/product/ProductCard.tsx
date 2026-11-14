"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import type { Product, ProductVariant } from "@/types";
import { useWishlist } from "@/hooks/useWishlist";
import { useAddToCart } from "@/hooks/useAddToCart";
import { defaultVariant } from "@/lib/products";
import { concentrationLabel } from "@/lib/format";
import { ProductImage } from "./ProductImage";
import { PriceBlock } from "./PriceBlock";
import { VariantSelector } from "./VariantSelector";
import { NotifyMeButton } from "./NotifyMeButton";
import { QuickViewModal } from "./QuickViewModal";

interface ProductCardProps {
  product: Product;
  /** Valor mínimo para frete grátis (0 = sem frete grátis). */
  freeShippingThreshold?: number;
  priority?: boolean;
}

/**
 * Card de perfume no padrão de conversão da referência: selo de desconto,
 * frete grátis, seletor de volume, de/por, preço no Pix, parcelas e dois
 * botões - "Comprar" (adiciona direto) e "Espiar" (visualização rápida).
 */
export function ProductCard({ product, freeShippingThreshold = 0, priority }: ProductCardProps) {
  const [selected, setSelected] = useState<ProductVariant | undefined>(() => defaultVariant(product));
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { isSaved, toggleSaved } = useWishlist();
  const addToCart = useAddToCart();

  const href = `/shop/${product.category}/${product.slug}`;
  const variants = product.variants ?? [];
  const isComingSoon = product.availability === "coming_soon";
  const isUnavailable = isComingSoon || product.inStock === false || product.stock === 0;
  const price = selected?.price ?? product.price;
  const discount = selected?.discountPercent ?? 0;
  const hasFreeShipping = freeShippingThreshold > 0 && price >= freeShippingThreshold;
  const isLiked = isSaved(product.id);
  const subtitle = [concentrationLabel(product.concentration), product.isTester ? "Tester" : ""]
    .filter(Boolean)
    .join(" · ");

  return (
    <article
      data-reveal
      className="group relative flex h-full flex-col overflow-hidden rounded-app border border-line bg-surface transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(28,25,22,0.45)]"
    >
      <Link href={href} className="relative block aspect-[4/5] overflow-hidden bg-surface-2">
        <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {isUnavailable ? (
            <span className="rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-background">
              {isComingSoon ? "Em breve" : "Esgotado"}
            </span>
          ) : (
            <>
              {discount > 0 && (
                <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-accent-ink">
                  {discount}% OFF
                </span>
              )}
              {product.isNew && (
                <span className="rounded-full bg-surface/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-foreground backdrop-blur">
                  Novo
                </span>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleSaved(product.id);
          }}
          aria-pressed={isLiked}
          aria-label={isLiked ? "Remover dos favoritos" : "Salvar nos favoritos"}
          className="tap-target absolute right-2 top-2 z-10 flex items-center justify-center rounded-full text-foreground"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/85 backdrop-blur transition-transform hover:scale-110">
            <Heart className={`h-4 w-4 ${isLiked ? "fill-danger text-danger" : ""}`} strokeWidth={1.75} />
          </span>
        </button>

        <ProductImage
          src={product.coverImage ?? product.imageUrl}
          alt={product.title}
          priority={priority}
          className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />

        {hasFreeShipping && !isUnavailable && (
          <span className="absolute bottom-3 left-3 z-10 rounded-full bg-success px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
            Frete grátis
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={href} className="block">
          {product.brand && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{product.brand.name}</p>
          )}
          <h3 className="font-display mt-1 line-clamp-2 min-h-[2.5em] text-xl leading-tight text-foreground">
            {product.title}
          </h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </Link>

        {!isUnavailable && variants.length > 1 && (
          <VariantSelector variants={variants} selectedId={selected?.id} onSelect={setSelected} />
        )}

        <PriceBlock variant={selected} fallbackPrice={product.price} />

        <div className="mt-auto pt-1">
          {isUnavailable ? (
            <NotifyMeButton productId={product.id} size="sm" />
          ) : (
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <button
                type="button"
                onClick={() => addToCart(product, selected)}
                disabled={variants.length > 0 && !selected?.inStock}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-accent hover:text-accent-ink disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Comprar
              </button>
              <button
                type="button"
                onClick={() => setQuickViewOpen(true)}
                aria-label={`Espiar ${product.title}`}
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line px-4 text-sm font-medium text-foreground transition-colors hover:border-foreground"
              >
                <Eye className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                <span className="hidden sm:inline">Espiar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {quickViewOpen && (
        <QuickViewModal
          product={product}
          initialVariant={selected}
          onClose={() => setQuickViewOpen(false)}
        />
      )}
    </article>
  );
}
