"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";

/**
 * Contextos globais da loja (sem login de cliente - a compra fecha pelo
 * WhatsApp): sacola e favoritos, ambos guardados no próprio aparelho.
 * O painel admin tem a própria sessão (cookie), fora daqui.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}
