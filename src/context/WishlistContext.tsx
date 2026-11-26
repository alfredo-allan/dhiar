"use client";

import { storageKey } from "@/lib/store";
import { createContext, useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createPersistedStore } from "@/lib/createPersistedStore";

interface WishlistContextValue {
  savedIds: string[];
  isSaved: (productId: string) => boolean;
  toggleSaved: (productId: string) => void;
  /** Mantido por compatibilidade: a lista é local, nunca está "carregando". */
  isLoading: boolean;
}

const wishlistStore = createPersistedStore<string[]>(storageKey("wishlist"), []);

export const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

/**
 * Favoritos guardados no próprio aparelho (localStorage) - sem conta e sem
 * login: a compra é fechada pelo WhatsApp. Funciona offline e é instantâneo.
 */
export function WishlistProvider({ children }: { children: ReactNode }) {
  const savedIds = useSyncExternalStore(wishlistStore.subscribe, wishlistStore.getSnapshot, wishlistStore.getServerSnapshot);

  const toggleSaved = useCallback((productId: string) => {
    wishlistStore.setValue((prev) => (prev.includes(productId) ? prev.filter((id) => id !== productId) : [productId, ...prev]));
  }, []);
  const isSaved = useCallback((productId: string) => savedIds.includes(productId), [savedIds]);

  const value = useMemo(() => ({ savedIds, isSaved, toggleSaved, isLoading: false }), [savedIds, isSaved, toggleSaved]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}
