"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, SplitText, useGSAP, MOTION_QUERIES } from "@/lib/motion";
import { STORE } from "@/lib/store";

const FLOATING_NOTES = ["Bergamota", "Rosa", "Oud", "Baunilha", "Âmbar"];

/**
 * Hero da home.
 * - Grandes (>=1024): duas colunas; título entra por linhas (SplitText),
 *   frasco com parallax em camadas preso ao scroll (scrub) e notas
 *   flutuando ao redor.
 * - Médias (640-1023): mesma composição empilhada, parallax mais curto.
 * - Pequenas (<640): sem parallax nem pin - só entrada por palavras curta;
 *   os botões aparecem em menos de 0,6 s (nunca esconder a chamada).
 * - `prefers-reduced-motion`: nada anima.
 */
export function HeroPerfume() {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        { large: MOTION_QUERIES.large, medium: MOTION_QUERIES.medium, small: MOTION_QUERIES.small },
        (context) => {
          const { large, small } = context.conditions as { large: boolean; medium: boolean; small: boolean };
          const split = SplitText.create("[data-hero-title]", { type: small ? "words" : "lines,words", mask: small ? undefined : "lines" });

          const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
          intro
            .from(split.words, { yPercent: 110, opacity: 0, duration: small ? 0.5 : 0.9, stagger: small ? 0.03 : 0.05 })
            .from("[data-hero-fade]", { y: 16, opacity: 0, duration: 0.5, stagger: 0.08 }, small ? 0.15 : 0.35)
            .from("[data-hero-bottle]", { y: 40, opacity: 0, scale: 0.94, duration: 1.1 }, 0.1)
            .from("[data-hero-note]", { opacity: 0, scale: 0.6, duration: 0.6, stagger: 0.08 }, 0.6);

          if (!small) {
            // Parallax em camadas preso ao scroll do próprio hero.
            gsap.to("[data-hero-bottle]", {
              yPercent: large ? -14 : -8,
              rotate: large ? -4 : -2,
              ease: "none",
              scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: 0.6 },
            });
            gsap.to("[data-hero-halo]", {
              scale: 1.25,
              opacity: 0.4,
              ease: "none",
              scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
            });
            gsap.utils.toArray<HTMLElement>("[data-hero-note]").forEach((note, index) => {
              gsap.to(note, {
                y: (index % 2 === 0 ? -1 : 1) * (large ? 90 : 50),
                ease: "none",
                scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: 1 },
              });
            });
          }

          return () => split.revert();
        },
      );
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative isolate overflow-hidden border-b border-line bg-gradient-to-b from-surface-2 via-background to-background"
    >
      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:px-8 lg:py-20">
        <div className="relative z-10 max-w-xl">
          <p data-hero-fade className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Perfumaria original
          </p>
          <h1
            data-hero-title
            className="font-display mt-5 text-[2.45rem] leading-[1.04] text-foreground sm:text-5xl lg:text-[4.1rem]"
          >
            Encontre a assinatura que fica depois que você sai.
          </h1>
          <p data-hero-fade className="mt-6 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            {STORE.tagline} Nicho, árabes e grandes casas com desconto no Pix e parcelamento sem juros.
          </p>
          <div data-hero-fade className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/shop/todos"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-foreground px-8 text-sm font-semibold uppercase tracking-[0.14em] text-background transition-colors hover:bg-accent hover:text-accent-ink"
            >
              Ver perfumes
            </Link>
            <Link
              href="/shop/todos?sort=best_sellers"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-foreground/30 px-8 text-sm font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-foreground"
            >
              Mais vendidos
            </Link>
          </div>
        </div>

        <div className="relative mx-auto flex aspect-square w-full max-w-[22rem] items-center justify-center sm:max-w-md lg:max-w-lg">
          <div
            data-hero-halo
            aria-hidden
            className="absolute inset-[8%] rounded-full bg-[radial-gradient(circle_at_50%_45%,var(--accent)_0%,transparent_65%)] opacity-25 blur-2xl"
          />
          <BottleIllustration />
          {FLOATING_NOTES.map((note, index) => (
            <span
              key={note}
              data-hero-note
              aria-hidden
              className="absolute rounded-full border border-line bg-surface/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-foreground shadow-sm backdrop-blur"
              style={NOTE_POSITIONS[index]}
            >
              {note}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

const NOTE_POSITIONS: React.CSSProperties[] = [
  { top: "10%", left: "2%" },
  { top: "22%", right: "0%" },
  { top: "55%", left: "-2%" },
  { bottom: "18%", right: "4%" },
  { bottom: "4%", left: "22%" },
];

/** Frasco ilustrado (substituível por foto/vídeo do produto quando houver). */
function BottleIllustration() {
  return (
    <svg data-hero-bottle viewBox="0 0 240 320" className="relative h-[78%] w-auto drop-shadow-2xl" role="img" aria-label="Frasco de perfume">
      <defs>
        <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.95" />
          <stop offset="55%" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id="liquid" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-strong)" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="cap" x1="0" x2="1">
          <stop offset="0%" stopColor="var(--foreground)" />
          <stop offset="50%" stopColor="var(--muted)" />
          <stop offset="100%" stopColor="var(--foreground)" />
        </linearGradient>
      </defs>
      <rect x="92" y="6" width="56" height="54" rx="6" fill="url(#cap)" />
      <rect x="104" y="60" width="32" height="22" fill="var(--muted)" opacity="0.6" />
      <rect x="28" y="82" width="184" height="228" rx="34" fill="url(#glass)" stroke="var(--line)" strokeWidth="2" />
      <rect x="40" y="150" width="160" height="148" rx="26" fill="url(#liquid)" />
      <rect x="52" y="100" width="14" height="180" rx="7" fill="white" opacity="0.35" />
      <rect x="58" y="182" width="124" height="46" rx="4" fill="var(--surface)" opacity="0.88" />
      <text x="120" y="210" textAnchor="middle" fontFamily="var(--font-display)" fontSize="12" fill="var(--foreground)" letterSpacing="2.5">
        EAU DE PARFUM
      </text>
    </svg>
  );
}
