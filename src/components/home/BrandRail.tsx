"use client";

import Link from "next/link";
import { useRef } from "react";
import type { Brand } from "@/types";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

/**
 * Vitrine de marcas.
 * - Grandes (>=1024): rolagem HORIZONTAL presa ao scroll vertical (pin +
 *   scrub) - o trilho anda na mesma distância que sobra para a direita.
 * - Médias e pequenas: trilho nativo com swipe e scroll-snap (pin
 *   horizontal no toque briga com o gesto do usuário).
 */
export function BrandRail({ brands }: { brands: Brand[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_QUERIES.large, () => {
        const track = trackRef.current;
        if (!track) return;
        const distance = () => Math.max(0, track.scrollWidth - track.clientWidth);
        if (distance() < 40) return;
        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        });
      });
    },
    { scope: rootRef, dependencies: [brands.length] },
  );

  if (brands.length === 0) return null;

  return (
    <section ref={rootRef} aria-labelledby="brands-title" className="overflow-hidden border-y border-line bg-surface">
      <div className="mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center gap-8 px-4 py-14 sm:px-6 lg:min-h-screen lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Casas de perfumaria</p>
            <h2 id="brands-title" className="font-display mt-3 text-4xl sm:text-5xl">Marcas que você ama</h2>
          </div>
          <Link href="/shop/todos" className="hidden text-sm font-medium underline underline-offset-4 sm:inline">
            Ver todas
          </Link>
        </div>

        <div
          ref={trackRef}
          className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:snap-none lg:overflow-visible lg:px-0"
        >
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/shop/todos?marca=${brand.slug}`}
              className="group flex aspect-[3/4] w-44 shrink-0 snap-start flex-col justify-between rounded-app border border-line bg-background p-5 transition-colors hover:border-accent sm:w-56 lg:w-64"
            >
              <span className="text-[11px] uppercase tracking-[0.2em] text-muted">
                {brand.country ?? "Perfumaria"}
              </span>
              <span className="font-display text-3xl leading-tight transition-transform duration-500 group-hover:-translate-y-1 lg:text-4xl">
                {brand.name}
              </span>
              <span className="text-xs text-muted">
                {brand.productCount ? `${brand.productCount} ${brand.productCount === 1 ? "perfume" : "perfumes"}` : "Em breve"}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
