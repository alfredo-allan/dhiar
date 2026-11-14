"use client";

import { useSyncExternalStore } from "react";
import { storageKey } from "./store";

/**
 * Estado do portal de entrada (uma vez por sessão do navegador, como no
 * Scathon). O hero da home espera o portal fechar para começar a animação.
 *
 * O <html> recebe a classe `entry-seen` ANTES da primeira pintura (script em
 * app/layout.tsx), então quem já entrou nesta sessão nunca vê o portal piscar.
 */
export const ENTRY_KEY = storageKey("entry-seen");

const listeners = new Set<() => void>();

function read(): boolean {
  try {
    return window.sessionStorage.getItem(ENTRY_KEY) === "1";
  } catch {
    return false;
  }
}

export function markEntrySeen(): void {
  try {
    window.sessionStorage.setItem(ENTRY_KEY, "1");
  } catch {
    // modo privado sem storage: o portal volta na próxima carga, sem problema
  }
  document.documentElement.classList.add("entry-seen");
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** `true` quando o portal já foi atravessado nesta sessão. No servidor: `false`. */
export function useEntrySeen(): boolean {
  return useSyncExternalStore(subscribe, read, () => false);
}
