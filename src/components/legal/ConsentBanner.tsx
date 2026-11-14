"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { consentStore, hasValidConsent, saveConsent } from "@/lib/consent";
import { useHydrated } from "@/hooks/useHydrated";

/**
 * Banner de cookies da LGPD: "Aceitar todos" e "Recusar" têm o mesmo peso
 * visual (a ANPD considera indevido esconder a recusa), e "Personalizar"
 * abre as categorias. Fica no rodapé da tela, sem bloquear a compra.
 */
export function ConsentBanner() {
  const consent = useSyncExternalStore(consentStore.subscribe, consentStore.getSnapshot, consentStore.getServerSnapshot);
  const [customizing, setCustomizing] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(false);

  const hydrated = useHydrated();

  // Antes da hidratação não renderiza nada: evita piscar o banner pra quem
  // já decidiu (o servidor não conhece o localStorage).
  if (!hydrated || hasValidConsent(consent)) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Preferências de cookies"
      className="animate-slide-up fixed inset-x-3 bottom-3 z-[60] max-h-[70vh] overflow-y-auto rounded-2xl border border-line bg-surface p-4 shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:max-w-md sm:p-5"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="font-display text-lg sm:text-xl">Sua privacidade</p>
      <p className="mt-1.5 text-xs leading-relaxed text-muted sm:text-sm">
        Usamos cookies necessários para a loja funcionar. Com sua permissão, também usamos cookies de análise e de
        marketing. Saiba mais na{" "}
        <Link href="/politicas/privacidade" className="text-foreground underline underline-offset-2">
          Política de Privacidade
        </Link>
        .
      </p>

      {customizing && (
        <div className="mt-4 space-y-3 rounded-xl bg-surface-2 p-4 text-sm">
          <label className="flex items-start gap-3">
            <input type="checkbox" checked disabled className="mt-1 h-4 w-4" />
            <span><strong>Necessários</strong> - sempre ativos. Sessão, sacola e segurança.</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span><strong>Análise</strong> - entender como a loja é usada (dados agregados).</span>
          </label>
          <label className="flex items-start gap-3">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
            <span><strong>Marketing</strong> - anúncios personalizados (ex.: Meta Pixel).</span>
          </label>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => saveConsent({ analytics: false, marketing: false })}
          className="min-h-11 rounded-full border border-foreground px-2 text-xs font-semibold sm:text-sm"
        >
          Recusar
        </button>
        {customizing ? (
          <button
            type="button"
            onClick={() => saveConsent({ analytics, marketing })}
            className="min-h-11 rounded-full border border-foreground px-2 text-xs font-semibold sm:text-sm"
          >
            Salvar
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setCustomizing(true)}
            className="min-h-11 rounded-full border border-line px-2 text-xs font-medium sm:text-sm"
          >
            Personalizar
          </button>
        )}
        <button
          type="button"
          onClick={() => saveConsent({ analytics: true, marketing: true })}
          className="min-h-11 rounded-full border border-foreground bg-foreground px-2 text-xs font-semibold text-background sm:text-sm"
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}
