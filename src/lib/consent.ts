"use client";

import { createPersistedStore } from "./createPersistedStore";
import { STORE, storageKey } from "./store";

/**
 * Consentimento de cookies (LGPD). "Necessários" (sessão, carrinho, tema)
 * não dependem de consentimento; "análise" e "marketing" (Meta Pixel etc.)
 * só carregam depois do aceite. Mudar `NEXT_PUBLIC_PRIVACY_POLICY_VERSION`
 * invalida as escolhas antigas e o banner volta a aparecer.
 */
export interface ConsentState {
  policyVersion: string | null;
  analytics: boolean;
  marketing: boolean;
  decidedAt: string | null;
  anonymousId: string;
}

function newAnonymousId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export const consentStore = createPersistedStore<ConsentState>(storageKey("consent"), {
  policyVersion: null,
  analytics: false,
  marketing: false,
  decidedAt: null,
  anonymousId: "",
});

export function hasValidConsent(state: ConsentState): boolean {
  return state.policyVersion === STORE.policyVersion && Boolean(state.decidedAt);
}

export function saveConsent(choice: { analytics: boolean; marketing: boolean }): void {
  const current = consentStore.getSnapshot();
  const next: ConsentState = {
    policyVersion: STORE.policyVersion,
    analytics: choice.analytics,
    marketing: choice.marketing,
    decidedAt: new Date().toISOString(),
    anonymousId: current.anonymousId || newAnonymousId(),
  };
  consentStore.setValue(next);
  // A escolha (com data e versão da política) fica registrada no aparelho.
  // Sem servidor próprio, não há cópia remota - o site só carrega o Meta
  // Pixel depois do "Aceitar", então nada é coletado antes do consentimento.
}

/** Reabre o banner (link "Preferências de cookies" no rodapé). */
export function resetConsent(): void {
  const current = consentStore.getSnapshot();
  consentStore.setValue({ ...current, decidedAt: null });
}
