"use client";

import Link from "next/link";
import { useRef } from "react";
import { gsap, useGSAP, MOTION_QUERIES } from "@/lib/motion";

const TILES = [
  { href: "/shop/perfume-masculino", label: "Masculino", hint: "Amadeirados, aromáticos, frescos" },
  { href: "/shop/perfume-feminino", label: "Feminino", hint: "Florais, gourmands, frutados" },
  { href: "/shop/perfumes-arabes", label: "Árabes", hint: "Oud, âmbar e especiarias" },
  { href: "/shop/perfume-de-nicho", label: "Nicho", hint: "Raros e autorais" },
];

/**
 * Atalhos por categoria. No desktop, as faixas sobem com leve atraso entre
 * si (parallax curto por scrub); em telas menores, só aparecem.
 */
export function CategoryTiles() {
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
    <section ref={rootRef} aria-label="Categorias" className="mx-auto w-full max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {TILES.map((tile, index) => (
          <Link
            key={tile.href}
            href={tile.href}
            data-tile
            className={`group relative flex aspect-[3/4] flex-col justify-end overflow-hidden rounded-app p-5 text-background sm:p-6 ${
              index % 2 === 0 ? "bg-foreground" : "bg-accent-strong"
            }`}
          >
            <span
              aria-hidden
              className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,var(--accent)_0%,transparent_60%)] opacity-50 transition-opacity duration-500 group-hover:opacity-80"
            />
            <span className="font-display relative text-3xl sm:text-4xl">{tile.label}</span>
            <span className="relative mt-1 text-xs text-background/75 sm:text-sm">{tile.hint}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
