"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { FilmReel, type FilmClip } from "@/components/home/FilmReel";
import { formatBRL } from "@/lib/format";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

interface ArabSpotlightProps {
  products: Product[];
  total: number;
  fromPrice?: number;
  freeShippingThreshold?: number;
  /** Vídeo opcional em /public/videos (ex.: "/videos/perfumaria-arabe.mp4"). */
  videoSrc?: string | null;
  /** Filmes das fragrâncias, em sequência, no topo da seção. */
  reel?: FilmClip[];
}

const HOUSES = ["Lattafa", "Armaf", "Al Wataniah", "Maison Alhambra", "Rasasi", "Al Haramain"];

/**
 * Vitrine editorial da perfumaria árabe - cerca de um quarto do catálogo e o
 * maior diferencial de preço da loja.
 *
 * - Esquerda: o "porquê" (oud, âmbar, açafrão, projeção alta) com as casas e
 *   um CTA; atrás, o vídeo da seção quando existir (mudo, em loop, só com
 *   movimento permitido) ou a textura de fumaça com brilho de cobre.
 * - Direita: trilho de perfumes árabes mais vendidos, com swipe no toque.
 * - Desktop: os cards entram da direita em sequência; setas para navegar.
 *   Celular/tablet: swipe nativo com snap.
 */
export function ArabSpotlight({ products, total, fromPrice, freeShippingThreshold = 0, videoSrc, reel = [] }: ArabSpotlightProps) {
  const rootRef = useRef<HTMLElement>(null);
  const railRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(`${MOTION_QUERIES.small}, ${MOTION_QUERIES.medium}, ${MOTION_QUERIES.large}`, () => {
        gsap.from("[data-arab-copy] > *", {
          y: 28,
          opacity: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: rootRef.current, start: "top 75%" },
        });
      });
      mm.add(MOTION_QUERIES.large, () => {
        // os cards entram da direita, em sequência, quando a seção aparece
        gsap.from("[data-arab-card]", {
          x: 60,
          opacity: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: "power3.out",
          scrollTrigger: { trigger: railRef.current, start: "top 80%" },
        });
      });
    },
    { scope: rootRef },
  );

  const scrollRail = (dir: number) => {
    const rail = railRef.current;
    if (rail) rail.scrollBy({ left: dir * (rail.clientWidth * 0.8), behavior: "smooth" });
  };

  if (products.length === 0) return null;

  return (
    <section ref={rootRef} aria-labelledby="arab-title" className="relative isolate overflow-hidden border-y border-line bg-[#0b0b0c]">
      {/* fundo: vídeo (se houver) ou fumaça + brilho de cobre */}
      {videoSrc ? (
        <video
          className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45 motion-reduce:hidden"
          src={videoSrc}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster="/images/bg-texture-smoke-1280.webp"
          aria-hidden
        />
      ) : null}
      <div
        aria-hidden
        className={`absolute inset-0 -z-20 bg-[url('/images/bg-texture-smoke.webp')] bg-cover bg-[position:12%_45%] opacity-60 ${videoSrc ? "hidden motion-reduce:block" : ""}`}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_50%,rgba(194,123,69,0.22)_0%,transparent_55%),linear-gradient(90deg,rgba(11,11,12,0.35)_0%,rgba(11,11,12,0.85)_55%,#0b0b0c_100%)]" />

      {reel.length > 0 && (
        <div className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 sm:pt-20 lg:px-8 lg:pt-24">
          <FilmReel clips={reel} />
        </div>
      )}
      <div className={`mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)] lg:items-center lg:gap-12 lg:px-8 ${reel.length > 0 ? "lg:pb-28 lg:pt-16" : "lg:py-28"}`}>
        <div data-arab-copy className="max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Perfumaria árabe</p>
          <h2 id="arab-title" className="font-display mt-3 text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Oud, âmbar <span className="text-copper italic">e açafrão.</span>
          </h2>
          <p className="mt-5 text-base leading-relaxed text-foreground/75">
            Fragrâncias intensas, de projeção alta e fixação longa, das casas que conquistaram o mundo -
            originais, com preço que cabe no dia a dia.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Casas árabes">
            {HOUSES.map((house) => (
              <li key={house} className="rounded-full border border-foreground/15 bg-[#0b0b0c]/40 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-foreground/80 backdrop-blur">
                {house}
              </li>
            ))}
          </ul>
          <dl className="mt-8 flex gap-8 border-t border-foreground/10 pt-6">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">Perfumes</dt>
              <dd className="font-display mt-1 text-3xl text-foreground">{total}</dd>
            </div>
            {fromPrice ? (
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-muted">A partir de</dt>
                <dd className="font-display mt-1 text-3xl text-foreground">{formatBRL(fromPrice)}</dd>
              </div>
            ) : null}
          </dl>
          <Link
            href="/shop/perfumes-arabes"
            className="mt-8 inline-flex min-h-12 items-center gap-3 rounded-full bg-accent px-7 text-sm font-semibold uppercase tracking-[0.14em] text-accent-ink transition-[background-color,transform] hover:bg-accent-strong active:scale-[0.97]"
          >
            Explorar árabes
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden>
              <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>

        <div className="relative -mx-4 sm:-mx-6 lg:mx-0">
          <div className="mb-4 hidden justify-end gap-2 lg:flex">
            {[-1, 1].map((dir) => (
              <button
                key={dir}
                type="button"
                onClick={() => scrollRail(dir)}
                aria-label={dir < 0 ? "Perfumes anteriores" : "Próximos perfumes"}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/20 text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${dir < 0 ? "rotate-180" : ""}`} fill="none" aria-hidden>
                  <path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))}
          </div>
          <div
            ref={railRef}
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:gap-5 sm:px-6 lg:px-0"
          >
            {products.slice(0, 6).map((product) => (
              <div key={product.id} data-arab-card className="w-[72vw] max-w-[280px] shrink-0 snap-start sm:w-[42vw] lg:w-[260px]">
                <ProductCard product={product} freeShippingThreshold={freeShippingThreshold} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
