"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { CategoryShowcase } from "@/lib/catalog";
import { CATEGORY_TILES } from "@/lib/categoryTiles";
import { formatBRL } from "@/lib/format";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";


/**
 * Atalhos por categoria, com a cara da marca: fundo escuro, a foto do perfume
 * mais vendido de cada categoria em duotone cobre (fica uniforme mesmo com
 * fotos de fundos diferentes) e a cor real aparecendo no hover. Mostra quantos
 * perfumes há e o "a partir de".
 *
 * Sem foto ainda, a faixa usa a textura de fumaça da marca.
 * Desktop: as faixas sobem com atraso entre si (parallax curto por scrub).
 */
export function CategoryTiles({ showcase = {} }: { showcase?: Record<string, CategoryShowcase> }) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.large, () => {
        gsap.utils.toArray<HTMLElement>("[data-tile]").forEach((tile, index) => {
          gsap.fromTo(
            tile,
            { y: 16 + index * 14 },
            { y: 0, ease: "none", scrollTrigger: { trigger: rootRef.current, start: "top bottom", end: "center center", scrub: 0.8 } },
          );
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-labelledby="categories-title" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Escolha pelo estilo</p>
        <h2 id="categories-title" className="font-display mt-2 text-4xl sm:text-5xl">
          Encontre a sua assinatura
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {CATEGORY_TILES.map((tile, index) => {
          const info = showcase[tile.slug];
          const cover = info?.covers[0];
          return (
            <Link
              key={tile.slug}
              href={`/shop/${tile.slug}`}
              data-tile
              className="group relative isolate flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-app border border-line bg-surface p-4 transition-colors duration-500 hover:border-accent/70 sm:p-6"
            >
              {cover ? (
                <>
                  <Image
                    src={cover}
                    alt=""
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="-z-20 object-cover brightness-[0.7] contrast-125 grayscale transition-[filter,transform] duration-700 ease-out group-hover:scale-105 group-hover:brightness-90 group-hover:grayscale-0"
                  />
                  {/* duotone cobre: deixa as fotos uniformes; some no hover */}
                  <span aria-hidden className="absolute inset-0 -z-10 bg-[#8e4c22] opacity-55 mix-blend-multiply transition-opacity duration-700 group-hover:opacity-15" />
                </>
              ) : (
                <span
                  aria-hidden
                  className="absolute inset-0 -z-20 bg-[url('/images/bg-texture-smoke-1280.webp')] bg-cover opacity-70 transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundPosition: `${15 + index * 22}% 40%` }}
                />
              )}
              {/* véu para o texto ler bem sobre qualquer foto */}
              <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/55 to-[#0b0b0c]/5" />
              <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />

              {info && info.total > 0 && (
                <span className="absolute right-3 top-3 rounded-full border border-accent/40 bg-[#0b0b0c]/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-strong backdrop-blur sm:right-4 sm:top-4 sm:text-[11px]">
                  {info.total} {info.total === 1 ? "perfume" : "perfumes"}
                </span>
              )}

              <span className="font-display text-3xl text-foreground sm:text-4xl">{tile.label}</span>
              <span className="mt-1 text-xs text-foreground/70 sm:text-sm">{tile.hint}</span>
              <span className="mt-4 flex items-center justify-between gap-2 border-t border-foreground/15 pt-3 text-[11px] uppercase tracking-[0.18em] text-foreground/80 sm:text-xs">
                <span>{info?.fromPrice ? `A partir de ${formatBRL(info.fromPrice)}` : "Explorar"}</span>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-accent transition-transform duration-300 group-hover:translate-x-1" fill="none" aria-hidden>
                  <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
