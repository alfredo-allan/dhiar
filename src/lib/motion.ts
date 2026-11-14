"use client";

/**
 * Ponto único de registro do GSAP. Importe `gsap`, `ScrollTrigger`,
 * `SplitText` e `useGSAP` daqui, nunca direto do pacote - garante que os
 * plugins são registrados uma vez só, e só no navegador.
 *
 * Regras de uso (ver ROADMAP.md, seção "Movimento"):
 * - sempre dentro de `useGSAP(() => {...}, { scope: ref })` - limpa sozinho
 *   ao desmontar (troca de rota no App Router);
 * - variar por tela com `gsap.matchMedia()` usando os BREAKPOINTS abaixo;
 * - toda animação respeita `prefers-reduced-motion` (condição `reduce`);
 * - animar só `transform`/`opacity` (nunca width/height/top/left);
 * - nunca esconder preço, botão de compra ou frete atrás de animação.
 */
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
}

/** Mesmos cortes do Tailwind: sm 640, lg 1024. */
export const MOTION_QUERIES = {
  small: "(max-width: 639px) and (prefers-reduced-motion: no-preference)",
  medium: "(min-width: 640px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)",
  large: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

export { gsap, ScrollTrigger, SplitText, useGSAP };
