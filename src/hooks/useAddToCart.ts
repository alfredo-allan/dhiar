"use client";

import { useCallback } from "react";
import type { Product, ProductVariant } from "@/types";
import { useCart } from "./useCart";

/**
 * Adiciona um volume específico ao carrinho. A linha do carrinho guarda o
 * `variantId` (o checkout manda pro servidor) e usa o rótulo do volume no
 * campo `size`, que já é parte da identidade da linha no CartContext -
 * 50 ml e 100 ml do mesmo perfume ficam em linhas separadas.
 */
export function useAddToCart() {
  const { addItem } = useCart();

  return useCallback(
    (product: Product, variant: ProductVariant | undefined, quantity = 1) => {
      addItem(
        {
          productId: product.id,
          variantId: variant?.id ?? null,
          variantLabel: variant?.label ?? null,
          slug: product.slug,
          title: product.brand ? `${product.brand.name} ${product.title}` : product.title,
          price: variant?.price ?? product.price,
          imageUrl: product.coverImage ?? product.imageUrl,
          color: "",
          size: variant?.label ?? "Único",
        },
        quantity,
      );
    },
    [addItem],
  );
}
